import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface FavoriteButtonProps {
  contentId: string;
  className?: string;
  showText?: boolean;
}

export default function FavoriteButton({ contentId, className = '', showText = false }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const unsubUser = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const favorites = docSnap.data().favorites || [];
            setIsFavorite(favorites.includes(contentId));
          }
        });
        return () => unsubUser();
      } else {
        setIsFavorite(false);
      }
    });

    return () => unsubscribeAuth();
  }, [contentId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Could trigger a login modal or redirect
      window.location.href = `/login?redirect=${window.location.pathname}`;
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        favorites: isFavorite ? arrayRemove(contentId) : arrayUnion(contentId)
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={loading}
      onClick={toggleFavorite}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
        isFavorite 
          ? 'bg-primary/20 text-primary border border-primary/30' 
          : 'bg-white/5 text-white/60 hover:text-white border border-white/10 hover:border-white/20'
      } ${className}`}
    >
      <Heart 
        size={18} 
        className={`${isFavorite ? 'fill-primary' : ''} transition-all`}
      />
      {showText && (
        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
          {isFavorite ? 'Na minha lista' : 'Minha lista'}
        </span>
      )}
    </motion.button>
  );
}
