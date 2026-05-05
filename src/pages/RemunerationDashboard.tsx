import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Users, 
  TrendingUp, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Info,
  DollarSign,
  PieChart,
  LayoutDashboard,
  Home,
  Wallet,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  ArrowLeft,
  Activity,
  Calculator,
  Lock,
  Eye,
  Clock
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

interface Participant {
  id: string;
  name: string;
  views: number;
  minutes: number;
  color?: string;
  videoIds?: string[];
  isFilmmaker?: boolean;
}

interface RemunerationConfig {
  subscriptionValue: number;
  activeStudents: number;
  platformMargin: number;
  viewsWeight: number;
  filmmakerFactor: number;
  pandaApiKey?: string;
  pandaPlayerHost?: string;
  autoSync?: boolean;
  syncMonth: number;
  syncYear: number;
}

export default function RemunerationDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Configurações Globais
  const [config, setConfig] = useState<RemunerationConfig>({
    subscriptionValue: 89.90,
    activeStudents: 1250,
    platformMargin: 30,
    viewsWeight: 40,
    filmmakerFactor: 50,
    syncMonth: new Date().getMonth() + 1,
    syncYear: new Date().getFullYear()
  });

  // Dados dos Participantes
  const [teachersPerformance, setTeachersPerformance] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modais
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [participantForm, setParticipantForm] = useState({
    name: '',
    views: 0,
    minutes: 0,
    videoIds: '' // Now a string for the form
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, id: string, name: string }>({
    show: false,
    id: '',
    name: ''
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          const userData = docSnap.data();
          if (userData?.role === 'admin' || user.email === 'edergrp@gmail.com') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            navigate('/');
          }
        });
        return () => unsubUser();
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin === null) return;

    // Config Listener
    const unsubConfig = onSnapshot(doc(db, 'remuneration_config', 'current'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as RemunerationConfig;
        setConfig(prev => ({ 
          ...prev, 
          ...data,
          subscriptionValue: data.subscriptionValue ?? prev.subscriptionValue,
          activeStudents: data.activeStudents ?? prev.activeStudents,
          platformMargin: data.platformMargin ?? prev.platformMargin,
          viewsWeight: data.viewsWeight ?? prev.viewsWeight,
          filmmakerFactor: data.filmmakerFactor ?? prev.filmmakerFactor,
        }));
      }
      setLoading(false);
    });

    // Participants Listener
    const unsubParticipants = onSnapshot(query(collection(db, 'teacher_performance'), orderBy('views', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant));
      setTeachersPerformance(data);
    });

    return () => {
      unsubConfig();
      unsubParticipants();
    };
  }, [isAdmin]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'remuneration_config', 'current'), {
        ...config,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error("Error saving config:", error);
      alert('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Parse videoIds from comma-separated string to array
    const videoIdsArray = participantForm.videoIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    try {
      if (editingParticipant) {
        if (editingParticipant.id === 'filmmaker-id') {
          // Special case for filmmaker: update both the factor in config and its override in performance if changed
          await updateDoc(doc(db, 'remuneration_config', 'current'), {
            filmmakerFactor: config.filmmakerFactor,
            updatedAt: serverTimestamp()
          });
          
          await setDoc(doc(db, 'teacher_performance', 'filmmaker-id'), {
            name: participantForm.name,
            views: participantForm.views,
            minutes: participantForm.minutes,
            videoIds: videoIdsArray,
            updatedAt: serverTimestamp()
          }, { merge: true });

        } else {
          await updateDoc(doc(db, 'teacher_performance', editingParticipant.id), {
            name: participantForm.name,
            views: participantForm.views,
            minutes: participantForm.minutes,
            videoIds: videoIdsArray,
            updatedAt: serverTimestamp()
          });
        }
      } else {
        await addDoc(collection(db, 'teacher_performance'), {
          name: participantForm.name,
          views: participantForm.views,
          minutes: participantForm.minutes,
          videoIds: videoIdsArray,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsParticipantModalOpen(false);
      setEditingParticipant(null);
      setParticipantForm({ name: '', views: 0, minutes: 0, videoIds: '' });
    } catch (error) {
      console.error("Error saving participant:", error);
      alert('Erro ao salvar participante.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteParticipant = async () => {
    if (!deleteConfirm.id) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, 'teacher_performance', deleteConfirm.id));
      setDeleteConfirm({ show: false, id: '', name: '' });
    } catch (error) {
      console.error("Error deleting participant:", error);
      alert('Erro ao deletar participante.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cálculos de Remuneração (Idênticos ao AdminPanel)
  const totalRevenue = config.subscriptionValue * config.activeStudents;
  const poolPercentage = 100 - config.platformMargin;
  const availablePool = totalRevenue * (poolPercentage / 100);
  const watchTimeWeight = 100 - config.viewsWeight;

  const realTeachers = teachersPerformance.filter(t => t.id !== 'filmmaker-id');
  const filmmakerRecord = teachersPerformance.find(t => t.id === 'filmmaker-id');

  const totalTeacherViews = realTeachers.reduce((acc, t) => acc + (t.views || 0), 0);
  const totalTeacherMinutes = realTeachers.reduce((acc, t) => acc + (t.minutes || 0), 0);

  // Filmmaker metrics: use manual override if exists, else automatic sum
  const fViews = filmmakerRecord?.views ?? totalTeacherViews;
  const fMinutes = filmmakerRecord?.minutes ?? totalTeacherMinutes;
  
  const fScoreBase = (fViews * (config.viewsWeight / 100)) + (fMinutes * (watchTimeWeight / 100));
  const filmmakerScore = fScoreBase * (config.filmmakerFactor / 100);

  const teachersWithScores = realTeachers.map(t => {
    const score = ((t.views || 0) * (config.viewsWeight / 100)) + ((t.minutes || 0) * (watchTimeWeight / 100));
    return { ...t, score, isFilmmaker: false };
  });

  const teachersAndFilmmaker = [
    ...teachersWithScores,
    {
      id: 'filmmaker-id',
      name: filmmakerRecord?.name || 'Equipe de Professores',
      views: fViews,
      minutes: fMinutes,
      score: filmmakerScore,
      isFilmmaker: true,
      videoIds: filmmakerRecord?.videoIds || []
    }
  ];

  const totalScore = teachersAndFilmmaker.reduce((acc, t) => acc + t.score, 0);

  const rankedTeachers = teachersAndFilmmaker.map((t, index) => {
    const share = totalScore > 0 ? (t.score / totalScore) : (teachersAndFilmmaker.length > 0 ? 1 / teachersAndFilmmaker.length : 0);
    const remuneration = share * availablePool;
    
    // Cores baseadas no índice
    const colors = ['#3B82F6', '#F97316', '#10B981', '#8B5CF6', '#EC4899', '#EAB308', '#06B6D4'];
    const pColor = t.isFilmmaker ? '#4F46E5' : colors[index % colors.length];

    return { 
      ...t, 
      share: (share * 100).toFixed(1), 
      remuneration,
      color: pColor
    };
  }).sort((a, b) => b.remuneration - a.remuneration);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-gray-100 italic font-bold text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white text-xs whitespace-nowrap overflow-hidden">A</div>
          Painel de Controle
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar ao Admin
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 font-semibold rounded-lg transition-colors">
            <Wallet size={20} />
            Pool de Lucros
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
            <Users size={20} />
            Participantes
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-left">
            <TrendingUp size={20} />
            Métricas de Ciclo
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.email}`} alt="Admin" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-gray-900 truncate">{auth.currentUser?.email?.split('@')[0]}</span>
              <span className="text-[10px] text-gray-400 capitalize">Administrador</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Detalhado de Remuneração</h1>
            <p className="text-gray-500">Gestão financeira e critérios de produtividade da plataforma.</p>
          </div>
          <button 
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Configurações
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Configurações de Pool */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Calculator size={24} />
                </div>
                <h2 className="font-bold text-gray-800 text-lg">Parâmetros do Pool</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Médio (R$)</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus-within:bg-white focus-within:border-blue-500 transition-all">
                  <span className="text-gray-400 mr-2 text-sm">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={config.subscriptionValue}
                    onChange={(e) => setConfig({...config, subscriptionValue: Number(e.target.value)})}
                    className="w-full outline-none text-gray-900 font-black"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base de Assinantes</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus-within:bg-white focus-within:border-blue-500 transition-all">
                  <Users className="text-gray-400 mr-2" size={16} />
                  <input 
                    type="number" 
                    value={config.activeStudents}
                    onChange={(e) => setConfig({...config, activeStudents: Number(e.target.value)})}
                    className="w-full outline-none text-gray-900 font-black"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custo Operacional (%)</label>
                <div className="flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 focus-within:bg-white focus-within:border-blue-500 transition-all">
                  <input 
                    type="number" 
                    value={config.platformMargin}
                    onChange={(e) => setConfig({...config, platformMargin: Number(e.target.value)})}
                    className="w-full outline-none text-gray-900 font-black text-center"
                  />
                  <span className="text-gray-400 ml-2 text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-200 transition-all">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Faturamento Bruto</span>
                <span className="text-xl font-black text-gray-900 font-mono">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 group hover:border-blue-300 transition-all">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">Professores ({100 - config.platformMargin}%)</span>
                <span className="text-xl font-black text-blue-600 font-mono">R$ {availablePool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Plataforma ({config.platformMargin}%)</span>
                <span className="text-xl font-black text-gray-900">R$ {(totalRevenue - availablePool).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Gateway</span>
                <span className="text-xl font-black text-gray-900">{config.filmmakerFactor}%</span>
              </div>
            </div>
          </div>

          {/* Configuração de Pesos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp size={24} />
              </div>
              <h2 className="font-bold text-gray-800 text-lg">Cálculo de Score</h2>
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Audiência (Views)</span>
                  </div>
                  <span className="text-lg font-black text-blue-600 font-mono">{config.viewsWeight}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={config.viewsWeight}
                  onChange={(e) => setConfig({...config, viewsWeight: Number(e.target.value)})}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tempo Assistido (Min)</span>
                  </div>
                  <span className="text-lg font-black text-indigo-600 font-mono">{watchTimeWeight}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-lg relative overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${watchTimeWeight}%` }}
                    className="absolute top-0 right-0 h-full bg-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gray-900 rounded-2xl relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 opacity-10 p-4">
                  <Activity size={80} />
                </div>
                <p className="text-xs leading-relaxed font-bold opacity-80 relative z-10">
                  O score é balanceado entre alcance e profundidade. Professores que mantêm o aluno por mais tempo são premiados pelo peso de retenção.
                </p>
            </div>
          </div>
        </div>

        {/* Tabela de Participantes */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-8 flex flex-col sm:flex-row items-center justify-between border-b border-gray-50 gap-4">
            <div className="flex items-center gap-3">
              <Users className="text-gray-400" size={24} />
              <h2 className="font-bold text-gray-800 text-lg">Impacto por Participante</h2>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={() => {
                  const csvRows = [
                    ['Professor/Conteudo', 'Visualizacoes', 'Minutos Assistidos', 'Score', '% do Pool', 'Remuneracao (RS)'],
                    ...rankedTeachers.map(t => [
                      `"${t.name}"`,
                      t.views.toString(),
                      t.minutes.toString(),
                      t.score.toFixed(2),
                      t.share + '%',
                      `"${t.remuneration.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}"`
                    ])
                  ];
                  const csvContent = csvRows.map(e => e.join(",")).join("\n");
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.setAttribute("href", url);
                  link.setAttribute("download", `relatorio_remuneracao_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="p-3 border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                title="Exportar Relatório CSV"
              >
                <Download size={20} />
              </button>
              <button 
                onClick={() => {
                  setEditingParticipant(null);
                  setParticipantForm({ name: '', views: 0, minutes: 0, videoIds: '' });
                  setIsParticipantModalOpen(true);
                }}
                className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 whitespace-nowrap"
              >
                <Plus size={20} />
                Novo Professor
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-left border-b border-gray-100/50">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[240px]">Participante</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Audiência (Views)</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Produtividade (Min)</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Score Relativo</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Share %</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Repasse (R$)</th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rankedTeachers.map((t, index) => (
                  <tr key={t.id} className={`group transition-all ${t.isFilmmaker ? 'bg-indigo-50/30' : (index === 0 ? 'bg-blue-50/20' : 'hover:bg-gray-50/50')}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: t.color }}
                        >
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <span className={`font-black tracking-tight block ${t.isFilmmaker ? 'text-indigo-600' : 'text-gray-900'}`}>{t.name}</span>
                          {t.isFilmmaker && <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Expert Corporativo</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center font-bold text-gray-600 font-mono text-sm">{t.views?.toLocaleString('pt-BR')}</td>
                    <td className="px-8 py-6 text-center font-bold text-gray-600 font-mono text-sm">{t.minutes?.toLocaleString('pt-BR')}m</td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${t.isFilmmaker ? 'bg-indigo-500/10 text-indigo-600 border-indigo-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {t.score?.toFixed(1)} PTS
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3 justify-center max-w-[120px] mx-auto min-w-[80px]">
                        <div className="flex-1 h-1.5 bg-gray-200/50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${t.share}%` }}
                            className="h-full rounded-full" 
                            style={{ backgroundColor: t.color }}
                          />
                        </div>
                        <span className="text-[11px] font-black text-gray-500 tracking-tighter">{t.share}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={`text-lg font-black font-mono tracking-tighter ${t.isFilmmaker ? 'text-indigo-600' : 'text-gray-900'}`}>
                        R$ {t.remuneration?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingParticipant(t);
                            setParticipantForm({ 
                              name: t.name || '', 
                              views: t.views || 0, 
                              minutes: t.minutes || 0,
                              videoIds: t.videoIds ? t.videoIds.join(', ') : ''
                            });
                            setIsParticipantModalOpen(true);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar Dados"
                        >
                          <Edit2 size={16} />
                        </button>
                        {!t.isFilmmaker ? (
                          <button 
                            onClick={() => setDeleteConfirm({ show: true, id: t.id, name: t.name || '' })}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir Professor"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <div className="p-2 bg-indigo-50 text-indigo-400 rounded-lg cursor-help underline decoration-dotted" title="Este é um participante corporativo. Você pode editá-lo mas não excluí-lo diretamente.">
                            <Lock size={16} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Participant Modal */}
      <AnimatePresence>
        {isParticipantModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsParticipantModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden shadow-blue-900/10"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-800 tracking-tight">
                  {editingParticipant?.isFilmmaker ? 'Configurar Equipe de Professores' : (editingParticipant ? 'Editar Performance' : 'Novo Participante')}
                </h3>
                <button onClick={() => setIsParticipantModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleParticipantSubmit} className="p-8 space-y-6">
                {editingParticipant?.isFilmmaker && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Info size={16} className="text-indigo-600" />
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Configuração de Gateway</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        value={config.filmmakerFactor}
                        onChange={(e) => setConfig({...config, filmmakerFactor: Number(e.target.value)})}
                        className="flex-1 h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className="text-lg font-black text-indigo-600 font-mono w-14 text-right">{config.filmmakerFactor}%</span>
                    </div>
                    <p className="text-[9px] text-indigo-400 font-bold leading-tight">
                      Este percentual define a retenção ou ajuste de Gateway sobre o score gerado no ciclo.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identificação do Expert</label>
                  <input 
                    type="text"
                    required
                    disabled={editingParticipant?.isFilmmaker}
                    value={participantForm.name}
                    onChange={(e) => setParticipantForm({...participantForm, name: e.target.value})}
                    placeholder="Nome do Professor"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Audiência (Views)</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={participantForm.views}
                      onChange={(e) => setParticipantForm({...participantForm, views: Number(e.target.value)})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:border-blue-500 focus:bg-white outline-none transition-all font-mono font-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Produtividade (Min)</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={participantForm.minutes}
                      onChange={(e) => setParticipantForm({...participantForm, minutes: Number(e.target.value)})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:border-blue-500 focus:bg-white outline-none transition-all font-mono font-black"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">IDs de Vídeo Panda (Separados por vírgula)</label>
                  <textarea 
                    value={participantForm.videoIds}
                    onChange={(e) => setParticipantForm({...participantForm, videoIds: e.target.value})}
                    placeholder="ID1, ID2, ID3..."
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:border-blue-500 focus:bg-white outline-none transition-all font-mono text-sm font-bold resize-none"
                  />
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter ml-1">
                    Esses IDs são usados para sincronização automática via Panda Video.
                  </p>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsParticipantModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    {isSaving && <Loader2 className="animate-spin" size={18} />}
                    {editingParticipant ? 'Atualizar Dados' : 'Criar Registro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm({ show: false, id: '', name: '' })}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">Remover Participante?</h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">
                Tem certeza que deseja apagar o registro de <span className="font-black text-gray-800">{deleteConfirm.name}</span>? Os dados de performance desse ciclo serão perdidos.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm({ show: false, id: '', name: '' })}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                >
                  Manter
                </button>
                <button 
                  onClick={handleDeleteParticipant}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="animate-spin" size={18} />}
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
