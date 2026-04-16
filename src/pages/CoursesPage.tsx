import { motion } from 'motion/react';
import { Music, Mic, Guitar, Zap, Speaker, Play, Star, Clock, Users, BookOpen, Loader2, Heart, Film, GraduationCap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import FavoriteButton from '../components/FavoriteButton';
import { useIconSettings } from '../hooks/useIconSettings';
import DynamicIcon from '../components/DynamicIcon';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category?: string;
  slug?: string;
  type: 'course' | 'masterclass' | 'entertainment';
}

const categories = [
  { 
    name: 'Teclas', 
    slug: 'teclas',
    icon: Music, 
    count: 'Piano & Teclado', 
    instructor: 'Eder Rios',
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=800',
    color: 'from-blue-500/20'
  },
  { 
    name: 'Cordas', 
    slug: 'cordas',
    icon: Guitar, 
    count: 'Violão & Guitarra', 
    instructor: 'Lucas Almeida',
    image: 'https://images.unsplash.com/photo-1525201548942-d8b8bb097fb3?auto=format&fit=crop&q=80&w=800',
    color: 'from-orange-500/20'
  },
  { 
    name: 'Voz', 
    slug: 'voz',
    icon: Mic, 
    count: 'Canto & Técnica', 
    instructor: 'Mariana Souza',
    image: 'https://images.unsplash.com/photo-1551712702-4b7335dd8706?auto=format&fit=crop&q=80&w=800',
    color: 'from-red-500/20'
  },
  { 
    name: 'Espiritual', 
    slug: 'espiritual',
    icon: Heart, 
    count: 'Teologia & Vida', 
    instructor: 'Pr. Marcos',
    image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=800',
    color: 'from-purple-500/20'
  },
  { 
    name: 'Liderança', 
    slug: 'lideranca',
    icon: Users, 
    count: 'Gestão de Equipes', 
    instructor: 'Equipe AdorePlay',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800',
    color: 'from-yellow-500/20'
  },
  { 
    name: 'Entretenimento', 
    slug: 'entretenimento',
    icon: Film, 
    count: 'Cultura & Lazer', 
    instructor: 'Produção AdorePlay',
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=800',
    color: 'from-green-500/20'
  },
];

