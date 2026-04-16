import { motion } from 'motion/react';
import { useParams, Link } from 'react-router-dom';
import { Mic, Users, Film, Play, Star, Clock, CheckCircle2, ArrowLeft, Trophy, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import FavoriteButton from '../components/FavoriteButton';

export default function EntertainmentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [dbContent, setDbContent] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsSubscribed(userDoc.data().isSubscribed || userDoc.data().role === 'admin');
        }
      } else {
        setIsSubscribed(false);
      }
    });

    const fetchData = async () => {
      if (!slug) return;
      
      try {
        const q = query(collection(db, 'entertainment'), where('slug', '==', slug), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setDbContent({ id: doc.id, ...doc.data() });
        }
      } catch (error) {
        console.error("Error fetching entertainment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => unsubscribe();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={48} />
    </div>
  );

  const content = dbContent;

  if (!content) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-8">
      <h2 className="text-2xl font-black text-white mb-4 uppercase">Conteúdo não encontrado</h2>
      <Link to="/entertainment" className="text-primary font-bold hover:underline">Voltar para Entretenimento</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full overflow-hidden">
        <img 
          src={content.bannerURL || content.image} 
          alt={content.title}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        
        <div className="relative h-full container mx-auto px-8 flex flex-col justify-end pb-16">
          <Link to="/entertainment" className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-8 hover:translate-x-[-4px] transition-transform">
            <ArrowLeft size={16} />
            Voltar para Entretenimento
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center">
                  {(() => {
                    const Icon = content.icon || Film;
                    return <Icon size={24} className="text-primary" />;
                  })()}
                </div>
                <span className="text-primary font-black uppercase tracking-[0.3em] text-xs">Cultura & Lazer</span>
              </div>
              
              <FavoriteButton contentId={content.id} showText={true} />
            </div>
            
            <h1 className="font-headline text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-tight mb-6">
              {content.title}
            </h1>
            
            <div className="flex flex-wrap gap-6 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <span>{content.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-primary fill-primary" />
                <span>Conteúdo Original</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-12">
            <div>
              <h2 className="font-headline text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-primary"></span>
                Sobre este Conteúdo
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                {content.description}
              </p>
            </div>

            <div>
              <h2 className="font-headline text-2xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-primary"></span>
                Destaques do Episódio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.topics.map((topic: string, i: number) => (
                  <div key={i} className="flex gap-4 p-6 rounded-xl bg-surface-container-low border border-white/5">
                    <CheckCircle2 size={20} className="text-primary flex-shrink-0" />
                    <p className="text-on-surface-variant text-sm font-medium leading-relaxed">{topic}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <div className="p-8 rounded-2xl bg-surface-container-high border border-primary/30 shadow-[0_20px_50px_rgba(24,165,179,0.1)]">
                <div className="text-center mb-8">
                  <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">ACESSO PREMIUM</span>
                  <div className="text-4xl font-black text-white mt-2">Incluso</div>
                  <p className="text-primary text-xs font-bold mt-1">Para todos os assinantes</p>
                </div>
                
                <div className="space-y-4">
                  {isSubscribed ? (
                    <Link 
                      to={`/lesson/${content.id}`}
                      className="w-full py-5 bg-primary hover:bg-primary/80 text-white text-center font-headline font-black rounded-xl transition-all uppercase tracking-widest text-sm shadow-lg flex items-center justify-center gap-2"
                    >
                      <Play size={18} className="fill-white" />
                      Assistir Agora
                    </Link>
                  ) : (
                    <Link 
                      to="/checkout" 
                      className="block w-full py-5 bg-accent hover:bg-accent/80 text-white text-center font-headline font-black rounded-xl transition-all uppercase tracking-widest text-sm shadow-lg"
                    >
                      Assinar para Assistir
                    </Link>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                  <div className="flex items-center gap-3 text-on-surface-variant text-xs font-bold uppercase tracking-wide">
                    <Trophy size={16} className="text-primary" />
                    <span>Produção Original</span>
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant text-xs font-bold uppercase tracking-wide">
                    <Star size={16} className="text-primary" />
                    <span>Qualidade 4K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
