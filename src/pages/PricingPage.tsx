import { motion } from 'motion/react';
import { Check, Zap, Star, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';

interface PricingPlan {
  monthlyPrice: number;
  annualPrice: number;
}

export default function PricingPage() {
  const [pricing, setPricing] = useState<PricingPlan>({ monthlyPrice: 49.90, annualPrice: 497.00 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'pricing'), (docSnap) => {
      if (docSnap.exists()) {
        setPricing(docSnap.data() as PricingPlan);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pricing:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-8">
      <div className="container mx-auto max-w-6xl">
        <header className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6"
          >
            <Zap size={14} className="fill-primary" />
            Acesso Ilimitado
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-tight mb-6"
          >
            Escolha Seu <span className="text-primary">Plano</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-on-surface-variant text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Tenha acesso a todos os cursos, masterclasses e conteúdos exclusivos da AdorePlay. 
            Escolha o plano que melhor se adapta à sua jornada ministerial.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="relative p-8 rounded-3xl bg-surface-container-low border border-white/5 flex flex-col hover:border-white/20 transition-all group"
          >
            <div className="mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Plano Mensal</h3>
              <p className="text-on-surface-variant text-xs font-medium">Acesso flexível mês a mês</p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">R$</span>
                <span className="text-5xl font-black text-white tracking-tighter">
                  {pricing.monthlyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-on-surface-variant text-sm font-bold">/mês</span>
              </div>
            </div>

            <ul className="space-y-4 mb-12 flex-1">
              {[
                'Todos os cursos inclusos',
                'Masterclasses exclusivas',
                'Certificados digitais',
                'Suporte na plataforma',
                'Cancele quando quiser'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-on-surface-variant text-sm font-medium">
                  <Check size={18} className="text-primary" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link 
              to="/checkout?plan=monthly"
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all border border-white/10 text-center"
            >
              Assinar Mensal
            </Link>
          </motion.div>

          {/* Annual Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative p-8 rounded-3xl bg-surface-container-high border-2 border-primary shadow-[0_0_40px_rgba(24,165,179,0.15)] flex flex-col hover:scale-[1.02] transition-all"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2">
              <Star size={12} className="fill-white" />
              Melhor Custo-Benefício
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Plano Anual</h3>
              <p className="text-on-surface-variant text-xs font-medium">O caminho completo para sua evolução</p>
            </div>
            
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">R$</span>
                <span className="text-5xl font-black text-white tracking-tighter">
                  {pricing.annualPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-on-surface-variant text-sm font-bold">/ano</span>
              </div>
              <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-2">
                Equivale a R$ {(pricing.annualPrice / 12).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}/mês
              </p>
            </div>

            <ul className="space-y-4 mb-12 flex-1">
              {[
                'Tudo do plano mensal',
                'Desconto de 15% no total',
                'Acesso antecipado a lançamentos',
                'Comunidade VIP de alunos',
                'Materiais em PDF para download'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-on-surface-variant text-sm font-medium">
                  <Check size={18} className="text-primary" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link 
              to="/checkout?plan=annual"
              className="w-full py-4 bg-primary hover:bg-primary/80 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-primary/20 text-center"
            >
              Assinar Anual
            </Link>
          </motion.div>
        </div>

        <footer className="mt-20 text-center space-y-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-on-surface-variant text-sm font-medium">Ainda com dúvidas sobre a metodologia?</p>
            <Link 
              to="/free-lesson" 
              className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs hover:underline"
            >
              Assista uma aula experimental gratuita
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 text-on-surface-variant text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              Pagamento Seguro
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-primary" />
              7 Dias de Garantia
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
