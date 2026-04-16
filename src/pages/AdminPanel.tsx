import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  getDocFromCache,
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, 
  Plus, 
  Edit2, 
  Trash2, 
  Video, 
  Image as ImageIcon, 
  ChevronRight, 
  Save, 
  X,
  Loader2,
  ShieldCheck,
  BookOpen,
  PlayCircle,
  Upload,
  Camera,
  Zap,
  MessageSquare,
  Bell,
  Users,
  User as UserIcon
} from 'lucide-react';

import DynamicIcon from '../components/DynamicIcon';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  bannerURL?: string;
  category: string;
  instructor?: string;
  instructorPhoto?: string;
  instructorQuote?: string;
  duration?: string;
  topics?: string[];
  createdAt: any;
}

interface Masterclass {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  bannerURL?: string;
  instructor?: string;
  instructorPhoto?: string;
  instructorQuote?: string;
  duration?: string;
  topics?: string[];
  createdAt: any;
}

interface Entertainment {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  bannerURL?: string;
  instructor?: string;
  duration?: string;
  topics?: string[];
  createdAt: any;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  order: number;
  resources?: { title: string, url: string }[];
  createdAt: any;
}

interface Comment {
  id: string;
  lessonId: string;
  courseId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: any;
}

interface LibraryResource {
  id: string;
  title: string;
  category: 'partitura' | 'cifra' | 'kit-voz' | 'multitrack';
  fileUrl: string;
  thumbnail?: string;
  description?: string;
  createdAt: any;
}

