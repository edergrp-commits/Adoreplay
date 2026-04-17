import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, Music, Mic, Guitar, Zap, Speaker, Users2, GraduationCap, Heart, Library, Layout, Film, Users, X, LogOut, User as UserIcon, Shield, PlayCircle, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { useIconSettings } from '../hooks/useIconSettings';
import DynamicIcon from './DynamicIcon';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function Header() {
  const { getIcon } = useIconSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isMasterclassOpen, setIsMasterclassOpen] = useState(false);
  const [isEntertainmentOpen, setIsEntertainmentOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [dbMasterclasses, setDbMasterclasses] = useState<any[]>([]);
  const [dbEntertainment, setDbEntertainment] = useState<any[]>([]);
  const [dbLibrary, setDbLibrary] = useState<any[]>([]);
  const [dbLessons, setDbLessons] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      setDbCourses(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().title, 
        path: `/courses/${doc.id}`, 
        icon: getIcon(doc.data().category?.toLowerCase() || 'teclas'), 
        type: 'Curso' 
      })));
    }, (error) => {
      console.error("Error in Header courses listener:", error);
    });

    const unsubMasterclasses = onSnapshot(collection(db, 'masterclasses'), (snapshot) => {
      setDbMasterclasses(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().title, 
        path: `/masterclass/${doc.data().slug}`, 
        icon: getIcon('ui_masterclass'), 
        type: 'Masterclass' 
      })));
    }, (error) => {
      console.error("Error in Header masterclasses listener:", error);
    });

    const unsubEntertainment = onSnapshot(collection(db, 'entertainment'), (snapshot) => {
      setDbEntertainment(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().title, 
        path: `/entertainment/${doc.data().slug}`, 
        icon: getIcon('ui_entertainment'), 
        type: 'Entretenimento' 
      })));
    }, (error) => {
      console.error("Error in Header entertainment listener:", error);
    });

    const unsubLessons = onSnapshot(collection(db, 'lessons'), (snapshot) => {
      setDbLessons(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().title, 
        path: `/lesson/${doc.data().courseId}/${doc.id}`, 
        icon: PlayCircle, 
        type: 'Aula' 
      })));
    }, (error) => {
      console.error("Error in Header lessons listener:", error);
    });

    return () => {
      unsubCourses();
      unsubMasterclasses();
      unsubEntertainment();
      unsubLessons();
    };
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const unsubUser = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setIsAdmin(userData?.role === 'admin' || currentUser.email === 'edergrp@gmail.com');
            setIsSubscribed(userData?.isSubscribed || userData?.role === 'admin');
          } else {
            // Document might not exist yet if user just signed up
            setIsAdmin(currentUser.email === 'edergrp@gmail.com');
            setIsSubscribed(false);
          }
        }, (error) => {
          if (error.message.includes('insufficient permissions')) {
            console.warn("Permission issue in user listener - usually resolved after role is set");
          } else {
            handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          }
        });

        const unsubNotifications = onSnapshot(
          query(
            collection(db, 'notifications'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
          ),
          (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, 'notifications');
          }
        );

        const unsubLibrary = onSnapshot(collection(db, 'library'), (snapshot) => {
          setDbLibrary(snapshot.docs.map(doc => ({ 
            id: doc.id, 
            name: doc.data().title, 
            path: `/library`, 
            icon: Library, 
            type: 'Biblioteca' 
          })));
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'library');
        });

        return () => {
          unsubUser();
          unsubNotifications();
          unsubLibrary();
        };
      } else {
        setIsAdmin(false);
        setIsSubscribed(false);
        setNotifications([]);
        setDbLibrary([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const navItems = [
    { name: 'Início', path: '/' },
    { name: 'Minha Lista', path: '/my-list' },
  ];

  const allItems = useMemo(() => [
    ...dbCourses, 
    ...dbMasterclasses, 
    ...dbEntertainment, 
    ...dbLibrary, 
    ...dbLessons
  ], [dbCourses, dbMasterclasses, dbEntertainment, dbLibrary, dbLessons]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [searchQuery, allItems]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close search on escape key and open on '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
      if (e.key === '/' && !isSearchOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  return (
    <nav className="fixed top-0 w-full z-[100] bg-background/80 backdrop-blur-xl flex justify-between items-center px-8 h-20 border-b border-white/5">
      <div className="flex items-center gap-12">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-all shadow-2xl">
            <img src="/favicon.svg" alt="AdorePlay" className="w-6 h-6 object-contain shadow-primary/20" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white font-brand uppercase group-hover:text-primary transition-colors">
            AdorePlay
          </span>
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          <Link
            to="/"
            className={`font-headline font-bold text-sm tracking-wide transition-colors ${
              location.pathname === '/' 
                ? 'text-white border-b-2 border-primary pb-1' 
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Início
          </Link>

          <Link
            to="/library"
            className={`font-headline font-bold text-sm tracking-wide transition-colors ${
              location.pathname === '/library' 
                ? 'text-white border-b-2 border-primary pb-1' 
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Biblioteca
          </Link>

          {/* Courses Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsCoursesOpen(true)}
            onMouseLeave={() => setIsCoursesOpen(false)}
          >
            <button
              className={`flex items-center gap-1 font-headline font-bold text-sm tracking-wide transition-colors ${
                location.pathname.startsWith('/courses')
                  ? 'text-white border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Cursos
              <ChevronDown size={14} className={`transition-transform duration-300 ${isCoursesOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isCoursesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-64 bg-surface-container-high border border-white/10 rounded-xl mt-2 overflow-hidden shadow-2xl backdrop-blur-2xl"
                >
                  <div className="p-2">
                    {dbCourses.length > 0 ? (
                      dbCourses.slice(0, 6).map((course) => (
                        <Link
                          key={course.id}
                          to={course.path}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant hover:text-white group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <DynamicIcon name={course.icon} size={16} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                          </div>
                          <span className="font-bold text-xs uppercase tracking-widest truncate">{course.name}</span>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Nenhum curso cadastrado</div>
                    )}
                    <div className="border-t border-white/5 mt-2 pt-2">
                      <Link
                        to="/courses"
                        className="flex items-center px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors text-primary font-black text-[10px] uppercase tracking-[0.2em]"
                      >
                        Ver todos os cursos
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Masterclass Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsMasterclassOpen(true)}
            onMouseLeave={() => setIsMasterclassOpen(false)}
          >
            <button
              className={`flex items-center gap-1 font-headline font-bold text-sm tracking-wide transition-colors ${
                location.pathname === '/masterclass'
                  ? 'text-white border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Masterclass
              <ChevronDown size={14} className={`transition-transform duration-300 ${isMasterclassOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isMasterclassOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-72 bg-surface-container-high border border-white/10 rounded-xl mt-2 overflow-hidden shadow-2xl backdrop-blur-2xl"
                >
                  <div className="p-2">
                    {dbMasterclasses.length > 0 ? (
                      dbMasterclasses.slice(0, 6).map((mc) => (
                        <Link
                          key={mc.id}
                          to={mc.path}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant hover:text-white group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <DynamicIcon name={mc.icon} size={16} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                          </div>
                          <span className="font-bold text-[10px] uppercase tracking-widest leading-tight truncate">{mc.name}</span>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Nenhuma masterclass</div>
                    )}
                    <div className="border-t border-white/5 mt-2 pt-2">
                      <Link
                        to="/masterclass"
                        className="flex items-center px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors text-primary font-black text-[10px] uppercase tracking-[0.2em]"
                      >
                        Ver todas as masterclasses
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Entertainment Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsEntertainmentOpen(true)}
            onMouseLeave={() => setIsEntertainmentOpen(false)}
          >
            <button
              className={`flex items-center gap-1 font-headline font-bold text-sm tracking-wide transition-colors ${
                location.pathname === '/entertainment'
                  ? 'text-white border-b-2 border-primary pb-1' 
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Entretenimento
              <ChevronDown size={14} className={`transition-transform duration-300 ${isEntertainmentOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isEntertainmentOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-72 bg-surface-container-high border border-white/10 rounded-xl mt-2 overflow-hidden shadow-2xl backdrop-blur-2xl"
                >
                  <div className="p-2">
                    {dbEntertainment.length > 0 ? (
                      dbEntertainment.slice(0, 6).map((item) => (
                        <Link
                          key={item.id}
                          to={item.path}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant hover:text-white group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <DynamicIcon name={item.icon} size={16} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                          </div>
                          <span className="font-bold text-[10px] uppercase tracking-widest leading-tight truncate">{item.name}</span>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Nenhum conteúdo</div>
                    )}
                    <div className="border-t border-white/5 mt-2 pt-2">
                      <Link
                        to="/entertainment"
                        className="flex items-center px-4 py-3 rounded-lg hover:bg-primary/10 transition-colors text-primary font-black text-[10px] uppercase tracking-[0.2em]"
                      >
                        Ver tudo
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Real Search Implementation */}
        <div className="relative flex items-center">
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 350, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="absolute right-0 flex items-center"
              >
                <div className="relative w-full">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="O que você quer aprender hoje?"
                    className="w-full bg-surface-container-high border border-white/10 rounded-full py-2.5 pl-10 pr-16 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50 shadow-2xl"
                  />
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest pointer-events-none">
                    <span>/</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-on-surface-variant hover:text-white transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {searchQuery.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 w-full bg-surface-container-high border border-white/10 rounded-2xl mt-3 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl z-[110]"
                    >
                      <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="px-3 py-2 border-b border-white/5 mb-1">
                          <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Resultados da Busca</span>
                        </div>
                        {filteredItems.length > 0 ? (
                          filteredItems.map((item, i) => (
                            <Link
                              key={i}
                              to={item.path}
                              onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-on-surface-variant hover:text-white group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all shrink-0">
                                <DynamicIcon name={item.icon} size={18} className="text-on-surface-variant group-hover:text-primary transition-all" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-[11px] uppercase tracking-widest leading-tight truncate">{item.name}</span>
                                <span className="text-[8px] text-primary/60 font-black uppercase tracking-[0.2em] mt-0.5">{item.type}</span>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="px-4 py-10 text-center">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                              <Search size={20} className="text-on-surface-variant/30" />
                            </div>
                            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nenhum resultado encontrado</p>
                            <p className="text-[8px] text-on-surface-variant/50 uppercase tracking-widest mt-1">Tente outros termos de busca</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              setIsNotificationsOpen(false);
            }}
            className={`text-on-surface-variant hover:text-white transition-all p-2.5 rounded-full hover:bg-white/5 group ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <Search size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div 
          className="relative"
          onMouseEnter={() => setIsNotificationsOpen(true)}
          onMouseLeave={() => setIsNotificationsOpen(false)}
        >
          <button className="text-on-surface-variant hover:text-white transition-all p-2.5 rounded-full hover:bg-white/5 relative group">
            <Bell size={20} className="group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-background animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 w-80 bg-surface-container-high border border-white/10 rounded-2xl mt-2 overflow-hidden shadow-2xl backdrop-blur-2xl"
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Notificações</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      className="text-[8px] font-black text-primary hover:text-white uppercase tracking-widest transition-colors"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read) markAsRead(notif.id);
                          if (notif.link) navigate(notif.link);
                        }}
                        className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer group ${!notif.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            notif.type === 'success' ? 'bg-green-500/10 text-green-500' :
                            notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                            notif.type === 'error' ? 'bg-red-500/10 text-red-500' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {notif.type === 'success' ? <CheckCircle size={16} /> :
                             notif.type === 'warning' ? <AlertTriangle size={16} /> :
                             notif.type === 'error' ? <AlertCircle size={16} /> :
                             <Info size={16} />}
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[11px] font-bold text-white leading-tight">{notif.title}</p>
                            <p className="text-[10px] text-on-surface-variant leading-relaxed line-clamp-2">{notif.message}</p>
                            <p className="text-[8px] text-on-surface-variant/40 font-bold uppercase tracking-widest mt-1">
                              {new Date(notif.createdAt?.seconds * 1000).toLocaleDateString()}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <Bell size={32} className="text-white/10 mx-auto mb-3" />
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Nenhuma notificação</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isSubscribed ? (
          <Link 
            to="/pricing" 
            className="hidden lg:flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-accent/20"
          >
            <Zap size={14} className="fill-white" />
            Assistir Agora
          </Link>
        ) : (
          isAdmin && (
            <Link 
              to="/admin" 
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-black text-[10px] uppercase tracking-widest transition-all border border-primary/30"
            >
              <Shield size={14} />
              Painel Admin
            </Link>
          )
        )}

        {!user && (
          <Link 
            to="/login" 
            className="text-white font-black text-[10px] uppercase tracking-widest hover:text-primary transition-colors"
          >
            Entrar
          </Link>
        )}
        
        {/* Profile Dropdown */}
        <div 
          className="relative"
          onMouseEnter={() => setIsProfileOpen(true)}
          onMouseLeave={() => setIsProfileOpen(false)}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 cursor-pointer hover:border-primary/50 transition-colors bg-surface-container-high">
            {user?.photoURL ? (
              <img 
                alt={user.displayName || 'User'} 
                src={user.photoURL}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary font-black">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
            )}
          </div>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 w-64 bg-surface-container-high border border-white/10 rounded-xl mt-2 overflow-hidden shadow-2xl backdrop-blur-2xl"
              >
                <div className="p-2">
                  <div className="px-4 py-3 border-b border-white/5 mb-2">
                    <p className="text-xs font-black text-white uppercase tracking-widest truncate">
                      {user?.displayName || 'Aluno AdorePlay'}
                    </p>
                    <p className="text-[10px] text-on-surface-variant font-bold truncate">
                      {user?.email || 'Bem-vindo!'}
                    </p>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant hover:text-white group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <UserIcon size={16} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                    </div>
                    <span className="font-bold text-[10px] uppercase tracking-widest">Meu Perfil</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-primary hover:text-primary group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Shield size={16} className="text-primary" />
                      </div>
                      <span className="font-bold text-[10px] uppercase tracking-widest">Painel Admin</span>
                    </Link>
                  )}

                  <Link
                    to="/dashboard"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant hover:text-white group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Layout size={16} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                    </div>
                    <span className="font-bold text-[10px] uppercase tracking-widest">Dashboard</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant hover:text-white group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                      <LogOut size={16} className="text-on-surface-variant group-hover:text-red-400 transition-colors" />
                    </div>
                    <span className="font-bold text-[10px] uppercase tracking-widest">Sair</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
