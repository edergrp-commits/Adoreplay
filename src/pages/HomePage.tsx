import { motion } from 'motion/react';
import { Play, Star, Plus, Clock, Signal, Music, Volume2, VolumeX, Users, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIconSettings } from '../hooks/useIconSettings';
import DynamicIcon from '../components/DynamicIcon';

function AccessItem({ item, index }: { item: { title: string, description: string }, index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-surface-container-low rounded-lg border border-white/5 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-surface-container-high transition-colors text-left group"
      >
        <div className="flex items-center gap-6">
          <span className="font-headline text-2xl font-black text-white/10 group-hover:text-primary/20">0{index + 1}</span>
          <h4 className="font-bold text-on-surface-variant group-hover:text-white uppercase tracking-tight">{item.title}</h4>
        </div>
        <Plus 
          size={24} 
          className={`text-primary transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} 
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6 pt-2">
          <p className="text-on-surface-variant text-sm leading-relaxed border-l-2 border-primary/30 pl-6">
            {item.description}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  const { getIcon } = useIconSettings();
  const [isMuted, setIsMuted] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Cinematic Hero Header with Video Background */}
      <section className="relative h-[85vh] min-h-[650px] w-full overflow-hidden bg-black">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/OVrGAQ4qrt0?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=OVrGAQ4qrt0&showinfo=0&modestbranding=1&rel=0&enablejsapi=1&iv_load_policy=3`}
            className="absolute top-[55%] left-1/2 w-[100%] h-[100%] min-w-[177.77vh] min-h-[56.25vw] -translate-x-1/2 -translate-y-1/2 pointer-events-none border-none scale-[1.05]"
            allow="autoplay; encrypted-media"
            title="Background Video"
          ></iframe>
        </div>
        
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 hero-vignette opacity-50"></div>
        <div className="absolute inset-0 cinematic-gradient opacity-80"></div>
        
        <div className="relative h-full container mx-auto px-8 md:px-16 flex flex-col justify-end pb-20 pt-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-primary/30 backdrop-blur-sm">
                  CONTEÚDO PREMIUM
                </span>
                <div className="flex items-center gap-1.5 text-on-surface-variant text-sm font-bold tracking-wide">
                  <DynamicIcon name={getIcon('ui_star')} size={16} className="text-primary fill-primary" />
                  <span>Cursos Exclusivos</span>
                </div>
              </div>
              
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-xl"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
            
            <div className="space-y-4">
              <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[0.9] text-white uppercase drop-shadow-2xl">
                Piano para <br/>
                <span className="text-primary">iniciantes</span>
              </h1>
              <p className="text-on-surface-variant text-base md:text-lg font-medium max-w-2xl leading-relaxed">
                Um curso prático para quem nunca tocou piano. Você aprenderá teoria básica, técnica inicial e aplicará tudo em repertórios progressivos desde a primeira aula.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-8 text-on-surface-variant font-bold tracking-widest text-xs uppercase">
              <div className="flex items-center gap-2.5">
                <DynamicIcon name={getIcon('ui_clock')} size={20} className="text-primary" />
                <span>2h 45m</span>
              </div>
              <div className="flex items-center gap-2.5">
                <DynamicIcon name={getIcon('ui_signal')} size={20} className="text-primary" />
                <span>Iniciante</span>
              </div>
              <div className="flex items-center gap-2.5">
                <DynamicIcon name={getIcon('teclas')} size={20} className="text-primary" />
                <span>Piano do Zero</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-5 pt-4">
              <Link to="/pricing" className="bg-accent hover:bg-[#d44642] text-white font-headline font-black px-12 py-5 rounded-xl shadow-[0_10px_40px_rgba(229,85,81,0.3)] transition-all flex items-center gap-3 group text-lg">
                <DynamicIcon name={getIcon('ui_subscribe')} size={24} className="transition-transform group-hover:scale-125 fill-white" />
                ASSINAR AGORA
              </Link>
              <Link to="/free-lesson" className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-headline font-black px-10 py-5 rounded-xl hover:bg-white/20 transition-all flex items-center gap-3 text-lg group">
                <DynamicIcon name={getIcon('ui_play')} size={24} className="text-primary group-hover:scale-110 transition-transform fill-primary" />
                AULA GRÁTIS
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="container mx-auto px-8 -mt-16 relative z-10 pb-24">
        {/* Explore Catalog Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 p-12 rounded-3xl bg-surface-container-high border border-white/5 relative overflow-hidden group cursor-pointer"
          onClick={() => navigate('/courses')}
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <span className="h-px w-12 bg-primary"></span>
              <span className="text-primary font-black text-xs uppercase tracking-[0.3em]">Explore Nosso Catálogo</span>
            </div>
            <h2 className="font-headline text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
              Seu Próximo <br/>
              <span className="text-primary">Nível na Música</span>
            </h2>
            <button className="flex items-center gap-3 text-white font-black text-xs uppercase tracking-widest group-hover:text-primary transition-colors">
              Ver Catálogo Completo
              <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-[0_0_20px_rgba(24,165,179,0.2)] relative group border border-white/5">
              <iframe
                src="https://www.youtube.com/embed/jWPzifiJXvU?modestbranding=1&rel=0&showinfo=0"
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Course Preview"
              ></iframe>
            </div>

            <div className="mt-12 space-y-12">
              <div>
                <h2 className="font-headline text-3xl font-black mb-8 uppercase tracking-tight flex items-center gap-4">
                  <span className="w-2 h-10 bg-primary"></span>
                  O QUE VOCÊ ENCONTRA NA PLATAFORMA
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Acesso organizado a cursos, masterclasses e conteúdos exclusivos em um só lugar.",
                    "Aprenda no seu ritmo com aulas objetivas e progressivas para todos os níveis.",
                    "Repertórios práticos e materiais complementares para aplicar imediatamente.",
                    "Plataforma simples e intuitiva para facilitar sua evolução musical contínua."
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-6 rounded-lg bg-surface-container-low border border-white/5">
                      <DynamicIcon name={getIcon('ui_star')} size={20} className="text-primary flex-shrink-0" />
                      <p className="text-on-surface-variant text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="font-headline text-3xl font-black mb-8 uppercase tracking-tight flex items-center gap-4">
                  <span className="w-2 h-10 bg-primary"></span>
                  VOCÊ TEM ACESSO A:
                </h2>
                <div className="space-y-3">
                  {[
                    { 
                      title: "Cursos", 
                      description: "Formação completa e progressiva para desenvolver técnica, musicalidade e repertório com aulas organizadas por níveis." 
                    },
                    { 
                      title: "Masterclass", 
                      description: "Aulas especiais com conteúdos aprofundados, aplicações práticas e direcionamentos para evolução musical mais rápida." 
                    },
                    { 
                      title: "Entretenimento", 
                      description: "Conteúdos leves e inspiradores com músicas, performances e materiais para motivar e acompanhar sua jornada musical." 
                    }
                  ].map((item, i) => (
                    <AccessItem key={i} item={item} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-surface-container-high p-8 rounded-xl border border-white/5">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary bg-primary/10 flex items-center justify-center">
                  <Music size={32} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-xl text-white leading-tight uppercase">Plataforma Adoreplay</h3>
                  <p className="text-primary text-[10px] font-black uppercase tracking-widest">Ecossistema de Aprendizado</p>
                </div>
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4">SOBRE A PLATAFORMA</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                Uma plataforma simples e organizada para você aprender no seu ritmo, com aulas objetivas, repertórios práticos e conteúdos progressivos. Tenha acesso aos cursos, masterclasses e materiais em um só lugar, facilitando sua evolução musical de forma clara e direta.
              </p>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-primary p-8 rounded-xl border border-white/10 shadow-2xl shadow-primary/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all"></div>
              <h3 className="font-headline font-black text-2xl text-white leading-tight uppercase mb-4 relative z-10">Acesso <br/>Ilimitado</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-8 relative z-10">
                Tenha acesso a todos os cursos, masterclasses e conteúdos exclusivos com nossos planos especiais.
              </p>
              <Link to="/pricing" className="w-full py-4 bg-white text-primary rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-white/90 transition-all relative z-10">
                VER PLANOS
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
