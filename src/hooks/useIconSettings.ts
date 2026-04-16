import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const defaultIcons: Record<string, string> = {
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
};

export function useIconSettings() {
  const [icons, setIcons] = useState<Record<string, string>>(defaultIcons);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'icons'), (docSnap) => {
      if (docSnap.exists()) {
        setIcons(prev => ({ ...prev, ...docSnap.data() }));
      }
    });

    return () => unsub();
  }, []);

  const getIcon = (key: string) => icons[key] || defaultIcons[key] || 'HelpCircle';

  return { icons, getIcon };
}
