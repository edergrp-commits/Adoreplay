import { motion } from 'motion/react';
import { Play, CheckCircle, Lock, Star, ArrowRight, FileText, Music, Users, Volume2, Maximize, Settings, SkipForward, SkipBack, Loader2, ArrowLeft, AlertTriangle, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, orderBy, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import FavoriteButton from '../components/FavoriteButton';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor?: string;
  type?: 'courses' | 'masterclasses' | 'entertainment';
  slug?: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  order: number;
  status?: 'completed' | 'playing' | 'locked';
  resources?: { title: string, url: string }[];
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: any;
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string, lessonId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [optimisticCompleted, setOptimisticCompleted] = useState<string[] | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'resources' | 'discussion'>('description');
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

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

  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }

      if (!user) {
        navigate('/login?redirect=' + window.location.pathname);
        setUserData(null);
        setIsAdmin(false);
        return;
      }

      unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setOptimisticCompleted(null);
          const isUserAdmin = data?.role === 'admin';
          setIsAdmin(isUserAdmin);
          
          const isSubscribed = data?.isSubscribed || isUserAdmin;
          if (!isSubscribed) {
            navigate('/checkout');
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubUser) unsubUser();
    };
  }, [navigate]);

  useEffect(() => {
    if (!courseId) return;

    const fetchContent = async () => {
      setLoading(true);
      try {
        // Try courses first
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          setCourse({ id: courseSnap.id, type: 'courses', ...courseSnap.data() } as Course);
          return;
        }

        // Try masterclasses
        const mcRef = doc(db, 'masterclasses', courseId);
        const mcSnap = await getDoc(mcRef);
        if (mcSnap.exists()) {
          setCourse({ id: mcSnap.id, type: 'masterclasses', ...mcSnap.data() } as Course);
          return;
        }

        // Try entertainment
        const entRef = doc(db, 'entertainment', courseId);
        const entSnap = await getDoc(entRef);
        if (entSnap.exists()) {
          setCourse({ id: entSnap.id, type: 'entertainment', ...entSnap.data() } as Course);
          return;
        }

        setError('Conteúdo não encontrado');
      } catch (err) {
        console.error("Error fetching content:", err);
        setError('Erro ao carregar conteúdo');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();

    const q = query(collection(db, 'lessons'), where('courseId', '==', courseId), orderBy('order', 'asc'));
    const unsubLessons = onSnapshot(q, (snapshot) => {
      const lessonsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
      setLessons(lessonsData);

      if (lessonsData.length === 0) {
        setError('Este curso ainda não possui aulas cadastradas.');
      } else {
        setError(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'lessons');
    });

    return () => unsubLessons();
  }, [courseId]);

  // Effect to handle current lesson selection
  useEffect(() => {
    if (lessons.length === 0) return;

    if (lessonId) {
      const found = lessons.find(l => l.id === lessonId);
      setCurrentLesson(found || lessons[0]);
    } else {
      setCurrentLesson(lessons[0]);
      if (lessons[0]) {
        navigate(`/lesson/${courseId}/${lessons[0].id}`, { replace: true });
      }
    }
  }, [lessons, lessonId, courseId, navigate]);

  // Separate effect for comments to handle currentLesson changes
  useEffect(() => {
    if (!currentLesson?.id) return;

    setCommentsLoading(true);
    setCommentsError(null);

    const commentsQ = query(
      collection(db, 'comments'), 
      where('lessonId', '==', currentLesson.id)
    );

    const unsubComments = onSnapshot(commentsQ, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      // Client-side sort
      commentsData.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setComments(commentsData);
      setCommentsLoading(false);
    }, (error) => {
      console.error("Error fetching comments:", error);
      setCommentsError("Não foi possível carregar os comentários.");
      setCommentsLoading(false);
    });

    return () => unsubComments();
  }, [currentLesson?.id]);

  const handleToggleComplete = async () => {
    if (!auth.currentUser || !currentLesson) return;
    const currentCompleted = userData?.completedLessons || [];
    const isCurrentlyCompleted = currentCompleted.includes(currentLesson.id);
    
    // Optimistic update
    const nextCompleted = isCurrentlyCompleted 
      ? currentCompleted.filter((id: string) => id !== currentLesson.id)
      : [...currentCompleted, currentLesson.id];
    
    setOptimisticCompleted(nextCompleted);

    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(userRef, {
        completedLessons: isCurrentlyCompleted ? arrayRemove(currentLesson.id) : arrayUnion(currentLesson.id)
      });
    } catch (err) {
      setOptimisticCompleted(null);
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !currentLesson || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addDoc(collection(db, 'comments'), {
        lessonId: currentLesson.id,
        courseId: courseId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Usuário',
        userPhoto: auth.currentUser.photoURL || '',
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'comments');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={48} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-8">
      <h2 className="text-2xl font-black text-white mb-4 uppercase">{error}</h2>
      <div className="flex flex-col gap-4">
        <Link to="/courses" className="text-primary font-bold hover:underline">Voltar para a lista de cursos</Link>
        {isAdmin && error.includes('aulas') && (
          <Link to="/admin" className="bg-primary text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/80 transition-all">
            Ir para o Painel Admin para adicionar aulas
          </Link>
        )}
      </div>
    </div>
  );

  if (!course || !currentLesson) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-8">
      <h2 className="text-2xl font-black text-white mb-4 uppercase">Curso não encontrado</h2>
      <Link to="/courses" className="text-primary font-bold hover:underline">Voltar para a lista de cursos</Link>
    </div>
  );

  const videoInfo = getVideoInfo(currentLesson.videoUrl);

  const getBackLink = () => {
    if (!course) return '/courses';
    if (course.type === 'masterclasses') return `/masterclass/${course.slug}`;
    if (course.type === 'entertainment') return `/entertainment/${course.slug}`;
    return `/courses/${course.id}`;
  };

  const getBackLabel = () => {
    if (!course) return 'Voltar para Cursos';
    if (course.type === 'masterclasses') return 'Voltar para Masterclass';
    if (course.type === 'entertainment') return 'Voltar para Entretenimento';
    return 'Voltar para Detalhes do Curso';
  };

  const getVimeoThumbnail = (id: string) => {
    // Note: Vimeo thumbnails usually require an API call, but we can use a placeholder
    // or hope the user provides a thumbnail in the course data.
    // For now, we'll use a generic music placeholder if it's Vimeo.
    return `https://vumbnail.com/${id}.jpg`;
  };

  return (
    <main className="pt-28 pb-12 px-4 md:px-16 max-w-[1600px] mx-auto w-full">
      <div className="mb-8 flex items-center justify-between">
        <Link to={getBackLink()} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={16} />
          {getBackLabel()}
        </Link>
        <FavoriteButton contentId={courseId || ''} showText={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Video Player Container */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl group border border-white/5">
            {!isPlaying ? (
              <div className="absolute inset-0 z-10">
                {videoInfo ? (
                  <img 
                    className="w-full h-full object-cover opacity-60" 
                    src={videoInfo.type === 'youtube' 
                      ? `https://img.youtube.com/vi/${videoInfo.id}/maxresdefault.jpg` 
                      : getVimeoThumbnail(videoInfo.id)}
                    alt="Lesson Thumbnail"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                    <Music size={64} className="text-white/10" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={async () => {
                      setIsPlaying(true);
                      if (auth.currentUser && courseId) {
                        const userRef = doc(db, 'users', auth.currentUser.uid);
                        try {
                          await updateDoc(userRef, {
                            [`lastWatchedCourses.${courseId}`]: serverTimestamp()
                          });
                        } catch (err) {
                          console.error("Error updating last watched:", err);
                        }
                      }
                    }}
                    className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_0_30px_rgba(24,165,179,0.5)] transform transition-transform"
                  >
                    <Play size={44} className="fill-white ml-2" />
                  </motion.button>
                </div>
                
                {/* Overlay Info */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-primary font-black text-[10px] uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Aula {currentLesson.order}</span>
                    <h2 className="text-2xl font-black text-white">{currentLesson.title}</h2>
                  </div>
                  <span className="text-white/60 font-mono text-sm">{currentLesson.duration}</span>
                </div>
              </div>
            ) : (
              <iframe
                className="w-full h-full"
                src={videoInfo?.type === 'youtube' 
                  ? `https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&rel=0&modestbranding=1`
                  : `https://player.vimeo.com/video/${videoInfo?.id}?autoplay=1`}
                title={currentLesson.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-container-low p-8 rounded-2xl border border-white/5">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{currentLesson.title}</h1>
              <p className="text-on-surface-variant flex items-center gap-2 font-medium">
                <Star size={16} className="text-primary fill-primary" />
                {course.title} • {course.instructor || 'Eder Rios'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setActiveTab('discussion');
                  setTimeout(() => {
                    document.getElementById('discussion-form')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 text-on-surface hover:bg-white/10 transition-all border border-white/5 font-bold"
              >
                <Users size={18} />
                Dúvidas
              </button>
              <button 
                onClick={handleToggleComplete}
                className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg active:scale-95 transition-all font-bold ${
                  (optimisticCompleted || userData?.completedLessons || []).includes(currentLesson.id)
                    ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                    : 'bg-primary text-white hover:brightness-110'
                }`}
              >
                <CheckCircle size={18} />
                {(optimisticCompleted || userData?.completedLessons || []).includes(currentLesson.id) ? 'Aula Concluída' : 'Concluir Aula'}
              </button>
            </div>
          </div>

          <div className="bg-surface-container-low p-8 rounded-2xl space-y-6 border border-white/5">
            <div className="flex border-b border-white/5">
              <button 
                onClick={() => setActiveTab('description')}
                className={`px-8 py-3 font-bold transition-all ${
                  activeTab === 'description' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                Descrição
              </button>
              <button 
                onClick={() => setActiveTab('resources')}
                className={`px-8 py-3 font-bold transition-all ${
                  activeTab === 'resources' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                Recursos
              </button>
              <button 
                onClick={() => setActiveTab('discussion')}
                className={`px-8 py-3 font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'discussion' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-white'
                }`}
              >
                Discussão
                {comments.length > 0 && (
                  <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full">
                    {comments.length}
                  </span>
                )}
              </button>
            </div>
            
            <div className="text-on-surface-variant leading-relaxed min-h-[200px]">
              {activeTab === 'description' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <p>{currentLesson.description || 'Nenhuma descrição disponível para esta aula.'}</p>
                </motion.div>
              )}

              {activeTab === 'resources' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {currentLesson.resources && currentLesson.resources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentLesson.resources.map((resource, i) => (
                        <a 
                          key={i} 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{resource.title}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black">Download / Link</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                      <FileText size={48} className="mb-4" />
                      <p className="font-bold uppercase tracking-widest text-xs">Nenhum recurso disponível para esta aula</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'discussion' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <form id="discussion-form" onSubmit={handleAddComment} className="space-y-4">
                    <div className="flex gap-4">
                      <img 
                        src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName || 'U'}&background=random`} 
                        alt="User" 
                        className="w-10 h-10 rounded-full border border-white/10"
                      />
                      <div className="flex-grow space-y-3">
                        <textarea 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="O que você achou desta aula? Deixe sua dúvida ou comentário..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-primary outline-none transition-all resize-none h-24"
                        />
                        <div className="flex justify-end">
                          <button 
                            type="submit"
                            disabled={isSubmittingComment || !newComment.trim()}
                            className="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all disabled:opacity-50"
                          >
                            {isSubmittingComment ? 'Enviando...' : 'Publicar Comentário'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  <div className="space-y-6">
                    {commentsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                        <Loader2 size={32} className="animate-spin mb-4" />
                        <p className="font-bold uppercase tracking-widest text-xs">Carregando comentários...</p>
                      </div>
                    ) : commentsError ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-red-500/60">
                        <AlertTriangle size={48} className="mb-4" />
                        <p className="font-bold uppercase tracking-widest text-xs">{commentsError}</p>
                      </div>
                    ) : comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 group">
                          <img 
                            src={comment.userPhoto || `https://ui-avatars.com/api/?name=${comment.userName}&background=random`} 
                            alt={comment.userName} 
                            className="w-10 h-10 rounded-full border border-white/10"
                          />
                          <div className="flex-grow space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{comment.userName}</span>
                                <span className="text-[10px] text-on-surface-variant font-mono">
                                  {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Agora mesmo'}
                                </span>
                              </div>
                              {(isAdmin || auth.currentUser?.uid === comment.userId) && (
                                <button 
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-on-surface-variant hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                >
                                  Excluir
                                </button>
                              )}
                            </div>
                            <p className="text-on-surface-variant text-sm leading-relaxed">{comment.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                        <Users size={48} className="mb-4" />
                        <p className="font-bold uppercase tracking-widest text-xs">Seja o primeiro a comentar!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-high rounded-2xl overflow-hidden shadow-xl border border-white/10">
            <div className="p-6 bg-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Lista de Aulas</h2>
              <span className="text-sm font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full">Progresso</span>
            </div>
            <div className="h-1.5 w-full bg-white/5">
              <div 
                className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_rgba(24,165,179,0.5)]"
                style={{ width: `${lessons.length > 0 ? ((optimisticCompleted || userData?.completedLessons || []).filter((id: string) => lessons.some(l => l.id === id)).length / lessons.length) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
              {lessons.map((lesson) => (
                <div 
                  key={lesson.id} 
                  onClick={() => {
                    navigate(`/lesson/${courseId}/${lesson.id}`);
                    setIsPlaying(false);
                  }}
                  className={`flex items-center gap-4 p-4 transition-all cursor-pointer group ${
                    currentLesson.id === lesson.id ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    currentLesson.id === lesson.id ? 'bg-primary text-white' : 
                    (optimisticCompleted || userData?.completedLessons || []).includes(lesson.id) ? 'bg-green-500 text-white' :
                    'border border-white/10 text-on-surface-variant group-hover:border-primary/50'
                  }`}>
                    {(optimisticCompleted || userData?.completedLessons || []).includes(lesson.id) ? <CheckCircle size={16} /> : (currentLesson.id === lesson.id ? <Play size={16} className="fill-white" /> : lesson.order)}
                  </div>
                  <div className="flex-grow">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      currentLesson.id === lesson.id ? 'text-primary' : 'text-on-surface-variant'
                    }`}>
                      {currentLesson.id === lesson.id ? 'Tocando Agora' : `Aula ${lesson.order}`}
                    </span>
                    <p className={`text-sm font-bold line-clamp-1 transition-colors ${
                      currentLesson.id === lesson.id ? 'text-white' : 'text-on-surface-variant group-hover:text-white'
                    }`}>
                      {lesson.title}
                    </p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono font-bold">{lesson.duration}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/20 to-surface-container-high p-6 rounded-2xl border border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Music size={80} />
            </div>
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2 relative z-10">
              <Star size={20} className="fill-primary" />
              Nota do Instrutor
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed italic relative z-10">
              "A música é a linguagem do coração. Pratique com dedicação e deixe sua alma se expressar através das notas."
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
