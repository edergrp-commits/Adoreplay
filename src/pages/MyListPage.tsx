import { motion } from 'motion/react';
import { Heart, Play, Star, Clock, Loader2, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import FavoriteButton from '../components/FavoriteButton';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  type: 'course' | 'masterclass' | 'entertainment';
  slug?: string;
  instructor?: string;
  duration?: string;
}

export default function MyListPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [courses, setCourses] = useState<ContentItem[]>([]);
  const [masterclasses, setMasterclasses] = useState<ContentItem[]>([]);
  const [entertainment, setEntertainment] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login?redirect=/my-list');
        return;
      }

      const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
        setLoading(false);
      });

      return () => unsubUser();
    });

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, type: 'course', ...doc.data() } as ContentItem)));
    });

    const unsubMasterclasses = onSnapshot(collection(db, 'masterclasses'), (snapshot) => {
      setMasterclasses(snapshot.docs.map(doc => ({ id: doc.id, type: 'masterclass', ...doc.data() } as ContentItem)));
    });

    const unsubEntertainment = onSnapshot(collection(db, 'entertainment'), (snapshot) => {
      setEntertainment(snapshot.docs.map(doc => ({ id: doc.id, type: 'entertainment', ...doc.data() } as ContentItem)));
    });

    return () => {
      unsubscribeAuth();
      unsubCourses();
      unsubMasterclasses();
      unsubEntertainment();
    };
  }, [navigate]);

  const allContent = useMemo(() => [...courses, ...masterclasses, ...entertainment], [courses, masterclasses, entertainment]);
  const favoriteIds = userData?.favorites || [];
  
  const myFavorites = useMemo(() => {
    return allContent.filter(item => favoriteIds.includes(item.id));
  }, [allContent, favoriteIds]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <Link to="/dashboard" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest mb-8">
            <ArrowLeft size={16} />
            Voltar para Dashboard
          </Link>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <span className="h-px w-12 bg-primary"></span>
            <span className="text-primary font-black text-xs uppercase tracking-[0.3em]">Sua Coleção</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]"
          >
            Minha <span className="text-primary">Lista</span>
          </motion.h1>
        </header>

        {myFavorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {myFavorites.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => {
                  if (item.type === 'course') navigate(`/courses/${item.id}`);
                  else if (item.type === 'masterclass') navigate(`/masterclass/${item.slug}`);
                  else if (item.type === 'entertainment') navigate(`/entertainment/${item.slug}`);
                }}
              >
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={item.thumbnail} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                      <Play size={24} className="fill-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 z-10">
                    <FavoriteButton contentId={item.id} className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md" />
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.type}</span>
                    {item.duration && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{item.duration}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 bg-surface-container-low rounded-3xl border border-dashed border-white/10"
          >
            <Heart size={64} className="text-white/10 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Sua lista está vazia</h2>
            <p className="text-on-surface-variant max-w-md mx-auto mb-8">
              Salve seus cursos e aulas favoritas para acessá-los rapidamente aqui.
            </p>
            <Link 
              to="/courses" 
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/80 transition-all"
            >
              Explorar Conteúdo
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
