import { motion } from 'motion/react';
import { Layout, BookOpen, Clock, Star, TrendingUp, Play, ChevronRight, Settings, LogOut, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
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
  type: 'course' | 'masterclass' | 'entertainment';
  slug?: string;
  instructor?: string;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { getIcon } = useIconSettings();
  const [userData, setUserData] = useState<any>(null);
  const [courses, setCourses] = useState<ContentItem[]>([]);
  const [masterclasses, setMasterclasses] = useState<ContentItem[]>([]);
  const [entertainment, setEntertainment] = useState<ContentItem[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
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

    const unsubLessons = onSnapshot(collection(db, 'lessons'), (snapshot) => {
      setAllLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson)));
    });

    const timer = setTimeout(() => setLoading(false), 1500);

    return () => {
      unsubscribeAuth();
      unsubCourses();
      unsubMasterclasses();
      unsubEntertainment();
      unsubLessons();
      clearTimeout(timer);
    };
  }, [navigate]);

  const allContent = useMemo(() => [...courses, ...masterclasses, ...entertainment], [courses, masterclasses, entertainment]);
  const completedLessonIds = userData?.completedLessons || [];
  const favoriteIds = userData?.favorites || [];

  const courseProgress = useMemo(() => {
    const progress: Record<string, { completed: number, total: number, lastSeen?: any }> = {};
    
    allLessons.forEach(lesson => {
      if (!progress[lesson.courseId]) {
        progress[lesson.courseId] = { completed: 0, total: 0 };
      }
      progress[lesson.courseId].total += 1;
      if (completedLessonIds.includes(lesson.id)) {
        progress[lesson.courseId].completed += 1;
      }
    });

    return progress;
  }, [allLessons, completedLessonIds]);

  const stats = useMemo(() => {
    const inProgress = Object.values(courseProgress).filter(p => p.completed > 0 && p.completed < p.total).length;
    const completedCount = Object.values(courseProgress).filter(p => p.completed > 0 && p.completed === p.total).length;
    const totalLessonsCompleted = completedLessonIds.length;
    
    // Estimate study hours: 20 mins per lesson
    const studyHours = Math.round((totalLessonsCompleted * 20) / 60);
    
    let level = 'Iniciante';
    if (totalLessonsCompleted > 20) level = 'Avançado';
    else if (totalLessonsCompleted > 5) level = 'Intermediário';

    return [
      { label: 'Cursos em andamento', value: inProgress.toString(), icon: 'ui_book', color: 'text-primary' },
      { label: 'Horas de estudo', value: `${studyHours}h`, icon: 'ui_clock', color: 'text-emerald-400' },
      { label: 'Conquistas', value: completedCount.toString(), icon: 'ui_star', color: 'text-amber-400' },
      { label: 'Nível atual', value: level, icon: 'ui_trending', color: 'text-blue-400' },
    ];
  }, [courseProgress, completedLessonIds]);

  const recentCourses = useMemo(() => {
    const lastWatched = userData?.lastWatchedCourses || {};
    
    return allContent
      .filter(content => {
        const p = courseProgress[content.id];
        return p && p.completed > 0 && p.completed < p.total;
      })
      .map(content => {
        const lastSeenDate = lastWatched[content.id]?.toDate?.();
        let lastSeenText = 'Recentemente';
        
        if (lastSeenDate) {
          const now = new Date();
          const diffInHours = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60));
          if (diffInHours < 1) lastSeenText = 'Agora mesmo';
          else if (diffInHours < 24) lastSeenText = `Há ${diffInHours} horas`;
          else lastSeenText = `Há ${Math.floor(diffInHours / 24)} dias`;
        }

        return {
          id: content.id,
          title: content.title,
          progress: Math.round((courseProgress[content.id].completed / courseProgress[content.id].total) * 100),
          lastSeen: lastSeenText,
          lastSeenDate: lastSeenDate || new Date(0),
          image: content.thumbnail
        };
      })
      .sort((a, b) => b.lastSeenDate.getTime() - a.lastSeenDate.getTime())
      .slice(0, 3);
  }, [allContent, courseProgress, userData?.lastWatchedCourses]);

  const nextMasterclass = useMemo(() => {
    if (masterclasses.length === 0) return null;
    // For now, just pick the last one added as "next"
    return masterclasses[masterclasses.length - 1];
  }, [masterclasses]);

  const myFavorites = useMemo(() => {
    return allContent.filter(item => favoriteIds.includes(item.id)).slice(0, 4);
  }, [allContent, favoriteIds]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 mb-4"
            >
              <span className="h-px w-12 bg-primary"></span>
              <span className="text-primary font-black text-xs uppercase tracking-[0.3em]">Área do Aluno</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-headline text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9]"
            >
              Olá, <br/>
              <span className="text-primary">{userData?.displayName?.split(' ')[0] || 'Aluno'}</span>
            </motion.h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/profile" className="p-3 rounded-xl bg-surface-container-high border border-white/5 text-on-surface-variant hover:text-white transition-colors">
              <Settings size={20} />
            </Link>
            <button 
              onClick={() => auth.signOut()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-container-high border border-white/5 text-on-surface-variant hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-surface-container-low border border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                  <DynamicIcon name={getIcon(stat.icon)} size={24} />
                </div>
              </div>
              <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-white">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-12">
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-headline text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                  <span className="w-2 h-8 bg-primary"></span>
                  CONTINUAR ASSISTINDO
                </h2>
                <Link to="/courses" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Ver todos</Link>
              </div>
              
              <div className="space-y-4">
                {recentCourses.length > 0 ? (
                  recentCourses.map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="group flex items-center gap-6 p-4 rounded-2xl bg-surface-container-low border border-white/5 hover:bg-surface-container-high transition-all cursor-pointer"
                      onClick={() => navigate(`/lesson/${course.id}`)}
                    >
                      <div className="relative w-32 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={course.image} alt={course.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={24} className="text-white fill-white" />
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <h4 className="font-bold text-white mb-2">{course.title}</h4>
                        <div className="flex items-center gap-4">
                          <div className="flex-grow h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-1000" 
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">{course.progress}%</span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-widest">{course.lastSeen}</p>
                      </div>
                      
                      <button className="p-3 rounded-full bg-white/5 text-on-surface-variant group-hover:text-primary group-hover:bg-primary/10 transition-all">
                        <ChevronRight size={20} />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-12 rounded-2xl bg-surface-container-low border border-white/5 text-center">
                    <Play size={48} className="text-white/10 mx-auto mb-4" />
                    <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Você ainda não começou nenhum curso.</p>
                    <Link to="/courses" className="inline-block mt-4 text-primary font-black uppercase tracking-widest text-[10px] hover:underline">Explorar Catálogo</Link>
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-headline text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                  <span className="w-2 h-8 bg-primary"></span>
                  MINHA LISTA
                </h2>
                <Link to="/my-list" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Ver tudo</Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {myFavorites.length > 0 ? (
                  myFavorites.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="group relative aspect-video rounded-2xl overflow-hidden bg-surface-container-low border border-white/5 cursor-pointer"
                      onClick={() => {
                        if (item.type === 'course') navigate(`/courses/${item.id}`);
                        else if (item.type === 'masterclass') navigate(`/masterclass/${item.slug}`);
                        else if (item.type === 'entertainment') navigate(`/entertainment/${item.slug}`);
                      }}
                    >
                      <div className="absolute top-2 right-2 z-10">
                        <FavoriteButton contentId={item.id} className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md" />
                      </div>
                      <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                        <span className="text-primary font-black text-[8px] uppercase tracking-widest mb-1">{item.type}</span>
                        <h4 className="font-bold text-white line-clamp-1">{item.title}</h4>
                      </div>
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={32} className="text-white fill-white" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full p-12 rounded-2xl bg-surface-container-low border border-white/5 text-center">
                    <Star size={48} className="text-white/10 mx-auto mb-4" />
                    <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Sua lista está vazia.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-8 rounded-2xl bg-surface-container-high border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <h3 className="font-headline text-xl font-black text-white uppercase tracking-tight mb-4">Próxima Masterclass</h3>
                {nextMasterclass ? (
                  <>
                    <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                      Não perca a aula ao vivo sobre "{nextMasterclass.title}" com {nextMasterclass.instructor}.
                    </p>
                    <button 
                      onClick={() => navigate(`/masterclass/${nextMasterclass.slug}`)}
                      className="w-full py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary/80 transition-all"
                    >
                      Ver Detalhes
                    </button>
                  </>
                ) : (
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed italic">
                    Nenhuma masterclass agendada no momento.
                  </p>
                )}
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-surface-container-low border border-white/5">
              <h3 className="font-headline text-xl font-black text-white uppercase tracking-tight mb-6">Suporte ao Aluno</h3>
              <div className="space-y-4">
                <a 
                  href="https://wa.me/5500000000000" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left hover:bg-white/10 transition-all group"
                >
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Dúvidas Técnicas</p>
                  <p className="text-xs text-on-surface-variant group-hover:text-white">Falar com suporte</p>
                </a>
                <a 
                  href="https://chat.whatsapp.com/invite/placeholder" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left hover:bg-white/10 transition-all group"
                >
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Comunidade</p>
                  <p className="text-xs text-on-surface-variant group-hover:text-white">Acessar fórum</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
