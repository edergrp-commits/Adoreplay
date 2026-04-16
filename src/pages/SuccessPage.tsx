import { motion } from 'motion/react';
import { CheckCircle2, PlayCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.05)_0%,transparent_70%)]"></div>
      
      <div className="max-w-md w-full text-center relative z-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 relative"
        >
          <CheckCircle2 size={48} className="text-primary" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-primary/20 rounded-full -z-10"
          ></motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">
            Pagamento <span className="text-primary">Confirmado!</span>
          </h1>
          <p className="text-on-surface-variant font-medium leading-relaxed mb-12">
            Parabéns! Sua assinatura foi ativada com sucesso. Você agora tem acesso total a todos os cursos, masterclasses e materiais exclusivos da AdorePlay.
          </p>
        </motion.div>

        <div className="space-y-4">
          <Link 
            to="/courses"
            className="w-full py-5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
          >
            <PlayCircle size={20} />
            Começar a Estudar
          </Link>
          
          <Link 
            to="/dashboard"
            className="w-full py-5 bg-white/5 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            Ir para meu Painel
            <ArrowRight size={16} />
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 flex items-center justify-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]"
        >
          <Sparkles size={14} />
          Bem-vindo à Família AdorePlay
        </motion.div>
      </div>
    </div>
  );
}
