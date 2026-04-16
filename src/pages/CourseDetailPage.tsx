import { motion } from 'motion/react';
import { useParams, Link } from 'react-router-dom';
import { Music, Mic, Guitar, Zap, Speaker, Play, Star, Clock, CheckCircle2, ArrowLeft, BookOpen, Trophy, Users, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import FavoriteButton from '../components/FavoriteButton';
import { useIconSettings } from '../hooks/useIconSettings';
import DynamicIcon from '../components/DynamicIcon';

interface CourseData {
  title: string;
  description: string;
  thumbnail: string;
  bannerURL?: string;
  category: string;
  instructor?: string;
  instructorPhoto?: string;
  instructorQuote?: string;
  duration?: string;
  lessonsCount?: number;
  topics?: string[];
}

interface LessonData {
  id: string;
  title: string;
  duration: string;
  order: number;
}

export default function CourseDetailPage() {
  const { getIcon } = useIconSettings();
  const { category } = useParams<{ category: string }>();
  const [dbCourse, setDbCourse] = useState<CourseData | null>(null);
  const [dbLessons, setDbLessons] = useState<LessonData[]>([]);
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

    if (!category) {
      setLoading(false);
      return () => unsubscribeAuth();
    }

    const unsubCourse = onSnapshot(doc(db, 'courses', category), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as CourseData;
        setDbCourse(data);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching course details:", error);
      setLoading(false);
    });

    const q = query(collection(db, 'lessons'), where('courseId', '==', category), orderBy('order', 'asc'));
    const unsubLessons = onSnapshot(q, (snapshot) => {
      const lessonsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonData));
      setDbLessons(lessonsData);
    });

    return () => {
      unsubscribeAuth();
      unsubCourse();
      unsubLessons();
    };
  }, [category]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={48} />
    </div>
  );

  if (!dbCourse) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-8">
      <h2 className="text-2xl font-black text-white mb-4 uppercase">Curso não encontrado</h2>
      <Link to="/courses" className="text-primary font-bold hover:underline">Voltar para Cursos</Link>
    </div>
  );

  const course = {
    name: dbCourse.category || 'Curso',
    icon: getIcon(dbCourse.category?.toLowerCase() || 'teclas'),
    title: dbCourse.title || 'Curso AdorePlay',
    description: dbCourse.description || '',
    duration: dbCourse.duration || 'Em breve',
    lessons: dbLessons.length || 0,
    instructor: dbCourse.instructor || 'Eder Rios',
    instructorPhoto: dbCourse.instructorPhoto || 'https://picsum.photos/seed/instructor/200/200',
    quote: dbCourse.instructorQuote || 'Minha missão é capacitar músicos para que a técnica seja apenas um canal para a adoração genuína.',
    image: dbCourse.bannerURL || dbCourse.thumbnail || 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=1200',
    topics: dbCourse.topics || [
      'Acesso organizado a cursos e conteúdos exclusivos.',
      'Aprenda no seu ritmo com aulas objetivas.',
      'Materiais complementares para aplicação prática.',
      'Plataforma intuitiva para sua evolução musical.'
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full overflow-hidden">
        <img 
          src={course.image} 
          alt={course.title}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
        
        <div className="relative h-full container mx-auto px-8 flex flex-col justify-end pb-16">
          <Link to="/courses" className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-8 hover:translate-x-[-4px] transition-transform">
            <ArrowLeft size={16} />
            Voltar para Cursos
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center">
                  <DynamicIcon name={course.icon} size={24} className="text-primary" />
                </div>
                <span className="text-primary font-black uppercase tracking-[0.3em] text-xs">Curso de {course.name}</span>
              </div>
              
              <FavoriteButton contentId={category || ''} showText={true} />
            </div>
            
            <h1 className="font-headline text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-tight mb-6">
              {course.title}
            </h1>
            
            <div className="flex flex-wrap gap-6 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <DynamicIcon name={getIcon('ui_clock')} size={16} className="text-primary" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <DynamicIcon name={getIcon('ui_book')} size={16} className="text-primary" />
                <span>{course.lessons} Aulas</span>
              </div>
              <div className="flex items-center gap-2">
                <DynamicIcon name={getIcon('ui_star')} size={16} className="text-primary fill-primary" />
                <span>4.9 (Avaliação)</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-12">
            <div>
              <h2 className="font-headline text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-primary"></span>
                Sobre o Curso
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                {course.description}
              </p>
            </div>

            <div>
              <h2 className="font-headline text-2xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-primary"></span>
                O que você vai dominar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.topics.map((topic: string, i: number) => (
                  <div key={i} className="flex gap-4 p-6 rounded-xl bg-surface-container-low border border-white/5">
                    <CheckCircle2 size={20} className="text-primary flex-shrink-0" />
                    <p className="text-on-surface-variant text-sm font-medium leading-relaxed">{topic}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-surface-container-high border border-white/5">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary">
                  <img src={course.instructorPhoto} alt={course.instructor} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-headline text-xl font-black text-white uppercase">{course.instructor}</h3>
                  <p className="text-primary text-[10px] font-black uppercase tracking-widest">Instrutor Principal</p>
                </div>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed italic">
                "{course.quote || 'Minha missão é capacitar músicos para que a técnica seja apenas um canal para a adoração genuína. Neste curso, compartilho tudo o que aprendi em anos de ministério.'}"
              </p>
            </div>
          </div>

          {/* Sidebar / CTA */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              <div className="p-8 rounded-2xl bg-surface-container-high border border-primary/30 shadow-[0_20px_50px_rgba(24,165,179,0.1)]">
                <div className="text-center mb-8">
                  <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em]">ACESSO VITALÍCIO</span>
                  <div className="text-4xl font-black text-white mt-2">R$ 497,00</div>
                  <p className="text-primary text-xs font-bold mt-1">Ou 12x de R$ 49,90</p>
                </div>
                
                <div className="space-y-4">
                  {isSubscribed ? (
                    <Link 
                      to={category ? `/lesson/${category}` : '#'} 
                      className="block w-full py-5 bg-primary hover:bg-primary/80 text-white text-center font-headline font-black rounded-xl transition-all uppercase tracking-widest text-sm shadow-lg"
                    >
                      Acessar Aulas
                    </Link>
                  ) : (
                    <Link 
                      to="/checkout" 
                      className="block w-full py-5 bg-accent hover:bg-accent/80 text-white text-center font-headline font-black rounded-xl transition-all uppercase tracking-widest text-sm shadow-lg"
                    >
                      Assinar Agora
                    </Link>
                  )}
                  <Link 
                    to="/free-lesson"
                    className="block w-full py-5 bg-white/5 hover:bg-white/10 text-white text-center font-headline font-black rounded-xl transition-all uppercase tracking-widest text-sm border border-white/10"
                  >
                    Assistir Aula Grátis
                  </Link>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                  <div className="flex items-center gap-3 text-on-surface-variant text-xs font-bold uppercase tracking-wide">
                    <Trophy size={16} className="text-primary" />
                    <span>Certificado Incluso</span>
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant text-xs font-bold uppercase tracking-wide">
                    <Users size={16} className="text-primary" />
                    <span>Comunidade de Alunos</span>
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