export default function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'masterclasses' | 'entertainment' | 'pricing' | 'comments' | 'free-lesson' | 'library' | 'notifications' | 'footer' | 'icons' | 'students'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [entertainment, setEntertainment] = useState<Entertainment[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [libraryResources, setLibraryResources] = useState<LibraryResource[]>([]);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [notificationForm, setNotificationForm] = useState({
    userId: 'all',
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    link: ''
  });
  const [footerForm, setFooterForm] = useState({
    description: '',
    instagram: '',
    youtube: '',
    facebook: '',
    email: '',
    phone: '',
    location: ''
  });
  const [iconsForm, setIconsForm] = useState<Record<string, string>>({
    teclas: 'Music',
    cordas: 'Guitar',
    voz: 'Mic',
    espiritual: 'Heart',
    lideranca: 'Users',
    entretenimento: 'Film',
    ui_play: 'Play',
    ui_heart: 'Heart',
    ui_star: 'Star',
    ui_clock: 'Clock',
    ui_users: 'Users',
    ui_masterclass: 'GraduationCap',
    ui_entertainment: 'Film',
    ui_book: 'BookOpen',
    ui_trending: 'TrendingUp',
    ui_subscribe: 'Star',
    ui_signal: 'Signal'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    type: 'course' | 'masterclass' | 'entertainment' | 'lesson' | 'library';
    id: string;
    title: string;
  }>({ show: false, type: 'course', id: '', title: '' });
  const [commentDeleteConfirm, setCommentDeleteConfirm] = useState<{ show: boolean; id: string }>({ show: false, id: '' });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingMasterclass, setEditingMasterclass] = useState<Masterclass | null>(null);
  const [editingEntertainment, setEditingEntertainment] = useState<Entertainment | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingLibrary, setEditingLibrary] = useState<LibraryResource | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingInstructorPhoto, setUploadingInstructorPhoto] = useState(false);
  const [uploadingResourceIndex, setUploadingResourceIndex] = useState<number | null>(null);
  const [uploadingLibraryFile, setUploadingLibraryFile] = useState(false);
  const [uploadingLibraryThumbnail, setUploadingLibraryThumbnail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const instructorPhotoInputRef = useRef<HTMLInputElement>(null);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);
  const libraryThumbnailInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [courseForm, setCourseForm] = useState({ 
    title: '', 
    description: '', 
    thumbnail: '', 
    bannerURL: '',
    category: 'teclas',
    instructor: 'Eder Rios',
    instructorPhoto: '',
    instructorQuote: '',
    duration: '',
    topics: '' // Will be split by newline
  });

  const [masterclassForm, setMasterclassForm] = useState({ 
    slug: '',
    title: '', 
    description: '', 
    thumbnail: '', 
    bannerURL: '',
    instructor: 'Equipe AdorePlay',
    instructorPhoto: '',
    instructorQuote: '',
    duration: '',
    topics: '' 
  });

  const [entertainmentForm, setEntertainmentForm] = useState({ 
    slug: '',
    title: '', 
    description: '', 
    thumbnail: '', 
    bannerURL: '',
    instructor: 'Produção AdorePlay',
    duration: '',
    topics: '' 
  });

  const [lessonForm, setLessonForm] = useState({ 
    title: '', 
    description: '', 
    videoUrl: '', 
    duration: '', 
    order: 1,
    resources: [] as { title: string, url: string }[]
  });
  const [pricingForm, setPricingForm] = useState({ 
    monthlyPrice: 49.90, 
    annualPrice: 497.00,
    stripeMonthlyPriceId: '',
    stripeAnnualPriceId: ''
  });
  const [freeLessonForm, setFreeLessonForm] = useState({
    title: 'Aprenda a Adorar com Excelência',
    description: 'Nesta aula exclusiva, você vai descobrir como elevar o nível da sua adoração através da técnica e da espiritualidade.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=1200'
  });

  const [libraryForm, setLibraryForm] = useState({
    title: '',
    category: 'partitura' as 'partitura' | 'cifra' | 'kit-voz' | 'multitrack',
    fileUrl: '',
    thumbnail: '',
    description: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firestore connection test successful");
      } catch (error: any) {
        if (error.message?.includes('the client is offline')) {
          console.error("Firestore is offline. Check configuration.");
        }
      }
    };
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Real-time user role check
        const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          const userData = docSnap.data();
          if (userData?.role === 'admin' || user.email === 'edergrp@gmail.com') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            navigate('/');
          }
          setLoading(false);
        }, (error) => {
          console.error("Error in AdminPanel user listener:", error);
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        navigate('/login');
        setLoading(false);
      }
    });

    // Real-time content listeners
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(data);
    }, (error) => {
      console.error("Error in AdminPanel courses listener:", error);
    });

    const unsubMasterclasses = onSnapshot(collection(db, 'masterclasses'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Masterclass));
      setMasterclasses(data);
    }, (error) => {
      console.error("Error in AdminPanel masterclasses listener:", error);
    });

    const unsubEntertainment = onSnapshot(collection(db, 'entertainment'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Entertainment));
      setEntertainment(data);
    }, (error) => {
      console.error("Error in AdminPanel entertainment listener:", error);
    });

    const unsubPricing = onSnapshot(doc(db, 'settings', 'pricing'), (docSnap) => {
      if (docSnap.exists()) {
        setPricingForm(docSnap.data() as any);
      }
    }, (error) => {
      console.error("Error in AdminPanel pricing listener:", error);
    });

    const unsubComments = onSnapshot(query(collection(db, 'comments'), orderBy('createdAt', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(data);
    }, (error) => {
      console.error("Error in AdminPanel comments listener:", error);
    });

    const unsubFreeLesson = onSnapshot(doc(db, 'settings', 'free-lesson'), (docSnap) => {
      if (docSnap.exists()) {
        setFreeLessonForm(docSnap.data() as any);
      }
    }, (error) => {
      console.error("Error in AdminPanel free-lesson listener:", error);
    });

    const unsubFooter = onSnapshot(doc(db, 'settings', 'footer'), (docSnap) => {
      if (docSnap.exists()) {
        setFooterForm(docSnap.data() as any);
      }
    }, (error) => {
      console.error("Error in AdminPanel footer listener:", error);
    });

    const unsubIcons = onSnapshot(doc(db, 'settings', 'icons'), (docSnap) => {
      if (docSnap.exists()) {
        setIconsForm(prev => ({ ...prev, ...docSnap.data() }));
      }
    }, (error) => {
      console.error("Error in AdminPanel icons listener:", error);
    });

    const unsubLibrary = onSnapshot(query(collection(db, 'library'), orderBy('createdAt', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryResource));
      setLibraryResources(data);
    }, (error) => {
      console.error("Error in AdminPanel library listener:", error);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error in AdminPanel users listener:", error);
    });

    // Clear selection when tab changes (handled by useEffect dependency or manual trigger)
    setSelectedContent(null);

    return () => {
      unsubscribeAuth();
      unsubCourses();
      unsubMasterclasses();
      unsubEntertainment();
      unsubPricing();
      unsubComments();
      unsubFreeLesson();
      unsubFooter();
      unsubLibrary();
      unsubUsers();
      unsubIcons();
    };
  }, [navigate]);

  useEffect(() => {
    if (selectedContent) {
      const q = query(collection(db, 'lessons'), where('courseId', '==', selectedContent.id), orderBy('order', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
        setLessons(data);
      }, (error) => {
        console.error("Error in AdminPanel lessons listener:", error);
      });
      return () => unsubscribe();
    } else {
      setLessons([]);
    }
  }, [selectedContent]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    setUploadingThumbnail(true);
    try {
      const path = `${activeTab}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      if (activeTab === 'courses') setCourseForm(prev => ({ ...prev, thumbnail: downloadURL }));
      else if (activeTab === 'masterclasses') setMasterclassForm(prev => ({ ...prev, thumbnail: downloadURL }));
      else if (activeTab === 'entertainment') setEntertainmentForm(prev => ({ ...prev, thumbnail: downloadURL }));
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      alert('Erro ao carregar imagem.');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploadingBanner(true);
    try {
      const path = `banners/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      if (activeTab === 'courses') setCourseForm(prev => ({ ...prev, bannerURL: downloadURL }));
      else if (activeTab === 'masterclasses') setMasterclassForm(prev => ({ ...prev, bannerURL: downloadURL }));
      else if (activeTab === 'entertainment') setEntertainmentForm(prev => ({ ...prev, bannerURL: downloadURL }));
    } catch (error) {
      console.error("Error uploading banner:", error);
      alert('Erro ao carregar banner.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleInstructorPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploadingInstructorPhoto(true);
    try {
      const path = `instructors/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      if (activeTab === 'courses') setCourseForm(prev => ({ ...prev, instructorPhoto: downloadURL }));
      else if (activeTab === 'masterclasses') setMasterclassForm(prev => ({ ...prev, instructorPhoto: downloadURL }));
    } catch (error) {
      console.error("Error uploading instructor photo:", error);
      alert('Erro ao carregar foto do instrutor.');
    } finally {
      setUploadingInstructorPhoto(false);
    }
  };

  const handleResourceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploadingResourceIndex(index);
    try {
      const path = `resources/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const newResources = [...lessonForm.resources];
      newResources[index].url = downloadURL;
      if (!newResources[index].title) {
        newResources[index].title = file.name;
      }
      setLessonForm({ ...lessonForm, resources: newResources });
    } catch (error) {
      console.error("Error uploading resource:", error);
      alert('Erro ao carregar arquivo.');
    } finally {
      setUploadingResourceIndex(null);
    }
  };

  const handleLibraryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploadingLibraryFile(true);
    try {
      const path = `library/files/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setLibraryForm(prev => ({ ...prev, fileUrl: downloadURL }));
      if (!libraryForm.title) {
        setLibraryForm(prev => ({ ...prev, title: file.name.split('.')[0] }));
      }
    } catch (error) {
      console.error("Error uploading library file:", error);
      alert('Erro ao carregar arquivo.');
    } finally {
      setUploadingLibraryFile(false);
    }
  };

  const handleLibraryThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    setUploadingLibraryThumbnail(true);
    try {
      const path = `library/thumbnails/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setLibraryForm(prev => ({ ...prev, thumbnail: downloadURL }));
    } catch (error) {
      console.error("Error uploading library thumbnail:", error);
      alert('Erro ao carregar imagem.');
    } finally {
      setUploadingLibraryThumbnail(false);
    }
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseForm.title.trim()) {
      alert("O título do curso é obrigatório.");
      return;
    }

    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const data = {
        ...courseForm,
        topics: courseForm.topics.split('\n').filter(t => t.trim() !== ''),
        updatedAt: serverTimestamp()
      };

      if (editingCourse) {
        await updateDoc(doc(db, 'courses', editingCourse.id), data);
      } else {
        await addDoc(collection(db, 'courses'), { 
          ...data, 
          createdAt: serverTimestamp() 
        });
      }
      
      alert(editingCourse ? 'Curso atualizado!' : 'Curso cadastrado!');
      setIsCourseModalOpen(false);
      setEditingCourse(null);
    } catch (error: any) {
      console.error("Erro ao salvar curso:", error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMasterclassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterclassForm.title.trim() || !masterclassForm.slug.trim()) {
      alert("Título e Slug são obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        ...masterclassForm,
        topics: masterclassForm.topics.split('\n').filter(t => t.trim() !== ''),
        updatedAt: serverTimestamp()
      };

      if (editingMasterclass) {
        await updateDoc(doc(db, 'masterclasses', editingMasterclass.id), data);
      } else {
        await addDoc(collection(db, 'masterclasses'), { ...data, createdAt: serverTimestamp() });
      }
      
      alert('Masterclass salva!');
      setIsCourseModalOpen(false);
      setEditingMasterclass(null);
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEntertainmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entertainmentForm.title.trim() || !entertainmentForm.slug.trim()) {
      alert("Título e Slug são obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        ...entertainmentForm,
        topics: entertainmentForm.topics.split('\n').filter(t => t.trim() !== ''),
        updatedAt: serverTimestamp()
      };

      if (editingEntertainment) {
        await updateDoc(doc(db, 'entertainment', editingEntertainment.id), data);
      } else {
        await addDoc(collection(db, 'entertainment'), { ...data, createdAt: serverTimestamp() });
      }
      
      alert('Conteúdo salvo!');
      setIsCourseModalOpen(false);
      setEditingEntertainment(null);
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePricingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'pricing'), {
        ...pricingForm,
        updatedAt: serverTimestamp()
      });
      alert('Preços atualizados com sucesso!');
    } catch (error: any) {
      // If document doesn't exist, create it
      try {
        await setDoc(doc(db, 'settings', 'pricing'), {
          ...pricingForm,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        alert('Preços configurados com sucesso!');
      } catch (innerError: any) {
        alert(`Erro ao salvar preços: ${innerError.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/video/')) return url;

    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return url;
  };

  const handleFreeLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'settings', 'free-lesson');
      const docSnap = await getDoc(settingsRef);
      
      const dataToSave = {
        ...freeLessonForm,
        videoUrl: getEmbedUrl(freeLessonForm.videoUrl),
        updatedAt: serverTimestamp()
      };

      if (docSnap.exists()) {
        await updateDoc(settingsRef, dataToSave);
      } else {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(settingsRef, {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
      }
      alert('Página de aula grátis atualizada!');
    } catch (error: any) {
      alert(`Erro ao salvar aula grátis: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLibrarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingLibrary) {
        await updateDoc(doc(db, 'library', editingLibrary.id), {
          ...libraryForm,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'library'), {
          ...libraryForm,
          createdAt: serverTimestamp()
        });
      }
      setIsLibraryModalOpen(false);
      setEditingLibrary(null);
      setLibraryForm({ title: '', category: 'partitura', fileUrl: '', thumbnail: '', description: '' });
      alert('Recurso salvo com sucesso!');
    } catch (error: any) {
      console.error("Error saving library resource:", error);
      alert(`Erro ao salvar recurso: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFileFromStorage = async (url: string) => {
    if (!url || !url.includes('firebasestorage.googleapis.com')) return;
    
    try {
      // Extract path from Firebase Storage URL
      // Format: https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[path]?alt=media&token=[token]
      const decodedUrl = decodeURIComponent(url);
      const startIndex = decodedUrl.indexOf('/o/') + 3;
      const endIndex = decodedUrl.indexOf('?');
      const filePath = decodedUrl.substring(startIndex, endIndex !== -1 ? endIndex : undefined);
      
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
    } catch (error) {
      console.warn("Could not delete file from storage (it might have been already deleted):", error);
    }
  };

  const handleLibraryDelete = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const resource = libraryResources.find(r => r.id === id);
      if (resource) {
        if (resource.fileUrl) await deleteFileFromStorage(resource.fileUrl);
        if (resource.thumbnail) await deleteFileFromStorage(resource.thumbnail);
      }

      await deleteDoc(doc(db, 'library', id));
      setDeleteConfirm({ show: false, type: 'library', id: '', title: '' });
    } catch (error: any) {
      console.error("Error deleting library resource:", error);
      alert(`Erro ao excluir recurso: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationForm.title || !notificationForm.message) return;

    setIsSaving(true);
    try {
      const targetUsers = notificationForm.userId === 'all' 
        ? users.map(u => u.id) 
        : [notificationForm.userId];

      for (const uid of targetUsers) {
        await addDoc(collection(db, 'notifications'), {
          userId: uid,
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type,
          link: notificationForm.link,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      setNotificationForm({ userId: 'all', title: '', message: '', type: 'info', link: '' });
      setIsNotificationModalOpen(false);
      alert('Notificação enviada com sucesso!');
    } catch (error: any) {
      console.error("Error sending notification:", error);
      alert(`Erro ao enviar notificação: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFooterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'footer'), footerForm);
      alert('Rodapé atualizado com sucesso!');
    } catch (error: any) {
      console.error("Error updating footer:", error);
      alert(`Erro ao atualizar rodapé: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleIconsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'icons'), iconsForm);
      alert('Ícones atualizados com sucesso!');
    } catch (error: any) {
      alert(`Erro ao salvar ícones: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando salvamento da aula...", lessonForm);

    if (!lessonForm.title.trim()) {
      alert("O título da aula é obrigatório.");
      return;
    }

    if (!lessonForm.videoUrl.trim()) {
      alert("A URL do vídeo é obrigatória.");
      return;
    }

    if (!selectedContent || isSaving) return;
    
    setIsSaving(true);

    const timeout = setTimeout(() => {
      if (isSaving) {
        setIsSaving(false);
        alert("A operação demorou muito. Verifique sua conexão.");
      }
    }, 15000);

    try {
      const dataToSave = {
        ...lessonForm,
        videoUrl: getEmbedUrl(lessonForm.videoUrl),
        updatedAt: serverTimestamp()
      };

      if (editingLesson) {
        await updateDoc(doc(db, 'lessons', editingLesson.id), dataToSave);
      } else {
        await addDoc(collection(db, 'lessons'), { 
          ...dataToSave, 
          courseId: selectedContent.id, 
          contentType: activeTab,
          createdAt: serverTimestamp() 
        });
      }
      
      clearTimeout(timeout);
      alert(editingLesson ? 'Aula atualizada com sucesso!' : 'Aula cadastrada com sucesso!');
      setIsLessonModalOpen(false);
      setEditingLesson(null);
      setLessonForm({ title: '', description: '', videoUrl: '', duration: '', order: lessons.length + 1, resources: [] });
    } catch (error: any) {
      clearTimeout(timeout);
      console.error("Erro ao salvar aula:", error);
      alert(`Erro ao salvar aula: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const course = courses.find(c => c.id === id);
      if (course) {
        if (course.thumbnail) await deleteFileFromStorage(course.thumbnail);
        if (course.bannerURL) await deleteFileFromStorage(course.bannerURL);
        if (course.instructorPhoto) await deleteFileFromStorage(course.instructorPhoto);
      }

      // Delete associated lessons first
      const q = query(collection(db, 'lessons'), where('courseId', '==', id));
      const lessonsSnap = await getDocs(q);
      
      for (const lessonDoc of lessonsSnap.docs) {
        const lessonData = lessonDoc.data() as Lesson;
        if (lessonData.resources) {
          for (const res of lessonData.resources) {
            if (res.url) await deleteFileFromStorage(res.url);
          }
        }
        await deleteDoc(doc(db, 'lessons', lessonDoc.id));
      }

      // Delete the course
      await deleteDoc(doc(db, 'courses', id));
      
      if (selectedContent?.id === id) {
        setSelectedContent(null);
        setLessons([]);
      }
      setDeleteConfirm({ show: false, type: 'course', id: '', title: '' });
    } catch (error) {
      console.error("Error deleting course:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteMasterclass = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const masterclass = masterclasses.find(m => m.id === id);
      if (masterclass) {
        if (masterclass.thumbnail) await deleteFileFromStorage(masterclass.thumbnail);
        if (masterclass.bannerURL) await deleteFileFromStorage(masterclass.bannerURL);
        if (masterclass.instructorPhoto) await deleteFileFromStorage(masterclass.instructorPhoto);
      }

      // Delete associated lessons
      const q = query(collection(db, 'lessons'), where('courseId', '==', id));
      const lessonsSnap = await getDocs(q);
      
      for (const lessonDoc of lessonsSnap.docs) {
        const lessonData = lessonDoc.data() as Lesson;
        if (lessonData.resources) {
          for (const res of lessonData.resources) {
            if (res.url) await deleteFileFromStorage(res.url);
          }
        }
        await deleteDoc(doc(db, 'lessons', lessonDoc.id));
      }

      await deleteDoc(doc(db, 'masterclasses', id));
      if (selectedContent?.id === id) {
        setSelectedContent(null);
        setLessons([]);
      }
      setDeleteConfirm({ show: false, type: 'course', id: '', title: '' });
    } catch (error) {
      console.error("Error deleting masterclass:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteEntertainment = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const item = entertainment.find(e => e.id === id);
      if (item) {
        if (item.thumbnail) await deleteFileFromStorage(item.thumbnail);
        if (item.bannerURL) await deleteFileFromStorage(item.bannerURL);
      }

      // Delete associated lessons
      const q = query(collection(db, 'lessons'), where('courseId', '==', id));
      const lessonsSnap = await getDocs(q);
      
      for (const lessonDoc of lessonsSnap.docs) {
        const lessonData = lessonDoc.data() as Lesson;
        if (lessonData.resources) {
          for (const res of lessonData.resources) {
            if (res.url) await deleteFileFromStorage(res.url);
          }
        }
        await deleteDoc(doc(db, 'lessons', lessonDoc.id));
      }

      await deleteDoc(doc(db, 'entertainment', id));
      if (selectedContent?.id === id) {
        setSelectedContent(null);
        setLessons([]);
      }
      setDeleteConfirm({ show: false, type: 'course', id: '', title: '' });
    } catch (error) {
      console.error("Error deleting entertainment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'comments', id));
      setCommentDeleteConfirm({ show: false, id: '' });
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert('Erro ao excluir comentário.');
    }
  };

  const deleteLesson = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const lesson = lessons.find(l => l.id === id);
      if (lesson) {
        if (lesson.resources) {
          for (const res of lesson.resources) {
            if (res.url) await deleteFileFromStorage(res.url);
          }
        }
      }

      await deleteDoc(doc(db, 'lessons', id));
      setDeleteConfirm({ show: false, type: 'lesson', id: '', title: '' });
    } catch (error) {
      console.error("Error deleting lesson:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={48} />
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <ShieldCheck size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Painel Administrativo</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Gerenciar Conteúdo</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => {
                  setActiveTab('courses');
                  setSelectedContent(null);
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'courses' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:text-white'}`}
              >
                Cursos
              </button>
              <button 
                onClick={() => {
                  setActiveTab('masterclasses');
                  setSelectedContent(null);
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'masterclasses' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:text-white'}`}
              >
                Masterclasses
              </button>
              <button 
                onClick={() => {
                  setActiveTab('entertainment');
                  setSelectedContent(null);
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'entertainment' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:text-white'}`}
              >
                Entretenimento
              </button>
              <button 
                onClick={() => setActiveTab('pricing')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pricing' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:text-white'}`}
              >
                Planos
              </button>
              <button 
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'comments' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:text-white'}`}
              >
                Comentários
              </button>
              <button 
                onClick={() => setActiveTab('free-lesson')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'free-lesson' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:text-white'}`}
              >
                Aula Grátis
              </button>
              <button 
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'library' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:text-white'}`}
              >
                Biblioteca
              </button>
              <button 
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'students' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:text-white'}`}
              >
                Alunos
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'notifications' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:text-white'}`}
              >
                Notificações
              </button>
              <button 
                onClick={() => setActiveTab('footer')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'footer' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:text-white'}`}
              >
                Rodapé
              </button>
              <button 
                onClick={() => setActiveTab('icons')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'icons' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:text-white'}`}
              >
                Ícones
              </button>
            </div>
            {activeTab !== 'pricing' && activeTab !== 'comments' && activeTab !== 'free-lesson' && activeTab !== 'notifications' && activeTab !== 'footer' && activeTab !== 'icons' && activeTab !== 'students' && (
              <button 
                onClick={() => {
                  if (activeTab === 'courses') {
                    setEditingCourse(null);
                    setCourseForm({ title: '', description: '', thumbnail: '', bannerURL: '', category: 'teclas', instructor: 'Eder Rios', instructorPhoto: '', instructorQuote: '', duration: '', topics: '' });
                  } else if (activeTab === 'masterclasses') {
                    setEditingMasterclass(null);
                    setMasterclassForm({ slug: '', title: '', description: '', thumbnail: '', bannerURL: '', instructor: 'Equipe AdorePlay', instructorPhoto: '', instructorQuote: '', duration: '', topics: '' });
                    setIsCourseModalOpen(true);
                  } else if (activeTab === 'entertainment') {
                    setEditingEntertainment(null);
                    setEntertainmentForm({ slug: '', title: '', description: '', thumbnail: '', bannerURL: '', instructor: 'Produção AdorePlay', duration: '', topics: '' });
                    setIsCourseModalOpen(true);
                  } else if (activeTab === 'library') {
                    setEditingLibrary(null);
                    setLibraryForm({ title: '', category: 'partitura', fileUrl: '', thumbnail: '', description: '' });
                    setIsLibraryModalOpen(true);
                    return; // Don't open course modal
                  }
                  setIsCourseModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
              >
                <Plus size={20} />
                Novo {activeTab === 'courses' ? 'Curso' : activeTab === 'masterclasses' ? 'Masterclass' : activeTab === 'library' ? 'Recurso' : 'Conteúdo'}
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {activeTab === 'pricing' ? (
            <div className="lg:col-span-12">
              <div className="max-w-2xl mx-auto p-8 bg-surface-container-low border border-white/5 rounded-3xl">
                <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                  <Zap className="text-primary" />
                  Gerenciar Preços dos Planos
                </h2>
                <form onSubmit={handlePricingSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Preço Mensal (R$)</label>
                      <input 
                        type="number"
                        step="0.01"
                        value={pricingForm.monthlyPrice}
                        onChange={(e) => setPricingForm({...pricingForm, monthlyPrice: parseFloat(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-2xl font-black text-white focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Preço Anual (R$)</label>
                      <input 
                        type="number"
                        step="0.01"
                        value={pricingForm.annualPrice}
                        onChange={(e) => setPricingForm({...pricingForm, annualPrice: parseFloat(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-2xl font-black text-white focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1 flex justify-between">
                        Stripe Price ID ou Link Mensal
                        {pricingForm.stripeMonthlyPriceId?.startsWith('price_') || pricingForm.stripeMonthlyPriceId?.startsWith('http') ? (
                          <span className="text-green-500 text-[10px]">Válido</span>
                        ) : pricingForm.stripeMonthlyPriceId ? (
                          <span className="text-red-500 text-[10px]">Inválido (use price_... ou link)</span>
                        ) : null}
                      </label>
                      <input 
                        type="text"
                        value={pricingForm.stripeMonthlyPriceId || ''}
                        onChange={(e) => setPricingForm({...pricingForm, stripeMonthlyPriceId: e.target.value.trim()})}
                        placeholder="price_... ou https://buy.stripe.com/..."
                        className={`w-full bg-white/5 border ${pricingForm.stripeMonthlyPriceId && !pricingForm.stripeMonthlyPriceId.startsWith('price_') && !pricingForm.stripeMonthlyPriceId.startsWith('http') ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all`}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1 flex justify-between">
                        Stripe Price ID ou Link Anual
                        {pricingForm.stripeAnnualPriceId?.startsWith('price_') || pricingForm.stripeAnnualPriceId?.startsWith('http') ? (
                          <span className="text-green-500 text-[10px]">Válido</span>
                        ) : pricingForm.stripeAnnualPriceId ? (
                          <span className="text-red-500 text-[10px]">Inválido (use price_... ou link)</span>
                        ) : null}
                      </label>
                      <input 
                        type="text"
                        value={pricingForm.stripeAnnualPriceId || ''}
                        onChange={(e) => setPricingForm({...pricingForm, stripeAnnualPriceId: e.target.value.trim()})}
                        placeholder="price_... ou https://buy.stripe.com/..."
                        className={`w-full bg-white/5 border ${pricingForm.stripeAnnualPriceId && !pricingForm.stripeAnnualPriceId.startsWith('price_') && !pricingForm.stripeAnnualPriceId.startsWith('http') ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all`}
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {isSaving ? 'Salvando...' : 'Atualizar Preços'}
                  </button>
                </form>
              </div>
            </div>
          ) : activeTab === 'free-lesson' ? (
            <div className="lg:col-span-12">
              <div className="max-w-3xl mx-auto p-8 bg-surface-container-low border border-white/5 rounded-3xl">
                <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                  <PlayCircle className="text-primary" />
                  Configurar Página de Aula Grátis
                </h2>
                <form onSubmit={handleFreeLessonSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Título da Página</label>
                    <input 
                      type="text"
                      value={freeLessonForm.title}
                      onChange={(e) => setFreeLessonForm({...freeLessonForm, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Descrição</label>
                    <textarea 
                      rows={3}
                      value={freeLessonForm.description}
                      onChange={(e) => setFreeLessonForm({...freeLessonForm, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Link do Vídeo (YouTube ou Vimeo)</label>
                      <input 
                        type="text"
                        value={freeLessonForm.videoUrl}
                        onChange={(e) => setFreeLessonForm({...freeLessonForm, videoUrl: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                        placeholder="Cole o link do vídeo aqui..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">
                        Thumbnail URL <span className="text-primary/60 ml-1 text-[9px] lowercase">(Recomendado: 1280x720px)</span>
                      </label>
                      <input 
                        type="text"
                        value={freeLessonForm.thumbnail}
                        onChange={(e) => setFreeLessonForm({...freeLessonForm, thumbnail: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-xs text-primary font-medium leading-relaxed">
                      <strong>Dica:</strong> Você pode colar o link direto do navegador (ex: youtube.com/watch?v=...) que o sistema converterá automaticamente.
                    </p>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                  </button>
                </form>
              </div>
            </div>
          ) : activeTab === 'comments' ? (
            <div className="lg:col-span-12 space-y-6">
              <div className="p-8 bg-surface-container-low border border-white/5 rounded-3xl">
                <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                  <MessageSquare className="text-primary" />
                  Moderação de Comentários
                </h2>
                
                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map(comment => (
                      <div key={comment.id} className="p-6 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-4 hover:border-white/20 transition-all group">
                        <img 
                          src={comment.userPhoto || `https://ui-avatars.com/api/?name=${comment.userName}&background=random`} 
                          alt="" 
                          className="w-12 h-12 rounded-full border border-white/10"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{comment.userName}</span>
                              <span className="text-[10px] text-on-surface-variant font-mono">
                                {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString() : 'Recentemente'}
                              </span>
                            </div>
                            <button 
                              onClick={() => setCommentDeleteConfirm({ show: true, id: comment.id })}
                              className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <p className="text-on-surface-variant text-sm leading-relaxed mb-3">{comment.text}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                              ID Aula: {comment.lessonId}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                      <MessageSquare size={64} className="mb-4" />
                      <p className="text-xl font-black uppercase tracking-widest">Nenhum comentário encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'library' ? (
            <div className="lg:col-span-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {libraryResources.map((resource) => (
                  <div key={resource.id} className="bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden group">
                    <div className="aspect-video relative bg-black/20 flex items-center justify-center">
                      {resource.thumbnail ? (
                        <img src={resource.thumbnail} alt={resource.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <BookOpen size={48} className="text-primary/20" />
                      )}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingLibrary(resource);
                            setLibraryForm({
                              title: resource.title,
                              category: resource.category,
                              fileUrl: resource.fileUrl,
                              thumbnail: resource.thumbnail || '',
                              description: resource.description || ''
                            });
                            setIsLibraryModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-white/10 backdrop-blur-md text-white hover:bg-primary transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm({ show: true, type: 'library', id: resource.id, title: resource.title })}
                          className="p-2 rounded-lg bg-white/10 backdrop-blur-md text-white hover:bg-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <span className="px-2 py-1 rounded-md bg-primary text-[8px] font-black uppercase tracking-widest">
                          {resource.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-white mb-2">{resource.title}</h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2">{resource.description}</p>
                    </div>
                  </div>
                ))}
                {libraryResources.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-surface-container-high rounded-3xl border border-dashed border-white/10">
                    <BookOpen size={48} className="text-white/10 mx-auto mb-4" />
                    <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Nenhum recurso cadastrado na biblioteca.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'footer' ? (
            <div className="lg:col-span-12">
              <div className="max-w-3xl mx-auto p-8 bg-surface-container-low border border-white/5 rounded-3xl">
                <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                  <Layout className="text-primary" />
                  Configurações do Rodapé
                </h2>
                <form onSubmit={handleFooterSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Descrição da Marca</label>
                    <textarea 
                      rows={3}
                      value={footerForm.description}
                      onChange={(e) => setFooterForm({...footerForm, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Instagram (URL)</label>
                      <input 
                        type="text"
                        value={footerForm.instagram}
                        onChange={(e) => setFooterForm({...footerForm, instagram: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">YouTube (URL)</label>
                      <input 
                        type="text"
                        value={footerForm.youtube}
                        onChange={(e) => setFooterForm({...footerForm, youtube: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Facebook (URL)</label>
                      <input 
                        type="text"
                        value={footerForm.facebook}
                        onChange={(e) => setFooterForm({...footerForm, facebook: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">E-mail de Contato</label>
                      <input 
                        type="email"
                        value={footerForm.email}
                        onChange={(e) => setFooterForm({...footerForm, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Telefone</label>
                      <input 
                        type="text"
                        value={footerForm.phone}
                        onChange={(e) => setFooterForm({...footerForm, phone: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Localização</label>
                    <input 
                      type="text"
                      value={footerForm.location}
                      onChange={(e) => setFooterForm({...footerForm, location: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </form>
              </div>
            </div>
          ) : activeTab === 'icons' ? (
            <div className="lg:col-span-12">
              <div className="max-w-4xl mx-auto p-8 bg-surface-container-low border border-white/5 rounded-3xl">
                <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                  <PlayCircle className="text-primary" />
                  Customização de Ícones
                </h2>
                <form onSubmit={handleIconsSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(iconsForm).map(([key, value]) => (
                      <div key={key} className="space-y-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                            {key.startsWith('ui_') ? `UI: ${key.replace('ui_', '')}` : `Categoria: ${key}`}
                          </label>
                          <DynamicIcon name={value} size={20} className="text-primary" />
                        </div>
                        <input 
                          type="text"
                          value={value}
                          onChange={(e) => setIconsForm({ ...iconsForm, [key]: e.target.value })}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
                          placeholder="Nome do ícone (Lucide)"
                        />
                        <p className="text-[9px] text-on-surface-variant">Lucide Name: <code className="text-primary">{value}</code></p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-xs text-primary font-medium leading-relaxed">
                      <strong>Info:</strong> Use nomes de componentes do <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="underline font-bold">Lucide Icons</a> (ex: Music, Mic, Guitar, Heart, Star). A primeira letra deve ser sempre maiúscula.
                    </p>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {isSaving ? 'Salvar Ícones' : 'Salvar Configurações de Ícones'}
                  </button>
                </form>
              </div>
            </div>
          ) : activeTab === 'students' ? (
            <div className="lg:col-span-12">
              <div className="bg-surface-container-high rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Gestão de Alunos</h2>
                    <p className="text-on-surface-variant text-sm font-medium mt-1">Total de {users.length} usuários cadastrados</p>
                  </div>
                  <Users className="text-primary" size={32} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                        <th className="px-8 py-4">Usuário</th>
                        <th className="px-8 py-4">E-mail</th>
                        <th className="px-8 py-4">Nível/Role</th>
                        <th className="px-8 py-4">Status Assinatura</th>
                        <th className="px-8 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                                {user.photoURL ? (
                                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <UserIcon className="text-primary" size={20} />
                                )}
                              </div>
                              <span className="font-bold text-sm text-white">{user.displayName || 'Sem nome'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <span className="text-sm text-on-surface-variant">{user.email}</span>
                          </td>
                          <td className="px-8 py-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${user.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/10 text-on-surface-variant'}`}>
                              {user.role || 'student'}
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.isSubscribed ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                              <span className="text-xs font-bold text-white uppercase tracking-tighter">
                                {user.isSubscribed ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <button 
                              onClick={() => {
                                setNotificationForm(prev => ({ ...prev, userId: user.id }));
                                setActiveTab('notifications');
                              }}
                              className="inline-flex items-center gap-2 py-2 px-4 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-primary/20"
                            >
                              <Bell size={14} />
                              Notificar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'notifications' ? (
            <div className="lg:col-span-12">
              <div className="max-w-3xl mx-auto p-8 bg-surface-container-low border border-white/5 rounded-3xl">
                <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                  <Bell className="text-primary" />
                  Enviar Nova Notificação
                </h2>
                <form onSubmit={handleNotificationSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Para quem?</label>
                      <select 
                        value={notificationForm.userId}
                        onChange={(e) => setNotificationForm({...notificationForm, userId: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      >
                        <option value="all" className="bg-surface-container-high">Todos os Usuários</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id} className="bg-surface-container-high">
                            {u.displayName || u.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Tipo de Alerta</label>
                      <select 
                        value={notificationForm.type}
                        onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value as any})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      >
                        <option value="info" className="bg-surface-container-high">Informativo (Azul)</option>
                        <option value="success" className="bg-surface-container-high">Sucesso (Verde)</option>
                        <option value="warning" className="bg-surface-container-high">Aviso (Amarelo)</option>
                        <option value="error" className="bg-surface-container-high">Erro (Vermelho)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Título da Notificação</label>
                    <input 
                      type="text"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                      placeholder="Ex: Novo curso disponível!"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Mensagem</label>
                    <textarea 
                      rows={4}
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                      placeholder="Descreva o que o usuário precisa saber..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Link de Destino (Opcional)</label>
                    <input 
                      type="text"
                      value={notificationForm.link}
                      onChange={(e) => setNotificationForm({...notificationForm, link: e.target.value})}
                      placeholder="Ex: /courses/piano-iniciante"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-5 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Bell size={20} />}
                    {isSaving ? 'Enviando...' : 'Enviar Notificação'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <>
              {/* Content List */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <BookOpen size={20} className="text-primary" />
              {activeTab === 'courses' ? 'Cursos' : activeTab === 'masterclasses' ? 'Masterclasses' : 'Entretenimento'} Disponíveis
            </h2>
            <div className="space-y-3">
              {activeTab === 'courses' && courses.map(course => (
                <motion.div 
                  key={course.id}
                  layoutId={course.id}
                  onClick={() => {
                    setSelectedContent(course);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                    selectedContent?.id === course.id 
                    ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
                    : 'bg-surface-container-low border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10">
                          <ImageIcon size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{course.title}</h3>
                      <p className="text-xs text-on-surface-variant font-medium">{course.category}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCourse(course);
                          setCourseForm({ 
                            title: course.title, 
                            description: course.description, 
                            thumbnail: course.thumbnail, 
                            bannerURL: course.bannerURL || '',
                            category: course.category,
                            instructor: course.instructor || 'Eder Rios',
                            instructorPhoto: course.instructorPhoto || '',
                            instructorQuote: course.instructorQuote || '',
                            duration: course.duration || '',
                            topics: course.topics?.join('\n') || ''
                          });
                          setIsCourseModalOpen(true);
                        }}
                        className="p-2 text-on-surface-variant hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ show: true, type: 'course', id: course.id, title: course.title });
                        }}
                        className="p-2 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {activeTab === 'masterclasses' && masterclasses.map(mc => (
                <motion.div 
                  key={mc.id}
                  onClick={() => setSelectedContent(mc)}
                  className={`p-4 rounded-2xl border transition-all group cursor-pointer ${selectedContent?.id === mc.id ? 'bg-primary/10 border-primary' : 'bg-surface-container-low border-white/5 hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                      <img src={mc.thumbnail} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{mc.title}</h3>
                      <p className="text-xs text-primary font-bold uppercase tracking-widest">{mc.slug}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingMasterclass(mc);
                          setMasterclassForm({
                            slug: mc.slug,
                            title: mc.title,
                            description: mc.description,
                            thumbnail: mc.thumbnail,
                            bannerURL: mc.bannerURL || '',
                            instructor: mc.instructor || 'Equipe AdorePlay',
                            instructorPhoto: mc.instructorPhoto || '',
                            instructorQuote: mc.instructorQuote || '',
                            duration: mc.duration || '',
                            topics: mc.topics?.join('\n') || ''
                          });
                          setIsCourseModalOpen(true);
                        }}
                        className="p-2 text-on-surface-variant hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ show: true, type: 'masterclass', id: mc.id, title: mc.title });
                        }}
                        className="p-2 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {activeTab === 'entertainment' && entertainment.map(item => (
                <motion.div 
                  key={item.id}
                  onClick={() => setSelectedContent(item)}
                  className={`p-4 rounded-2xl border transition-all group cursor-pointer ${selectedContent?.id === item.id ? 'bg-primary/10 border-primary' : 'bg-surface-container-low border-white/5 hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{item.title}</h3>
                      <p className="text-xs text-primary font-bold uppercase tracking-widest">{item.slug}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingEntertainment(item);
                          setEntertainmentForm({
                            slug: item.slug,
                            title: item.title,
                            description: item.description,
                            thumbnail: item.thumbnail,
                            bannerURL: item.bannerURL || '',
                            instructor: item.instructor || 'Produção AdorePlay',
                            duration: item.duration || '',
                            topics: item.topics?.join('\n') || ''
                          });
                          setIsCourseModalOpen(true);
                        }}
                        className="p-2 text-on-surface-variant hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ show: true, type: 'entertainment', id: item.id, title: item.title });
                        }}
                        className="p-2 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Lessons List */}
          <div className="lg:col-span-7">
            {selectedContent ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <PlayCircle size={20} className="text-primary" />
                    Aulas de: <span className="text-primary">{selectedContent.title}</span>
                  </h2>
                  <button 
                    onClick={() => {
                      setEditingLesson(null);
                      setLessonForm({ title: '', description: '', videoUrl: '', duration: '', order: lessons.length + 1, resources: [] });
                      setIsLessonModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-all text-sm"
                  >
                    <Plus size={18} />
                    Nova Aula
                  </button>
                </div>

                <div className="space-y-3">
                  {lessons.map((lesson, index) => (
                    <div 
                      key={lesson.id}
                      className="flex items-center gap-4 p-4 bg-surface-container-low border border-white/5 rounded-2xl group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-black text-primary text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate">{lesson.title}</h4>
                        <p className="text-xs text-on-surface-variant">{lesson.duration} • Ordem: {lesson.order}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingLesson(lesson);
                            setLessonForm({ 
                              title: lesson.title, 
                              description: lesson.description, 
                              videoUrl: lesson.videoUrl, 
                              duration: lesson.duration, 
                              order: lesson.order,
                              resources: lesson.resources || []
                            });
                            setIsLessonModalOpen(true);
                          }}
                          className="p-2 text-on-surface-variant hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm({ show: true, type: 'lesson', id: lesson.id, title: lesson.title })}
                          className="p-2 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {lessons.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-on-surface-variant font-bold">Nenhuma aula cadastrada para este conteúdo.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-surface-container-low border border-white/5 rounded-3xl">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <BookOpen size={32} className="text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Selecione um item</h3>
                <p className="text-on-surface-variant text-sm max-w-xs">Escolha um item na lista ao lado para gerenciar suas aulas e conteúdos.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </div>

      {/* Course Modal */}
      <AnimatePresence>
        {isCourseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCourseModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-container-high rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-surface-container-high z-10 pb-4 border-b border-white/5">
                <h3 className="text-2xl font-black text-white tracking-tighter">
                  {activeTab === 'courses' ? (editingCourse ? 'Editar Curso' : 'Novo Curso') : 
                   activeTab === 'masterclasses' ? (editingMasterclass ? 'Editar Masterclass' : 'Nova Masterclass') :
                   (editingEntertainment ? 'Editar Conteúdo' : 'Novo Conteúdo')}
                </h3>
                <button onClick={() => setIsCourseModalOpen(false)} className="p-2 text-on-surface-variant hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form 
                onSubmit={activeTab === 'courses' ? handleCourseSubmit : 
                          activeTab === 'masterclasses' ? handleMasterclassSubmit : 
                          handleEntertainmentSubmit} 
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Título</label>
                    <input 
                      type="text"
                      value={activeTab === 'courses' ? courseForm.title : activeTab === 'masterclasses' ? masterclassForm.title : entertainmentForm.title}
                      onChange={(e) => {
                        if (activeTab === 'courses') setCourseForm({...courseForm, title: e.target.value});
                        else if (activeTab === 'masterclasses') setMasterclassForm({...masterclassForm, title: e.target.value});
                        else setEntertainmentForm({...entertainmentForm, title: e.target.value});
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      placeholder="Título do conteúdo"
                    />
                  </div>

                  {activeTab !== 'courses' && (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Slug (URL)</label>
                      <input 
                        type="text"
                        value={activeTab === 'masterclasses' ? masterclassForm.slug : entertainmentForm.slug}
                        onChange={(e) => {
                          if (activeTab === 'masterclasses') setMasterclassForm({...masterclassForm, slug: e.target.value});
                          else setEntertainmentForm({...entertainmentForm, slug: e.target.value});
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                        placeholder="ex: meu-conteudo-especial"
                      />
                    </div>
                  )}

                  {activeTab === 'courses' && (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Categoria</label>
                      <select 
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                        className="w-full bg-[#1a1c1e] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      >
                        <option value="teclas" className="bg-[#1a1c1e] text-white">Teclas</option>
                        <option value="cordas" className="bg-[#1a1c1e] text-white">Cordas</option>
                        <option value="voz" className="bg-[#1a1c1e] text-white">Voz</option>
                        <option value="espiritual" className="bg-[#1a1c1e] text-white">Espiritual</option>
                        <option value="liderança" className="bg-[#1a1c1e] text-white">Liderança</option>
                        <option value="entretenimento" className="bg-[#1a1c1e] text-white">Entretenimento</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Duração</label>
                    <input 
                      type="text"
                      value={activeTab === 'courses' ? courseForm.duration : activeTab === 'masterclasses' ? masterclassForm.duration : entertainmentForm.duration}
                      onChange={(e) => {
                        if (activeTab === 'courses') setCourseForm({...courseForm, duration: e.target.value});
                        else if (activeTab === 'masterclasses') setMasterclassForm({...masterclassForm, duration: e.target.value});
                        else setEntertainmentForm({...entertainmentForm, duration: e.target.value});
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      placeholder="Ex: 45 horas ou 1h 30m"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">
                      Instrutor/Apresentador
                    </label>
                    <div className="flex gap-4">
                      <div 
                        onClick={() => instructorPhotoInputRef.current?.click()}
                        className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer hover:border-primary transition-all flex-shrink-0 flex items-center justify-center"
                        title="Foto do Instrutor (400x400px)"
                      >
                        {(activeTab === 'courses' ? courseForm.instructorPhoto : masterclassForm.instructorPhoto) ? (
                          <img src={activeTab === 'courses' ? courseForm.instructorPhoto : masterclassForm.instructorPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          uploadingInstructorPhoto ? <Loader2 className="animate-spin text-primary" size={16} /> : <Camera size={16} className="text-white/20" />
                        )}
                      </div>
                      <input 
                        type="text"
                        value={activeTab === 'courses' ? courseForm.instructor : activeTab === 'masterclasses' ? masterclassForm.instructor : entertainmentForm.instructor}
                        onChange={(e) => {
                          if (activeTab === 'courses') setCourseForm({...courseForm, instructor: e.target.value});
                          else if (activeTab === 'masterclasses') setMasterclassForm({...masterclassForm, instructor: e.target.value});
                          else setEntertainmentForm({...entertainmentForm, instructor: e.target.value});
                        }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                        placeholder="Nome do instrutor"
                      />
                    </div>
                    <input type="file" ref={instructorPhotoInputRef} onChange={handleInstructorPhotoUpload} accept="image/*" className="hidden" />
                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest ml-1">Ideal: 400x400px (Quadrada)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">
                      Thumbnail (Card) <span className="text-primary/60 ml-1 text-[9px] lowercase">(Recomendado: 1280x720px)</span>
                    </label>
                    <div 
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="relative aspect-video w-full bg-white/5 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all group"
                    >
                      {(activeTab === 'courses' ? courseForm.thumbnail : activeTab === 'masterclasses' ? masterclassForm.thumbnail : entertainmentForm.thumbnail) ? (
                        <>
                          <img src={activeTab === 'courses' ? courseForm.thumbnail : activeTab === 'masterclasses' ? masterclassForm.thumbnail : entertainmentForm.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="text-white" size={32} />
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                          {uploadingThumbnail ? <Loader2 className="animate-spin text-primary" size={32} /> : <><Upload size={32} className="mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Carregar Thumbnail</span></>}
                        </div>
                      )}
                    </div>
                    <input type="file" ref={thumbnailInputRef} onChange={handleThumbnailUpload} accept="image/*" className="hidden" />
                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest ml-1">Ideal: 1280x720px (16:9)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">
                      Banner (Página Detalhes) <span className="text-primary/60 ml-1 text-[9px] lowercase">(Recomendado: 1920x1080px)</span>
                    </label>
                    <div 
                      onClick={() => bannerInputRef.current?.click()}
                      className="relative aspect-video w-full bg-white/5 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all group"
                    >
                      {(activeTab === 'courses' ? courseForm.bannerURL : activeTab === 'masterclasses' ? masterclassForm.bannerURL : entertainmentForm.bannerURL) ? (
                        <>
                          <img src={activeTab === 'courses' ? courseForm.bannerURL : activeTab === 'masterclasses' ? masterclassForm.bannerURL : entertainmentForm.bannerURL} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="text-white" size={32} />
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                          {uploadingBanner ? <Loader2 className="animate-spin text-primary" size={32} /> : <><Upload size={32} className="mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Carregar Banner</span></>}
                        </div>
                      )}
                    </div>
                    <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} accept="image/*" className="hidden" />
                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest ml-1">Ideal: 1920x1080px (Alta Resolução)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Descrição (Sobre)</label>
                  <textarea 
                    rows={3}
                    value={activeTab === 'courses' ? courseForm.description : activeTab === 'masterclasses' ? masterclassForm.description : entertainmentForm.description}
                    onChange={(e) => {
                      if (activeTab === 'courses') setCourseForm({...courseForm, description: e.target.value});
                      else if (activeTab === 'masterclasses') setMasterclassForm({...masterclassForm, description: e.target.value});
                      else setEntertainmentForm({...entertainmentForm, description: e.target.value});
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none"
                    placeholder="Descrição detalhada..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">
                    {activeTab === 'courses' ? 'O que você vai dominar' : activeTab === 'masterclasses' ? 'O que você vai aprender' : 'Destaques do Episódio'} (Um por linha)
                  </label>
                  <textarea 
                    rows={4}
                    value={activeTab === 'courses' ? courseForm.topics : activeTab === 'masterclasses' ? masterclassForm.topics : entertainmentForm.topics}
                    onChange={(e) => {
                      if (activeTab === 'courses') setCourseForm({...courseForm, topics: e.target.value});
                      else if (activeTab === 'masterclasses') setMasterclassForm({...masterclassForm, topics: e.target.value});
                      else setEntertainmentForm({...entertainmentForm, topics: e.target.value});
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none"
                    placeholder="Tópico 1&#10;Tópico 2&#10;Tópico 3"
                  />
                </div>

                {activeTab !== 'entertainment' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Frase do Instrutor (Citação)</label>
                    <textarea 
                      rows={2}
                      value={activeTab === 'courses' ? courseForm.instructorQuote : masterclassForm.instructorQuote}
                      onChange={(e) => {
                        if (activeTab === 'courses') setCourseForm({...courseForm, instructorQuote: e.target.value});
                        else setMasterclassForm({...masterclassForm, instructorQuote: e.target.value});
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none"
                      placeholder="Uma frase inspiradora do instrutor..."
                    />
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lesson Modal */}
      <AnimatePresence>
        {isLessonModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLessonModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface-container-high rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-surface-container-high z-10 pb-4 border-b border-white/5">
                <h3 className="text-2xl font-black text-white tracking-tighter">
                  {editingLesson ? 'Editar Aula' : 'Nova Aula'}
                </h3>
                <button onClick={() => setIsLessonModalOpen(false)} className="p-2 text-on-surface-variant hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleLessonSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Título da Aula</label>
                  <input 
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                    placeholder="Ex: Introdução às Notas"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Duração</label>
                    <input 
                      type="text"
                      value={lessonForm.duration}
                      onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      placeholder="Ex: 12:45"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Ordem</label>
                    <input 
                      type="number"
                      value={lessonForm.order}
                      onChange={(e) => setLessonForm({...lessonForm, order: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Video size={14} className="text-primary" />
                    Link do Vídeo (YouTube ou Vimeo)
                  </label>
                  <input 
                    type="url"
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                    placeholder="Cole o link do vídeo aqui..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea 
                    rows={3}
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none"
                    placeholder="O que será ensinado nesta aula..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Recursos / Materiais</label>
                    <button 
                      type="button"
                      onClick={() => setLessonForm({
                        ...lessonForm, 
                        resources: [...lessonForm.resources, { title: '', url: '' }]
                      })}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      + Adicionar Recurso
                    </button>
                  </div>
                  
                  {lessonForm.resources.map((resource, index) => (
                    <div key={index} className="flex gap-3 items-start bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="flex-1 space-y-3">
                        <input 
                          type="text"
                          value={resource.title}
                          onChange={(e) => {
                            const newResources = [...lessonForm.resources];
                            newResources[index].title = e.target.value;
                            setLessonForm({...lessonForm, resources: newResources});
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary outline-none transition-all"
                          placeholder="Título do recurso (Ex: PDF da Aula)"
                        />
                        <div className="flex gap-2">
                          <input 
                            type="url"
                            value={resource.url}
                            onChange={(e) => {
                              const newResources = [...lessonForm.resources];
                              newResources[index].url = e.target.value;
                              setLessonForm({...lessonForm, resources: newResources});
                            }}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary outline-none transition-all"
                            placeholder="URL do arquivo ou link"
                          />
                          <label className="flex items-center justify-center px-4 bg-primary/20 text-primary rounded-lg cursor-pointer hover:bg-primary/30 transition-all border border-primary/20">
                            {uploadingResourceIndex === index ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Upload size={16} />
                            )}
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => handleResourceFileUpload(e, index)}
                              accept=".pdf,.mp3,.wav,.zip,.doc,.docx"
                            />
                          </label>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const newResources = lessonForm.resources.filter((_, i) => i !== index);
                          setLessonForm({...lessonForm, resources: newResources});
                        }}
                        className="p-2 text-white/20 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Save size={20} />
                  )}
                  {isSaving ? 'Salvando...' : 'Salvar Aula'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Library Modal */}
      <AnimatePresence>
        {isLibraryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLibraryModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-container-high rounded-3xl p-8 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  {editingLibrary ? 'Editar Recurso' : 'Novo Recurso'}
                </h2>
                <button 
                  onClick={() => setIsLibraryModalOpen(false)}
                  className="p-2 rounded-full bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleLibrarySubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Título</label>
                    <input 
                      type="text"
                      required
                      value={libraryForm.title}
                      onChange={(e) => setLibraryForm({...libraryForm, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      placeholder="Título do recurso"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Categoria</label>
                    <select 
                      value={libraryForm.category}
                      onChange={(e) => setLibraryForm({...libraryForm, category: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                    >
                      <option value="partitura">Partitura</option>
                      <option value="cifra">Cifra</option>
                      <option value="kit-voz">Kit de Voz</option>
                      <option value="multitrack">Multitrack</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Arquivo do Recurso</label>
                  <div className="flex gap-3">
                    <input 
                      type="url"
                      required
                      value={libraryForm.fileUrl}
                      onChange={(e) => setLibraryForm({...libraryForm, fileUrl: e.target.value})}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                      placeholder="URL do arquivo ou carregue um novo"
                    />
                    <button
                      type="button"
                      onClick={() => libraryFileInputRef.current?.click()}
                      disabled={uploadingLibraryFile}
                      className="px-6 bg-primary/20 text-primary rounded-xl font-bold hover:bg-primary/30 transition-all border border-primary/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingLibraryFile ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                      <span className="hidden sm:inline">Carregar</span>
                    </button>
                    <input 
                      type="file" 
                      ref={libraryFileInputRef} 
                      onChange={handleLibraryFileUpload} 
                      className="hidden" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">
                    Thumbnail / Capa (Opcional) <span className="text-primary/60 ml-1 text-[9px] lowercase">(Recomendado: 1280x720px)</span>
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input 
                        type="url"
                        value={libraryForm.thumbnail}
                        onChange={(e) => setLibraryForm({...libraryForm, thumbnail: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all"
                        placeholder="URL da imagem ou carregue uma nova"
                      />
                      {libraryForm.thumbnail && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                          <img src={libraryForm.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => libraryThumbnailInputRef.current?.click()}
                      disabled={uploadingLibraryThumbnail}
                      className="px-6 bg-primary/20 text-primary rounded-xl font-bold hover:bg-primary/30 transition-all border border-primary/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploadingLibraryThumbnail ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                      <span className="hidden sm:inline">Carregar</span>
                    </button>
                    <input 
                      type="file" 
                      ref={libraryThumbnailInputRef} 
                      onChange={handleLibraryThumbnailUpload} 
                      accept="image/*"
                      className="hidden" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Descrição (Opcional)</label>
                  <textarea 
                    rows={3}
                    value={libraryForm.description}
                    onChange={(e) => setLibraryForm({...libraryForm, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary outline-none transition-all resize-none"
                    placeholder="Breve descrição do recurso..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {isSaving ? 'Salvando...' : 'Salvar Recurso'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ ...deleteConfirm, show: false })}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-high rounded-3xl p-8 shadow-2xl border border-white/10 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Confirmar Exclusão</h3>
              <p className="text-on-surface-variant text-sm mb-8">
                Tem certeza que deseja excluir <strong>{deleteConfirm.title}</strong>? 
                {deleteConfirm.type === 'course' && " Todas as aulas associadas também serão removidas."}
                Esta ação não pode ser desfeita.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDeleteConfirm({ ...deleteConfirm, show: false })}
                  className="py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'course') deleteCourse(deleteConfirm.id);
                    else if (deleteConfirm.type === 'masterclass') deleteMasterclass(deleteConfirm.id);
                    else if (deleteConfirm.type === 'entertainment') deleteEntertainment(deleteConfirm.id);
                    else if (deleteConfirm.type === 'lesson') deleteLesson(deleteConfirm.id);
                    else if (deleteConfirm.type === 'library') handleLibraryDelete(deleteConfirm.id);
                  }}
                  disabled={isDeleting}
                  className="py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={16} /> : null}
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Comment Delete Confirmation Modal */}
      <AnimatePresence>
        {commentDeleteConfirm.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCommentDeleteConfirm({ show: false, id: '' })}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-high rounded-3xl p-8 shadow-2xl border border-white/10 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Excluir Comentário</h3>
              <p className="text-on-surface-variant text-sm mb-8">
                Tem certeza que deseja excluir este comentário? Esta ação é permanente.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setCommentDeleteConfirm({ show: false, id: '' })}
                  className="py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDeleteComment(commentDeleteConfirm.id)}
                  className="py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-red-600/20"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
