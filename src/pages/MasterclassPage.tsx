import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useIconSettings } from '../hooks/useIconSettings';
import DynamicIcon from '../components/DynamicIcon';
import { GraduationCap, Heart, Play, Star, Clock, Users, ArrowRight, Library, Layout, Mic, Loader2 } from 'lucide-react';
import FavoriteButton from '../components/FavoriteButton';

interface Masterclass {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructor: string;
  duration: string;
  thumbnail: string;
  bannerURL?: string;
}

export default function MasterclassPage() {
  const { getIcon } = useIconSettings();
  const [dbMasterclasses, setDbMasterclasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'masterclasses'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Masterclass));
      setDbMasterclasses(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching masterclasses:", error);
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
    <div className="min-h-screen pt-32 pb-20 px-8">
      <div className="container mx-auto">
        <header className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <span className="h-px w-12 bg-primary"></span>
            <span className="text-primary font-black text-xs uppercase tracking-[0.3em]">Conteúdo Especializado</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9]"
          >
            Nossas <br/>
            <span className="text-primary">Masterclasses</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-on-surface-variant text-lg max-w-2xl leading-relaxed"
          >
            Aulas intensivas e aprofundadas com foco em temas específicos do ministério cristão e da música sacra.
          </motion.p>
        </header>

        {dbMasterclasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dbMasterclasses.map((mc, i) => (
              <motion.div
                key={mc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface-container-low border border-white/5 hover:border-primary/30 transition-all duration-500"
              >
                {/* Background Image */}
                <div className="absolute top-4 right-4 z-20">
                  <FavoriteButton contentId={mc.id} className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md" />
                </div>
                <img 
                  src={mc.thumbnail} 
                  alt={mc.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent from-emerald-500/20`}></div>
                
                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                      <DynamicIcon name={getIcon('ui_masterclass')} size={24} className="text-primary" />
                    </div>
                    <h3 className="font-headline text-2xl font-black text-white uppercase tracking-tight mb-2 leading-tight">{mc.title}</h3>
                    <p className="text-on-surface-variant text-xs mb-4 line-clamp-2 font-medium leading-relaxed">
                      {mc.description}
                    </p>
                    <div className="flex items-center gap-4 text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <DynamicIcon name={getIcon('ui_clock')} size={12} className="text-primary" />
                        {mc.duration}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <DynamicIcon name={getIcon('ui_users')} size={12} className="text-primary" />
                        {mc.instructor}
                      </span>
                    </div>
                  </div>

                  <Link 
                    to={`/masterclass/${mc.slug}`}
                    className="w-full py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-center text-xs font-black uppercase tracking-widest text-white hover:bg-primary hover:border-primary transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Play size={14} className="fill-white" />
                    Ver Detalhes
                  </Link>
                </div>

                {/* Hover Badge */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                    <Star size={10} className="fill-white" />
                    Masterclass
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-white/5">
            <GraduationCap size={48} className="text-white/10 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-white uppercase mb-2">Em Breve</h3>
            <p className="text-on-surface-variant max-w-md mx-auto">Novas masterclasses exclusivas estão sendo preparadas para você.</p>
          </div>
        )}

        {/* CTA Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-12 rounded-3xl bg-surface-container-high border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="font-headline text-4xl font-black text-white uppercase tracking-tight mb-6">
                Acesso total a <br/>
                <span className="text-primary">todo o conteúdo</span>
              </h2>
              <p className="text-on-surface-variant text-lg mb-0 leading-relaxed">
                Assine o plano anual e tenha acesso imediato a todas as masterclasses, cursos e materiais exclusivos da plataforma.
              </p>
            </div>
            <Link to="/courses" className="bg-primary text-white font-black px-10 py-5 rounded-xl uppercase tracking-widest text-xs hover:bg-primary/80 transition-all flex items-center gap-3 whitespace-nowrap">
              Ver Planos de Assinatura
              <ArrowRight size={18} />
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
