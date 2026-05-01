import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy load Firebase Admin and Stripe
let db: admin.firestore.Firestore | null = null;
let stripe: Stripe | null = null;

const getDb = () => {
  if (!db) {
    try {
      const configPath = path.join(__dirname, 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (!admin.apps.length) {
          admin.initializeApp({
            projectId: firebaseConfig.projectId,
          });
        }
        db = admin.firestore(firebaseConfig.firestoreDatabaseId);
        console.log('Firebase Admin initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
    }
  }
  return db;
};

const getStripe = () => {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
      console.error('STRIPE_SECRET_KEY is missing');
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    console.log('Initializing Stripe with key starting with:', key.substring(0, 7));
    stripe = new Stripe(key);
    console.log('Stripe client initialized');
  }
  return stripe;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Debug status (DO NOT EXPOSE SECRETS, just check if they exist)
  app.get('/api/debug-status', (req, res) => {
    res.json({
      stripeKeySet: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
      firebaseConfigExists: fs.existsSync(path.join(__dirname, 'firebase-applet-config.json')),
      nodeEnv: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });

  // Webhook endpoint needs raw body for signature verification
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    console.log('--- WEBHOOK ARRIVED ---');
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

    console.log('Signature present:', !!sig);
    console.log('Secret present:', !!webhookSecret);
    if (webhookSecret) {
      console.log('Secret prefix:', webhookSecret.substring(0, 10) + '...');
    }

    if (!sig || !webhookSecret) {
      console.error('ERROR: Missing stripe-signature or webhook secret');
      return res.status(400).send('Missing stripe-signature or webhook secret');
    }

    try {
      console.log('Body type:', typeof req.body);
      console.log('Is Buffer:', Buffer.isBuffer(req.body));
      console.log('Body length:', req.body?.length);
      
      const stripeClient = getStripe();
      console.log('Constructing event...');
      const event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log('Event constructed successfully:', event.type);

      // Handle the event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // When using Payment Links, the userId is likely in client_reference_id
        // When using Checkout Sessions API, it's usually in metadata.userId
        const userId = session.metadata?.userId || session.client_reference_id;
        const plan = session.metadata?.plan || 'mensal'; // Default to mensal if not found
        const email = session.customer_details?.email;
        const stripeCustomerId = session.customer as string;
        const firestore = getDb();

        console.log('Webhook Processing Checkout Completed:', {
          sessionId: session.id,
          userId: userId,
          plan: plan,
          email: email
        });

        if (userId && firestore) {
          try {
            await firestore.collection('subscriptions').doc(userId).set({
              userId,
              email,
              status: 'active',
              plan,
              stripeCustomerId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              paymentStatus: 'paid',
              sessionId: session.id,
              isTestMode: !session.livemode
            }, { merge: true });

            await firestore.collection('users').doc(userId).update({
              isSubscribed: true,
              subscriptionPlan: plan,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`SUCCESS: Subscription activated for user: ${userId}`);
          } catch (dbError: any) {
            console.error('DATABASE ERROR during webhook:', dbError.message);
          }
        } else {
          console.warn('WARNING: Missing userId or Firestore instance in webhook.', { userId, hasFirestore: !!firestore });
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error(`WEBHOOK FATAL ERROR: ${err.message}`);
      if (err.stack) console.error(err.stack);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Regular JSON parsing for other routes
  app.use(express.json());

  app.post('/api/create-checkout-session', async (req, res) => {
    console.log('--- New Checkout Request ---');
    console.log('Body:', JSON.stringify(req.body));
    
    const { userId, email, plan, priceId } = req.body;

    if (!userId || !email || !plan || !priceId) {
      console.error('Missing fields:', { userId, email, plan, priceId });
      return res.status(400).json({ error: 'Missing required fields (userId, email, plan, or priceId)' });
    }

    try {
      const stripeClient = getStripe();
      const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';
      
      console.log('--- CREATING STRIPE SESSION ---');
      console.log('User:', email);
      console.log('Plan:', plan);
      console.log('Price ID:', priceId);
      console.log('Origin:', origin);
      
      if (!priceId || !priceId.startsWith('price_')) {
        console.warn('CRITICAL: Invalid Price ID:', priceId);
        return res.status(400).json({ error: `ID de preço inválido: ${priceId}. Deve começar com 'price_'. Verifique o Painel Admin.` });
      }

      console.log('Calling Stripe API...');
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: (plan === 'mensal' || plan === 'anual' || plan === 'monthly' || plan === 'annual') ? 'subscription' : 'payment',
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cancel`,
        customer_email: email,
        metadata: {
          userId,
          plan,
        },
      });

      console.log('Stripe API Response received. Session ID:', session.id);
      res.json({ url: session.url });
    } catch (err: any) {
      console.error('STRIPE API ERROR:', err);
      res.status(500).json({ 
        error: err.message,
        code: err.code,
        type: err.type
      });
    }
  });

  // Helper for Panda API Authentication
  const pandaFetch = async (url: string, apiKey: string, options: any = {}) => {
    const cleanKey = apiKey.trim();
    const baseHeaders = {
      ...options.headers,
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Node.js/PandaProxy)'
    };

    const attempts = [
      { 'Authorization': cleanKey },                
      { 'Authorization': `Bearer ${cleanKey}` },
      { 'token': cleanKey },                        
      { 'Pandas-Token': cleanKey },                 
      { 'pandas-token': cleanKey },                 
      { 'panda-token': cleanKey },                  
      { 'x-api-key': cleanKey },
      { 'x-panda-token': cleanKey },
      { 'api-key': cleanKey },
      { 'apikey': cleanKey }
    ];

    let lastResponse: any = null;
    
    for (const authHeader of attempts) {
      try {
        const headerName = Object.keys(authHeader)[0];
        console.log(`[Panda Proxy] Tentando ${url} via ${headerName}`);
        
        const response = await fetch(url, { 
          ...options, 
          headers: { ...baseHeaders, ...authHeader },
          signal: AbortSignal.timeout(15000)
        });
        
        if (response.ok) {
          console.log(`[Panda Proxy] Sucesso via ${headerName}`);
          return response;
        }
        
        const errorBody = await response.clone().text().catch(() => 'no body');
        console.warn(`[Panda Proxy] Falha via ${headerName}: ${response.status} - ${errorBody.substring(0, 250)}`);
        
        lastResponse = response;
        // Keep trying on 401/403/400
        if (![401, 403, 400].includes(response.status)) break;
        
      } catch (e: any) {
        console.error('[Panda Proxy] Erro na tentativa:', e.message);
      }
    }
    
    return lastResponse || new Response(JSON.stringify({ message: 'Erro de conexão persistente' }), { status: 502 });
  };

  // Panda Video API Proxy
  app.post('/api/panda/test', async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API Key missing' });
    
    try {
      // Trying to list videos as a connection test - using a cleaner URL
      const response = await pandaFetch('https://api-v2.pandavideo.com.br/videos', apiKey);

      if (response.ok) {
        return res.json({ status: 'ok' });
      }

      // Read the body to get more info
      const errorData = await response.json().catch(() => ({}));
      console.error('Panda API Test Failed after all attempts:', response.status, errorData);
      
      let errorMessage = 'Falha na conexão com Panda Video.';
      if (response.status === 401) errorMessage = 'Chave de API Inválida. Verifique se copiou a chave correta no Dashboard da Panda.';
      if (response.status === 403) errorMessage = 'Acesso Proibido. Sua chave pode não ter permissão para listar vídeos.';
      if (response.status === 400) errorMessage = 'Requisição Inválida (Bad Request). A Panda rejeitou o formato da chamada.';
      
      res.status(response.status).json({ 
        error: errorMessage,
        details: errorData.message || errorData.error || `Status HTTP: ${response.status}`,
        raw: errorData
      });

    } catch (error: any) {
      console.error('Internal error testing Panda API:', error);
      res.status(500).json({ error: 'Erro técnico interno: ' + error.message });
    }
  });

  app.post('/api/panda/video-info', async (req, res) => {
    const { apiKey, videoId } = req.body;
    if (!apiKey || !videoId) return res.status(400).json({ error: 'Missing apiKey or videoId' });
    try {
      const response = await pandaFetch(`https://api-v2.pandavideo.com.br/videos/${videoId}`, apiKey);
      if (response.ok) {
        const data = await response.json();
        res.json({ title: data.title || data.name || 'Vídeo sem título' });
      } else {
        res.status(response.status).json({ error: 'Vídeo não encontrado' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/panda/sync', async (req, res) => {
    const { apiKey, teachers, startDate, endDate } = req.body;
    if (!apiKey || !teachers || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required sync parameters' });
    }

    try {
      const results = [];

      for (const teacher of teachers) {
        let totalViews = 0;
        let totalMinutes = 0;

        for (const videoId of (teacher.videoIds || [])) {
          try {
            const url = `https://api-v2.pandavideo.com.br/videos/${videoId}/analytics?start_date=${startDate}&end_date=${endDate}`;
            const response = await pandaFetch(url, apiKey);
            
            if (response.ok) {
              const stats = await response.json();
              // Support multiple field names as Panda API behavior varies
              // plays often used in V2 analytics for views
              const views = Number(stats.plays ?? stats.views ?? 0);
              // watch_time is often returned in seconds or sometimes named differently
              const watchTimeRaw = Number(stats.watch_time ?? stats.watch_time_seconds ?? 0);
              
              totalViews += views;
              totalMinutes += Math.round(watchTimeRaw / 60);
              console.log(`Panda Sync [${teacher.id}]: video ${videoId} -> ${views} views, ${watchTimeRaw}s`);
            }
          } catch (e) {
            console.error(`Error fetching analytics for video ${videoId}:`, e);
          }
        }
        results.push({ teacherId: teacher.id, views: totalViews, minutes: totalMinutes });
      }
      res.json({ results });
    } catch (error: any) {
      console.error('Sync error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
