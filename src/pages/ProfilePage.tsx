import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Camera, 
  Shield, 
  Bell, 
  LogOut, 
  Save, 
  ArrowLeft, 
  Loader2, 
  Instagram, 
  Youtube, 
  Trophy, 
  Target, 
  Lock, 
  Globe,
  ChevronRight,
  CheckCircle2,
  Award,
  Music2,
  Zap
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../lib/firebase';
import { onAuthStateChanged, updateProfile, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate, Link } from 'react-router-dom';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'preferences'>('personal');
  
  // Form State
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bannerURL, setBannerURL] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const availableInterests = ['Teclado', 'Violão', 'Canto', 'Produção', 'Teoria', 'Composição', 'Mixagem'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
        setPhotoURL(currentUser.photoURL || '');
        
        // Fetch additional data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.photoURL) setPhotoURL(data.photoURL);
            if (data.bannerURL) setBannerURL(data.bannerURL);
            if (data.bio) setBio(data.bio);
            if (data.instagram) setInstagram(data.instagram);
            if (data.youtube) setYoutube(data.youtube);
            if (data.interests) setInterests(data.interests);
            if (data.emailNotifications !== undefined) setEmailNotifications(data.emailNotifications);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione uma imagem válida.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter no máximo 2MB.' });
      return;
    }

    if (type === 'avatar') setUploading(true);
    else setUploadingBanner(true);
    
    setMessage(null);

    try {
      const path = type === 'avatar' ? `avatars/${auth.currentUser.uid}` : `banners/${auth.currentUser.uid}`;
      const storageRef = ref(storage, path);
      
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT")), 20000)
      );

      await Promise.race([uploadPromise, timeoutPromise]);
      const downloadURL = await getDownloadURL(storageRef);

      if (type === 'avatar') {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
        setPhotoURL(downloadURL);
      } else {
        setBannerURL(downloadURL);
      }

      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        [type === 'avatar' ? 'photoURL' : 'bannerURL']: downloadURL,
        updatedAt: new Date()
      }, { merge: true });

      setMessage({ type: 'success', text: `${type === 'avatar' ? 'Foto' : 'Banner'} atualizado!` });
    } catch (error: any) {
      console.error("Error uploading:", error);
      setMessage({ type: 'error', text: 'Erro ao carregar imagem. Verifique sua conexão.' });
    } finally {
      setUploading(false);
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      await updateProfile(auth.currentUser, { displayName });

      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName,
        bio,
        instagram,
        youtube,
        interests,
        emailNotifications,
        updatedAt: new Date()
      }, { merge: true });

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!auth.currentUser || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setSaving(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Error updating password:", error);
      if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Para sua segurança, faça login novamente antes de trocar a senha.' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao trocar senha.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="pt-24 pb-20 min-h-screen bg-background">
      {/* Banner Section */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden bg-surface-container-low">
        {bannerURL ? (
          <img src={bannerURL} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
            <Globe size={48} className="text-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20"></div>
        <button 
          onClick={() => bannerInputRef.current?.click()}
          className="absolute bottom-6 right-6 md:right-16 p-3 bg-primary text-white rounded-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest z-30"
        >
          {uploadingBanner ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          Alterar Capa
        </button>
        <input type="file" ref={bannerInputRef} onChange={(e) => handleFileUpload(e, 'banner')} accept="image/*" className="hidden" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-16 -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Card & Nav */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel rounded-3xl p-8 border border-white/5 shadow-2xl">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background bg-surface-container-high relative">
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                        <Loader2 className="text-primary animate-spin" size={32} />
                      </div>
                    )}
                    {photoURL ? (
                      <img src={photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-black text-primary uppercase">
                        {displayName?.charAt(0) || user?.email?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2.5 bg-primary text-white rounded-full shadow-xl border-4 border-background hover:scale-110 transition-all"
                  >
                    <Camera size={18} />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'avatar')} accept="image/*" className="hidden" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white tracking-tight">{displayName || 'Usuário'}</h2>
                  <p className="text-on-surface-variant text-sm font-medium">{user?.email}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                    Membro Premium
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/5 text-on-surface-variant text-[10px] font-black uppercase tracking-widest border border-white/10">
                    Nível 12
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 space-y-2">
                <button 
                  onClick={() => setActiveTab('personal')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'personal' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <User size={18} />
                    <span>Dados Pessoais</span>
                  </div>
                  <ChevronRight size={16} className={activeTab === 'personal' ? 'opacity-100' : 'opacity-0'} />
                </button>
                <button 
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'security' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={18} />
                    <span>Segurança</span>
                  </div>
                  <ChevronRight size={16} className={activeTab === 'security' ? 'opacity-100' : 'opacity-0'} />
                </button>
                <button 
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'preferences' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <Bell size={18} />
                    <span>Preferências</span>
                  </div>
                  <ChevronRight size={16} className={activeTab === 'preferences' ? 'opacity-100' : 'opacity-0'} />
                </button>
              </div>
            </div>

            {/* Gamification Stats */}
            <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-6">
              <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                <Award size={14} className="text-primary" />
                Conquistas & Progresso
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-on-surface-variant">Progresso Geral</span>
                    <span className="text-primary">68%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '68%' }}
                      className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                    ></motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`aspect-square rounded-xl flex items-center justify-center border ${i < 4 ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white/5 border-white/10 text-white/10'}`}>
                      <Trophy size={20} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Content Area */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'personal' && (
                <motion.div 
                  key="personal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="glass-panel rounded-3xl p-8 border border-white/5 space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-white tracking-tight">Informações Básicas</h3>
                      {message && (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {message.text}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Nome de Exibição</label>
                        <input 
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white outline-none transition-all"
                          placeholder="Seu nome"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">E-mail</label>
                        <input 
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-4 bg-black/10 border border-white/5 rounded-xl text-white/40 outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Bio / Sobre Você</label>
                      <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white outline-none transition-all resize-none"
                        placeholder="Conte um pouco sobre sua jornada musical..."
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Redes Sociais</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative group">
                          <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type="text"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white outline-none transition-all"
                            placeholder="@seu_instagram"
                          />
                        </div>
                        <div className="relative group">
                          <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type="text"
                            value={youtube}
                            onChange={(e) => setYoutube(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white outline-none transition-all"
                            placeholder="youtube.com/c/seu_canal"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Áreas de Interesse</label>
                      <div className="flex flex-wrap gap-2">
                        {availableInterests.map(interest => (
                          <button
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              interests.includes(interest) 
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                : 'bg-white/5 border-white/10 text-on-surface-variant hover:border-white/20'
                            }`}
                          >
                            {interest}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full md:w-auto flex items-center justify-center gap-3 px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        SALVAR PERFIL
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div 
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="glass-panel rounded-3xl p-8 border border-white/5 space-y-8">
                    <h3 className="text-xl font-black text-white tracking-tight">Segurança da Conta</h3>
                    
                    <div className="space-y-6 max-w-md">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Nova Senha</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white outline-none transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={18} />
                          <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white outline-none transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={handlePasswordChange}
                        disabled={saving || !newPassword}
                        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-primary hover:border-primary transition-all disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Shield size={20} />}
                        ATUALIZAR SENHA
                      </button>
                    </div>
                  </div>

                  <div className="bg-red-500/5 rounded-3xl p-8 border border-red-500/10 space-y-4">
                    <h4 className="text-red-400 font-black uppercase tracking-widest text-xs">Zona de Perigo</h4>
                    <p className="text-on-surface-variant text-sm">Ao excluir sua conta, todos os seus dados de progresso e cursos serão removidos permanentemente.</p>
                    <button className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold text-xs hover:bg-red-500 hover:text-white transition-all">
                      EXCLUIR MINHA CONTA
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div 
                  key="preferences"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="glass-panel rounded-3xl p-8 border border-white/5 space-y-8">
                    <h3 className="text-xl font-black text-white tracking-tight">Preferências</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white">Notificações por E-mail</p>
                          <p className="text-xs text-on-surface-variant">Receba avisos sobre novas aulas e cursos.</p>
                        </div>
                        <button 
                          onClick={() => setEmailNotifications(!emailNotifications)}
                          className={`w-14 h-8 rounded-full transition-all relative ${emailNotifications ? 'bg-primary' : 'bg-white/10'}`}
                        >
                          <motion.div 
                            animate={{ x: emailNotifications ? 26 : 4 }}
                            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white">Perfil Público</p>
                          <p className="text-xs text-on-surface-variant">Permitir que outros alunos vejam seu progresso.</p>
                        </div>
                        <button className="w-14 h-8 rounded-full bg-primary transition-all relative">
                          <div className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full shadow-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
