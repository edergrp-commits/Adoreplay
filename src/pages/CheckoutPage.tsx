import { motion } from 'motion/react';
import { CreditCard, ShieldCheck, Zap, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'annual';
  const navigate = useNavigate();
  const [pricing, setPricing] = useState({ 
    monthlyPrice: 49.90, 
    annualPrice: 497.00,
    stripeMonthlyPriceId: '',
    stripeAnnualPriceId: ''
  });
  const [pricingLoading, setPricingLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login?redirect=/checkout');
      } else {
        setIsAuthReady(true);
      }
    });

    const unsubPricing = onSnapshot(doc(db, 'settings', 'pricing'), (docSnap) => {
      if (docSnap.exists()) {
        setPricing(docSnap.data() as any);
      }
      setPricingLoading(false);
    });

    return () => {
      unsubscribe();
      unsubPricing();
    };
  }, [navigate]);

  const handlePayment = async () => {
    if (!auth.currentUser) return;
    setError(null);
    
    const priceId = plan === 'monthly' ? pricing.stripeMonthlyPriceId : pricing.stripeAnnualPriceId;
    
    console.log('DEBUG - Plan:', plan);
    console.log('DEBUG - Price ID from state:', priceId);
    
    if (!priceId) {
      setError(`Erro: ID do preço ou Link não configurado para o plano ${plan}. Verifique o Painel Admin.`);
      return;
    }

    const cleanPriceId = priceId.trim();

    // Support for direct Stripe Payment Links
    if (cleanPriceId.startsWith('http')) {
      console.log('Direct Payment Link detected:', cleanPriceId);
      
      // Add client_reference_id to the payment link if possible
      let finalUrl = cleanPriceId;
      try {
        const url = new URL(cleanPriceId);
        url.searchParams.set('client_reference_id', auth.currentUser.uid);
        url.searchParams.set('prefilled_email', auth.currentUser.email || '');
        finalUrl = url.toString();
      } catch (e) {
        console.warn('Could not add params to payment link', e);
      }
      
      setRedirectUrl(finalUrl);
      setLoading(true);
      
      // Try to open immediately
      const win = window.open(finalUrl, '_blank');
      if (!win) {
        setError('O navegador bloqueou a abertura da página. Por favor, clique no botão azul abaixo para abrir o pagamento.');
        setLoading(false);
      } else {
        // If it worked, we can show a success message
        setTimeout(() => setLoading(false), 2000);
      }
      return;
    }

    setLoading(true);
    
    // Open a blank window immediately to bypass popup blockers
    const stripeWindow = window.open('about:blank', '_blank');
    if (stripeWindow) {
      stripeWindow.document.write('<h1>Conectando ao Stripe...</h1><p>Por favor, aguarde enquanto preparamos seu checkout seguro.</p>');
    }

    console.log('Initiating checkout with:', { userId: auth.currentUser.uid, email: auth.currentUser.email, plan, priceId: cleanPriceId });
    
    // Create an AbortController for a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      if (stripeWindow) stripeWindow.close();
    }, 15000);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          email: auth.currentUser.email,
          plan: plan,
          priceId: cleanPriceId
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.url) {
        console.log('Redirecting to Stripe:', data.url);
        setRedirectUrl(data.url);
        
        if (stripeWindow) {
          stripeWindow.location.href = data.url;
        } else {
          // Fallback if initial window.open failed
          const win = window.open(data.url, '_blank');
          if (!win) {
            window.location.href = data.url;
          }
        }
        
        setTimeout(() => {
          setLoading(false);
        }, 3000);
      } else {
        if (stripeWindow) stripeWindow.close();
        throw new Error(data.error || 'Erro ao criar sessão de checkout');
      }
    } catch (err: any) {
      if (stripeWindow) stripeWindow.close();
      clearTimeout(timeoutId);
      console.error("Error during checkout:", err);
      setLoading(false);
      if (err.name === 'AbortError') {
        setError('A conexão com o servidor demorou muito. Por favor, verifique sua internet e tente novamente.');
      } else {
        setError(err.message || 'Ocorreu um erro inesperado ao processar o pagamento.');
      }
    }
  };

  if (!isAuthReady || pricingLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={48} />
    </div>
  );

  const currentPrice = plan === 'monthly' ? pricing.monthlyPrice : pricing.annualPrice;
  const planLabel = plan === 'monthly' ? 'Mensal' : 'Anual';

  return (
    <div className="min-h-screen pt-32 pb-20 px-8 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <Link to="/pricing" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest mb-12">
          <ArrowLeft size={16} />
          Alterar Plano
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Plan Info */}
          <div className="space-y-8">
            <header>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 mb-4"
              >
                <span className="h-px w-12 bg-primary"></span>
                <span className="text-primary font-black text-xs uppercase tracking-[0.3em]">Checkout Seguro</span>
              </motion.div>
              <h1 className="font-headline text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">
                Você escolheu o <br/>
                <span className="text-primary">Plano {planLabel}</span>
              </h1>
            </header>

            <div className="space-y-4">
              {[
                "Acesso a todos os cursos e masterclasses",
                "Materiais complementares e partituras",
                "Certificados de conclusão inclusos",
                "Comunidade exclusiva de alunos",
                "Novos conteúdos toda semana"
              ].map((benefit, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 text-on-surface-variant"
                >
                  <CheckCircle2 size={20} className="text-primary flex-shrink-0" />
                  <span className="font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <div className="p-8 rounded-2xl bg-surface-container-high border border-primary/30 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <Zap size={40} className="text-primary/10 group-hover:text-primary/20 transition-colors" />
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Resumo do Pedido</span>
                <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                  {plan === 'monthly' ? 'Assinatura Mensal' : 'Assinatura Anual'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">
                  R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-on-surface-variant text-sm font-bold">
                  {plan === 'monthly' ? '/mês' : '/ano'}
                </span>
              </div>
              {plan === 'annual' && (
                <p className="text-primary text-sm font-bold mt-2">Economia garantida de 15%</p>
              )}
              {plan === 'monthly' && (
                <p className="text-primary text-sm font-bold mt-2">Cancele quando quiser</p>
              )}
            </div>
          </div>

          {/* Checkout Form (Stripe Checkout) */}
          <div className="bg-surface-container-low p-8 md:p-10 rounded-3xl border border-white/5 shadow-2xl flex flex-col justify-center">
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
              <CreditCard className="text-primary" />
              Pagamento Seguro
            </h2>

            <div className="space-y-8">
              {redirectUrl && (
                <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-primary space-y-4">
                  <div className="flex items-center gap-2 font-black uppercase tracking-widest text-xs">
                    <Zap size={16} className="fill-primary" />
                    Redirecionando...
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    Estamos te levando para a página de pagamento seguro do Stripe.
                  </p>
                  <a 
                    href={redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-lg shadow-primary/20"
                  >
                    Abrir Checkout Agora
                  </a>
                  <p className="text-[10px] text-center opacity-60 font-bold uppercase tracking-widest">
                    Clique no botão acima se a página não abrir automaticamente.
                  </p>
                </div>
              )}

              {error && !redirectUrl && (
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 space-y-4">
                  <div className="flex items-center gap-2 font-black uppercase tracking-widest text-xs">
                    <ShieldCheck size={16} />
                    Ops! Algo deu errado
                  </div>
                  <p 
                    className="text-sm font-medium leading-relaxed opacity-80"
                    dangerouslySetInnerHTML={{ __html: error }}
                  />
                  
                  <div className="pt-4 border-t border-red-500/10 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Dados de Diagnóstico:</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono opacity-60">
                      <div>Plano: {plan}</div>
                      <div>Price ID: {plan === 'monthly' ? pricing.stripeMonthlyPriceId || 'Vazio' : pricing.stripeAnnualPriceId || 'Vazio'}</div>
                      <div>Auth: {auth.currentUser ? 'Logado' : 'Deslogado'}</div>
                      <div>Email: {auth.currentUser?.email || 'N/A'}</div>
                    </div>
                  </div>

                  <button 
                    onClick={handlePayment}
                    className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {!error && !redirectUrl && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                    Ao clicar no botão abaixo, você será redirecionado para o ambiente seguro do <span className="text-white font-bold">Stripe</span> para concluir sua assinatura.
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-background flex items-center justify-center text-[10px] font-bold">VISA</div>
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-background flex items-center justify-center text-[10px] font-bold">MC</div>
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-background flex items-center justify-center text-[10px] font-bold">PIX</div>
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Processamento Criptografado</span>
                  </div>
                </div>
              )}

              <button 
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-6 bg-primary hover:bg-primary/80 text-white font-headline font-black rounded-xl transition-all uppercase tracking-widest text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.02]"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <Zap size={24} className="fill-white" />
                )}
                {loading ? 'Conectando ao Stripe...' : 'Finalizar com Stripe'}
              </button>

              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-primary" />
                  Ambiente 100% Seguro
                </div>
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" 
                  alt="Powered by Stripe" 
                  className="h-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