export default function CoursesPage() {
  const navigate = useNavigate();
  const { getIcon } = useIconSettings();
  const [dbCourses, setDbCourses] = useState<ContentItem[]>([]);
  const [dbMasterclasses, setDbMasterclasses] = useState<ContentItem[]>([]);
  const [dbEntertainment, setDbEntertainment] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setIsSubscribed(docSnap.data().isSubscribed || docSnap.data().role === 'admin');
          }
        });
        return () => unsubUser();
      } else {
        setIsSubscribed(false);
      }
    });

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, type: 'course', ...doc.data() } as ContentItem));
      setDbCourses(coursesData);
    }, (error) => {
      console.error("Error fetching courses:", error);
    });

    const unsubMasterclasses = onSnapshot(collection(db, 'masterclasses'), (snapshot) => {
      const mcData = snapshot.docs.map(doc => ({ id: doc.id, type: 'masterclass', ...doc.data() } as ContentItem));
      setDbMasterclasses(mcData);
    }, (error) => {
      console.error("Error fetching masterclasses:", error);
    });

    const unsubEntertainment = onSnapshot(collection(db, 'entertainment'), (snapshot) => {
      const entData = snapshot.docs.map(doc => ({ id: doc.id, type: 'entertainment', ...doc.data() } as ContentItem));
      setDbEntertainment(entData);
    }, (error) => {
      console.error("Error fetching entertainment:", error);
    });

    // Set loading to false after a short delay to allow snapshots to initialize
    const timer = setTimeout(() => setLoading(false), 1000);

    return () => {
      unsubscribeAuth();
      unsubCourses();
      unsubMasterclasses();
      unsubEntertainment();
      clearTimeout(timer);
    };
  }, []);

  const hasAnyContent = dbCourses.length > 0 || dbMasterclasses.length > 0 || dbEntertainment.length > 0;

  const getLink = (item: ContentItem) => {
    if (isSubscribed) return `/lesson/${item.id}`;
    if (item.type === 'course') return `/courses/${item.id}`;
    if (item.type === 'masterclass') return `/masterclass/${item.slug}`;
    return `/entertainment/${item.slug}`;
  };

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
            <span className="text-primary font-black text-xs uppercase tracking-[0.3em]">Explore Nosso Catálogo</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9]"
          >
            Seu Próximo <br/>
            <span className="text-primary">Nível na Música</span>
          </motion.h1>
        </header>

        {hasAnyContent ? (
          <>
            {/* Courses Section */}
            {dbCourses.length > 0 && (
              <section className="mb-24">
                <div className="flex items-center gap-3 mb-8">
                  <DynamicIcon name={getIcon('ui_book')} className="text-primary" size={24} />
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Cursos</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {dbCourses.map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <div className="absolute top-3 right-3 z-10">
                          <FavoriteButton contentId={course.id} className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md" />
                        </div>
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <DynamicIcon name={getIcon('teclas')} className="text-white/10" size={32} />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="bg-primary text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">
                            {course.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-white mb-2 line-clamp-1">{course.title}</h3>
                        <p className="text-on-surface-variant text-xs line-clamp-2 mb-4 h-8">{course.description}</p>
                        <Link 
                          to={getLink(course)}
                          className="flex items-center justify-center w-full py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary transition-all"
                        >
                          {isSubscribed ? 'Acessar Aulas' : 'Ver Detalhes'}
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Masterclasses Section */}
            {dbMasterclasses.length > 0 && (
              <section className="mb-24">
                <div className="flex items-center gap-3 mb-8">
                  <GraduationCap className="text-primary" size={24} />
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Masterclasses</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {dbMasterclasses.map((mc, i) => (
                    <motion.div
                      key={mc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <div className="absolute top-3 right-3 z-10">
                          <FavoriteButton contentId={mc.id} className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md" />
                        </div>
                        {mc.thumbnail ? (
                          <img src={mc.thumbnail} alt={mc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <GraduationCap className="text-white/10" size={32} />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="bg-primary text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">
                            Masterclass
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-white mb-2 line-clamp-1">{mc.title}</h3>
                        <p className="text-on-surface-variant text-xs line-clamp-2 mb-4 h-8">{mc.description}</p>
                        <Link 
                          to={getLink(mc)}
                          className="flex items-center justify-center w-full py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary transition-all"
                        >
                          {isSubscribed ? 'Acessar Aulas' : 'Ver Detalhes'}
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Entertainment Section */}
            {dbEntertainment.length > 0 && (
              <section className="mb-24">
                <div className="flex items-center gap-3 mb-8">
                  <Film className="text-primary" size={24} />
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Entretenimento</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {dbEntertainment.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <div className="absolute top-3 right-3 z-10">
                          <FavoriteButton contentId={item.id} className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md" />
                        </div>
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <Film className="text-white/10" size={32} />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="bg-primary text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">
                            Original
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-white mb-2 line-clamp-1">{item.title}</h3>
                        <p className="text-on-surface-variant text-xs line-clamp-2 mb-4 h-8">{item.description}</p>
                        <Link 
                          to={getLink(item)}
                          className="flex items-center justify-center w-full py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary transition-all"
                        >
                          {isSubscribed ? 'Acessar Aulas' : 'Ver Detalhes'}
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {dbCourses.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <DynamicIcon name={getIcon('ui_star')} className="text-primary" size={24} />
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Categorias Principais</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categories.filter(cat => dbCourses.some(c => c.category === cat.slug)).map((cat, i) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface-container-low border border-white/5 hover:border-primary/30 transition-all duration-500"
                    >
                      {/* Background Image */}
                      <img 
                        src={cat.image} 
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent ${cat.color}`}></div>
                      
                      {/* Content */}
                      <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        <div className="mb-6">
                          <div className="w-12 h-12 rounded-xl bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                            <DynamicIcon name={getIcon(cat.slug)} size={24} className="text-primary" />
                          </div>
                          <h3 className="font-headline text-3xl font-black text-white uppercase tracking-tight mb-1">{cat.name}</h3>
                          <div className="flex items-center gap-4 text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1.5">
                              <DynamicIcon name={getIcon('ui_play')} size={12} className="text-primary" />
                              {cat.count}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <DynamicIcon name={getIcon('ui_users')} size={12} className="text-primary" />
                              {cat.instructor}
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            const firstCourseOfCat = dbCourses.find(c => c.category === cat.slug);
                            if (firstCourseOfCat) {
                              navigate(isSubscribed ? `/lesson/${firstCourseOfCat.id}` : `/courses/${firstCourseOfCat.id}`);
                            } else {
                              alert(`Ainda não temos cursos cadastrados na categoria ${cat.name}.`);
                            }
                          }}
                          className="w-full py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-center text-xs font-black uppercase tracking-widest text-white hover:bg-primary hover:border-primary transition-all duration-300"
                        >
                          {isSubscribed ? 'Acessar Aulas' : 'Explorar Aulas'}
                        </button>
                      </div>

                      {/* Hover Badge */}
                      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                          <Star size={10} className="fill-white" />
                          Premium
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-white/5">
            <DynamicIcon name={getIcon('ui_book')} size={48} className="text-white/10 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-white uppercase mb-2">Em Breve</h3>
            <p className="text-on-surface-variant max-w-md mx-auto">Estamos preparando novos conteúdos incríveis para você. Fique ligado!</p>
          </div>
        )}

        {/* Featured Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-12 rounded-3xl bg-surface-container-high border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent"></div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-headline text-4xl font-black text-white uppercase tracking-tight mb-6">
              Ainda não sabe por <br/>
              <span className="text-primary">onde começar?</span>
            </h2>
            <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">
              Nossa inteligência artificial pode criar um plano de estudos personalizado baseado no seu nível atual e nos seus objetivos ministeriais.
            </p>
            <button className="bg-primary text-white font-black px-8 py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-primary/80 transition-all flex items-center gap-3">
              <Zap size={18} className="fill-white" />
              Gerar Meu Plano IA
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
