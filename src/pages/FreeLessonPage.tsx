import { motion } from 'motion/react';
import { Play, Star, CheckCircle, ArrowRight, Music, Users, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function FreeLessonPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    title: 'Aprenda a Adorar com Excelência',
    description: 'Assista a esta aula completa e sinta na prática a metodologia que já ajudou milhares de alunos a realizarem o sonho de tocar.',
    videoUrl: 'https://www.youtube.com/embed/jWPzifiJXvU',
    thumbnail: 'https://images.unsplash.com/photo-1520529611473-d58ff3f47a3e?auto=format&fit=crop&q=80&w=1200'
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'free-lesson'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as any);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching free lesson config:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Helper to extract Video ID and Type
  const getVideoInfo = (url: string) => {
    if (!url) return null;

    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) return { id: ytMatch[1], type: 'youtube' };

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    if (vimeoMatch) return { id: vimeoMatch[1], type: 'vimeo' };

    return null;
  };

  const videoInfo = getVideoInfo(config.videoUrl);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 md:px-8 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6"
          >
            <Star size={14} className="fill-primary" />
            Aula Experimental Gratuita
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-6"
          >
            {config.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-on-surface-variant text-lg max-w-2xl mx-auto leading-relaxed"
          >
            {config.description}
          </motion.p>
        </header>

        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative aspect-video rounded-3xl overflow-hidden bg-surface-container-high border border-white/5 shadow-2xl mb-16 group"
        >
          {!isPlaying ? (
            <div className="absolute inset-0 z-10">
              <img 
                src={config.thumbnail} 
                alt="Free Lesson Thumbnail" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  onClick={() => setIsPlaying(true)}
                  className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_0_50px_rgba(24,165,179,0.5)] hover:scale-110 transition-transform group"
                >
                  <Play size={44} className="fill-white ml-2 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-1">Aula Experimental</p>
                  <h3 className="text-xl font-black text-white uppercase">Conteúdo Demonstrativo</h3>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              className="w-full h-full"
              src={videoInfo?.type === 'youtube' 
                ? `https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&rel=0&modestbranding=1`
                : `https://player.vimeo.com/video/${videoInfo?.id}?autoplay=1`}
              title="Free Lesson Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: Music,
              title: "Método Prático",
              desc: "Aprenda tocando desde o primeiro minuto, sem teorias maçantes."
            },
            {
              icon: Users,
              title: "Comunidade Ativa",
              desc: "Milhares de alunos trocando experiências e evoluindo juntos."
            },
            {
              icon: Clock,
              title: "No Seu Tempo",
              desc: "Acesso 24h por dia para você estudar quando e onde quiser."
            }
          ].map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-surface-container-low border border-white/5 text-center group hover:border-primary/30 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6 group-hover:scale-110 transition-transform">
                <benefit.icon size={32} />
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-3 tracking-tight">{benefit.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative p-12 rounded-3xl bg-surface-container-high border border-white/5 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="font-headline text-4xl font-black text-white uppercase tracking-tight mb-6 leading-tight">
                Gostou da aula? <br/>
                <span className="text-primary">Comece sua jornada hoje!</span>
              </h2>
              <div className="space-y-4 mb-8">
                {[
                  "Acesso a todos os cursos e masterclasses",
                  "Materiais de apoio em PDF e arquivos MIDI",
                  "Suporte direto com os instrutores",
                  "Certificado de conclusão em todos os cursos"
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-on-surface-variant font-medium">
                    <CheckCircle size={18} className="text-primary flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <ShieldCheck size={24} className="text-emerald-400" />
                <p className="text-xs text-on-surface-variant">
                  Garantia incondicional de 7 dias. Se não gostar, devolvemos seu dinheiro.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-6">
              <Link 
                to="/pricing" 
                className="bg-primary hover:bg-primary/80 text-white font-headline font-black px-12 py-6 rounded-2xl shadow-[0_10px_40px_rgba(24,165,179,0.3)] transition-all flex items-center gap-3 group text-xl whitespace-nowrap"
              >
                QUERO ME INSCREVER
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest">
                Planos a partir de R$ 29,90/mês
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
