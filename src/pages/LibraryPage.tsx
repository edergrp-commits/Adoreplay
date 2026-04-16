import { motion } from 'motion/react';
import { FileText, Music, Mic2, Layers, Download, Search, Filter, Loader2, Lock } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

interface LibraryResource {
  id: string;
  title: string;
  category: 'partitura' | 'cifra' | 'kit-voz' | 'multitrack';
  fileUrl: string;
  thumbnail?: string;
  description?: string;
}

const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: Filter },
  { id: 'partitura', name: 'Partituras', icon: FileText },
  { id: 'cifra', name: 'Cifras', icon: Music },
  { id: 'kit-voz', name: 'Kits de Voz', icon: Mic2 },
  { id: 'multitrack', name: 'Multitracks', icon: Layers },
];

export default function LibraryPage() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login?redirect=/library');
        return;
      }

      // Check subscription
      const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setIsSubscribed(userData.isSubscribed || userData.role === 'admin' || user.email === 'edergrp@gmail.com');
        }
        setAuthLoading(false);
      });

      return () => unsubUser();
    });

    const q = query(collection(db, 'library'), orderBy('title', 'asc'));
    const unsubLibrary = onSnapshot(q, (snapshot) => {
      setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryResource)));
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubLibrary();
    };
  }, [navigate]);

  const filteredResources = useMemo(() => {
    return resources.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [resources, searchTerm, selectedCategory]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={48} />
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-8 bg-background flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-8">
            <Lock size={40} />
          </div>
          <h1 className="font-headline text-3xl font-black text-white uppercase mb-4">Conteúdo Exclusivo</h1>
          <p className="text-on-surface-variant mb-8">
            A Biblioteca de Recursos é exclusiva para assinantes AdorePlay. Assine agora para ter acesso a partituras, cifras, kits de voz e multitracks.
          </p>
          <Link 
            to="/pricing" 
            className="inline-block bg-primary text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/80 transition-all"
          >
            Ver Planos de Assinatura
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <span className="h-px w-12 bg-primary"></span>
            <span className="text-primary font-black text-xs uppercase tracking-[0.3em]">Recursos Exclusivos</span>
          </motion.div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-headline text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-4"
              >
                Biblioteca <span className="text-primary">Musical</span>
              </motion.h1>
              <p className="text-on-surface-variant max-w-xl">
                Encontre partituras, cifras, kits de voz e multitracks para auxiliar no seu ministério e estudo.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
              <input 
                type="text"
                placeholder="Buscar recurso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-container-high border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>
        </header>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all border ${
                selectedCategory === cat.id 
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-surface-container-low border-white/5 text-on-surface-variant hover:border-white/20'
              }`}
            >
              <cat.icon size={16} />
              {cat.name}
            </button>
          ))}
        </div>

        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-surface-container-low rounded-2xl border border-white/5 hover:border-primary/30 transition-all overflow-hidden"
              >
                <div className="aspect-[4/3] relative bg-surface-container-high flex items-center justify-center p-8">
                  {item.thumbnail ? (
                    <img 
                      src={item.thumbnail} 
                      alt={item.title} 
                      className="w-full h-full object-cover rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      {item.category === 'partitura' && <FileText size={40} />}
                      {item.category === 'cifra' && <Music size={40} />}
                      {item.category === 'kit-voz' && <Mic2 size={40} />}
                      {item.category === 'multitrack' && <Layers size={40} />}
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[8px] font-black text-primary uppercase tracking-widest">
                      {item.category.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-6 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <a 
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/5 text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:border-primary transition-all group/btn"
                  >
                    <Download size={14} className="group-hover/btn:animate-bounce" />
                    Baixar Arquivo
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-surface-container-low rounded-3xl border border-dashed border-white/10">
            <Search size={64} className="text-white/10 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Nenhum recurso encontrado</h2>
            <p className="text-on-surface-variant max-w-md mx-auto">
              Tente ajustar sua busca ou filtro para encontrar o que procura.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
