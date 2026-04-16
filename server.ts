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
