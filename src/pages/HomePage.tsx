import { motion } from 'motion/react';
import { Play, Star, Plus, Clock, Signal, Music, Volume2, VolumeX, Users, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIconSettings } from '../hooks/useIconSettings';
import DynamicIcon from '../components/DynamicIcon';

function AccessItem({ item, index }: { item: { title: string, description: string }, index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden transition-all hover:border-primary/20">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-8 hover:bg-white/5 transition-colors text-left group"
      >
        <div className="flex items-center gap-8">
          <span className="font-modern text-3xl font-bold text-white/5 group-hover:text-primary/10 transition-colors">0{index + 1}</span>
          <h4 className="font-modern font-black text-lg text-white group-hover:text-primary uppercase tracking-widest transition-colors">{item.title}</h4>
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
        <div className="px-8 pb-8 pt-2">
          <p className="text-on-surface-variant text-base leading-relaxed border-l-2 border-primary/20 pl-8 font-body">
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
    <div className="min-h-screen relative glitch-static">
      <div className="fixed inset-0 cyber-grid-bg opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none opacity-30"></div>
      
      {/* Cinematic Hero Header with Video Background */}
      <section className="relative min-h-screen w-full overflow-hidden bg-black border-b border-primary/20 flex flex-col">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/OVrGAQ4qrt0?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=OVrGAQ4qrt0&showinfo=0&modestbranding=1&rel=0&enablejsapi=1&iv_load_policy=3`}
            className="absolute top-[62%] left-1/2 w-full h-full min-w-[177.77vh] min-h-[56.25vw] -translate-x-1/2 -translate-y-1/2 pointer-events-none border-none scale-[1.3] grayscale-[0.2] contrast-[1.1]"
            allow="autoplay; encrypted-media"
            title="Background Video"
          ></iframe>
        </div>
        
        {/* Futuristic Overlays */}
        <div className="absolute inset-0 hero-vignette opacity-80 z-10"></div>
        <div className="absolute inset-0 cinematic-gradient opacity-90 z-10"></div>
        <div className="absolute inset-0 cyber-grid-bg opacity-10 z-20"></div>
        <div className="scanline"></div>
        
        <div className="relative flex-1 container mx-auto px-8 md:px-16 flex flex-col justify-center pt-52 pb-32 z-30">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl space-y-10 md:space-y-12"
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary px-5 py-2 rounded-full text-[10px] font-modern font-bold tracking-[0.2em] uppercase border border-primary/20 backdrop-blur-md shadow-[0_0_20px_rgba(24,165,179,0.1)]">
                  CONTEÚDO PREMIUM
                </span>
              </div>
              
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white hover:text-primary transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} className="animate-pulse" />}
              </button>
            </div>
            
            <div className="space-y-4">
              <span className="text-primary font-modern font-semibold text-xs tracking-[0.3em] uppercase block mb-4 opacity-70">
                Lançamento Exclusivo
              </span>
              <h1 className="font-modern text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-[0.95] text-white uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                Domine <br/>
                <span className="text-primary glow-text">o Teclado</span>
              </h1>
              <div className="w-16 h-1 bg-primary mt-6 shadow-[0_0_15px_rgba(24,165,179,0.5)]"></div>
            </div>

            <p className="text-on-surface-variant text-base md:text-xl font-light max-w-2xl leading-relaxed font-modern tracking-wide border-l border-white/5 pl-8">
              A revolução do aprendizado musical para cristãos. Masterclasses exclusivas com os principais produtores e músicos do cenário nacional.
            </p>
            
            <div className="flex flex-wrap items-center gap-10 text-on-surface-variant font-modern text-[9px] font-semibold uppercase tracking-[0.2em]">
              <div className="flex items-center gap-3 group cursor-help">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                <span className="group-hover:text-primary transition-colors">Áudio High-Fidelity</span>
              </div>
              <div className="flex items-center gap-3 group cursor-help">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                <span className="group-hover:text-primary transition-colors">Qualidade 4K Ultra HD</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 pt-10">
              <Link to="/pricing" className="relative group overflow-hidden">
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="bg-primary text-white font-modern font-bold px-12 py-6 rounded-2xl transition-all flex items-center gap-4 text-lg tracking-widest hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(24,165,179,0.3)] relative z-10">
                  <DynamicIcon name={getIcon('ui_subscribe')} size={26} className="fill-white" />
                  ASSINAR AGORA
                </div>
              </Link>
              <Link to="/free-lesson" className="glass-panel text-white font-modern font-bold px-10 py-6 rounded-2xl border-white/10 hover:bg-white/5 transition-all flex items-center gap-4 text-lg tracking-wider relative z-10 group">
                <Play size={24} className="text-primary group-hover:scale-110 transition-transform" />
                AULA GRÁTIS
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative HUD Elements */}
        <div className="absolute bottom-10 right-10 z-30 hidden lg:block opacity-40">
          <div className="flex flex-col items-end gap-2 font-mono text-[10px] text-primary">
            <span>COORD_X: 43.1972</span>
            <span>COORD_Y: 22.1098</span>
            <div className="w-48 h-px bg-primary/30"></div>
            <span>STABLE_CONNECTION_ESTABLISHED</span>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="container mx-auto px-8 -mt-8 md:-mt-12 relative z-40 pb-32">
        {/* Explore Catalog Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-20 p-1 bg-gradient-to-br from-primary/30 via-transparent to-accent/30 rounded-3xl group"
        >
          <div 
            className="p-16 rounded-[22px] glass-panel relative overflow-hidden group cursor-pointer transition-all duration-500 hover:shadow-[0_0_50px_rgba(24,165,179,0.15)]"
            onClick={() => navigate('/courses')}
          >
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/10 to-transparent"></div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-10">
              <div>
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-px w-16 bg-primary shadow-[0_0_10px_rgba(24,165,179,0.5)]"></div>
                  <span className="text-primary font-modern font-bold text-[10px] uppercase tracking-[0.3em]">CATÁLOGO COMPLETO</span>
                </div>
                <h2 className="font-modern text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.8] mb-4 group-hover:text-primary transition-all duration-700">
                  Próximo <br/>
                  <span className="text-white group-hover:text-primary">Nível</span>
                </h2>
              </div>
              
              <button className="flex items-center gap-6 text-white font-modern font-bold text-sm uppercase tracking-[0.2em] group-hover:text-primary transition-all mb-4">
                EXPLORAR AGORA
                <ArrowRight size={24} className="group-hover:translate-x-4 transition-transform text-primary" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-20">
            <div className="relative p-1 bg-white/5 rounded-2xl group overflow-hidden">
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10 border border-white/5">
                <iframe
                  src="https://www.youtube.com/embed/jWPzifiJXvU?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3"
                  className="w-full h-full border-none opacity-90 hover:opacity-100 transition-opacity"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Course Preview"
                ></iframe>
              </div>
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-primary/30 text-[9px] font-mono text-primary uppercase tracking-widest">
                  LIVE_FEED_01 // SECURE_LINE
                </div>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <h2 className="font-modern text-3xl font-black mb-12 uppercase tracking-tight flex items-center gap-6">
                  <div className="w-12 h-1 bg-primary mt-1"></div>
                  DIFERENCIAIS
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    "Conteúdo 100% organizado para evolução técnica e espiritual.",
                    "Vídeo aulas em altíssima definição para não perder nenhum detalhe.",
                    "Recomendação inteligente baseada no seu progresso musical.",
                    "Materiais em PDF, partituras e guias práticos inclusos."
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 p-10 glass-panel rounded-2xl border-white/5 hover:border-primary/30 transition-all hover:bg-white/5 group">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                        <Signal size={24} />
                      </div>
                      <p className="text-on-surface-variant text-sm leading-relaxed font-modern group-hover:text-white transition-colors">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-10">
                <h2 className="font-modern text-3xl font-black mb-12 uppercase tracking-tight flex items-center gap-6">
                  <div className="w-12 h-1 bg-primary mt-1"></div>
                  CONTEÚDOS
                </h2>
                <div className="space-y-6">
                  {[
                    { 
                      title: "CURSOS COMPLETOS", 
                      description: "Formação completa e progressiva para desenvolver técnica, musicalidade e repertório com aulas organizadas por níveis." 
                    },
                    { 
                      title: "MASTERCLASSES", 
                      description: "Aulas especiais com conteúdos aprofundados, aplicações práticas e direcionamentos para evolução mais rápida." 
                    },
                    { 
                      title: "ENTRETENIMENTO", 
                      description: "Conteúdos leves e inspiradores com performances em 4K para motivar sua jornada musical." 
                    }
                  ].map((item, i) => (
                    <AccessItem key={i} item={{ title: item.title, description: item.description }} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="glass-panel p-10 rounded-3xl border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center group-hover:border-primary/50 transition-all">
                  <Music size={36} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-modern font-black text-xl text-white leading-tight uppercase tracking-tight">SOBRE NÓS</h3>
                  <p className="text-primary text-[10px] font-modern font-bold uppercase tracking-[0.2em] glow-text">A PLATAFORMA</p>
                </div>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-10 font-body">
                Uma experiência imersiva focada em músicos que buscam excelência. Mais que aulas, um ecossistema de evolução.
              </p>
              <div className="flex items-center gap-4 text-[10px] font-modern font-bold text-white/30 tracking-widest">
                <span>CONEXÃO ESTÁVEL</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"></span>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-black border border-primary/30 p-10 rounded-3xl relative overflow-hidden group shadow-[0_0_30px_rgba(24,165,179,0.05)]"
            >
              <h3 className="font-modern font-black text-4xl text-white leading-[0.9] uppercase mb-6 relative z-10">
                ACESSO <br/>
                <span className="text-primary">ILIMITADO</span>
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-10 relative z-10 font-body tracking-wide">
                Desbloqueie todos os módulos, bibliotecas de partituras e conteúdos premium hoje mesmo.
              </p>
              <Link to="/pricing" className="w-full py-6 bg-primary text-white font-modern font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:shadow-[0_10px_30px_rgba(24,165,179,0.3)] transition-all relative z-10 rounded-2xl">
                QUERO ME INSCREVER
                <ArrowRight size={20} className="text-white" />
              </Link>
            </motion.div>

            <div className="bg-surface/40 backdrop-blur-xl p-10 rounded-3xl border border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default">
              <h4 className="text-[10px] font-modern font-bold text-primary uppercase tracking-[0.3em] mb-4">SISTEMA_ATIVO</h4>
              <div className="space-y-2 font-modern text-[9px] text-white/40 overflow-hidden tracking-wider">
                <p># CONEXÃO_SEGURA_ESTABELECIDA</p>
                <p># PROTOCOLOS_DE_CRIPTOGRAFIA_ATIVOS</p>
                <p># SINCRONIZAÇÃO_CLOUD_OK</p>
                <p># BEM_VINDO_AO_FUTURO_DO_LOUVOR</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
