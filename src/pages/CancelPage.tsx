import { motion } from 'motion/react';
import { XCircle, ArrowLeft, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-8 relative overflow-hidden">
      <div className="max-w-md w-full text-center relative z-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <XCircle size={48} className="text-red-500" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">
            Pagamento <span className="text-red-500">Cancelado</span>
          </h1>
          <p className="text-on-surface-variant font-medium leading-relaxed mb-12">
            O processo de pagamento foi interrompido. Nenhuma cobrança foi realizada. Se você teve algum problema técnico, nossa equipe está pronta para ajudar.
          </p>
        </motion.div>

        <div className="space-y-4">
          <Link 
            to="/pricing"
            className="w-full py-5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
          >
            Tentar Novamente
          </Link>
          
          <Link 
            to="/"
            className="w-full py-5 bg-white/5 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            <ArrowLeft size={16} />
            Voltar para o Início
          </Link>
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">Precisa de ajuda?</p>
          <a 
            href="mailto:suporte@adoreplay.com.br"
            className="flex items-center justify-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] hover:underline"
          >
            <MessageSquare size={14} />
            Falar com Suporte
          </a>
        </div>
      </div>
    </div>
  );
}
