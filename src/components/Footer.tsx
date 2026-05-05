import { Link } from 'react-router-dom';
import { Instagram, Youtube, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [footerData, setFooterData] = useState({
    description: 'A maior plataforma de ensino musical e entretenimento cristão do Brasil. Aprenda com os melhores mestres e inspire-se diariamente.',
    instagram: '#',
    youtube: '#',
    facebook: '#',
    email: 'contato@adoreplay.com.br',
    phone: '(41) 3333-3333',
    location: 'Curitiba, PR - Brasil'
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'footer'), (docSnap) => {
      if (docSnap.exists()) {
        setFooterData(docSnap.data() as any);
      }
    });
    return () => unsub();
  }, []);

  return (
    <footer className="bg-surface-container-low border-t border-white/5 pt-20 pb-10 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-all">
                <img src="/favicon.svg" alt="AdorePlay" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-3xl font-black tracking-tighter text-primary font-brand uppercase hover:opacity-80 transition-opacity">
                AdorePlay
              </span>
            </Link>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
              {footerData.description}
            </p>
            <div className="flex gap-4">
              <a href={footerData.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all duration-300">
                <Instagram size={18} />
              </a>
              <a href={footerData.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all duration-300">
                <Youtube size={18} />
              </a>
              <a href={footerData.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all duration-300">
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Content Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-modern font-black text-primary uppercase tracking-[0.2em] mb-8">Conteúdo</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-sm font-modern text-on-surface-variant hover:text-primary transition-all">Início</Link>
              </li>
              <li>
                <Link to="/library" className="text-sm font-modern text-on-surface-variant hover:text-primary transition-all">Biblioteca</Link>
              </li>
              <li>
                <Link to="/courses" className="text-sm font-modern text-on-surface-variant hover:text-primary transition-all">Cursos</Link>
              </li>
              <li>
                <Link to="/masterclass" className="text-sm font-modern text-on-surface-variant hover:text-primary transition-all">Masterclasses</Link>
              </li>
              <li>
                <Link to="/entertainment" className="text-sm font-modern text-on-surface-variant hover:text-primary transition-all">Entretenimento</Link>
              </li>
            </ul>
          </div>

          {/* Institutional Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-modern font-black text-primary uppercase tracking-[0.2em] mb-8">Institucional</h4>
            <ul className="space-y-4">
              <li>
                <Link to="#" className="text-sm font-modern text-on-surface-variant hover:text-primary transition-all">Sobre a AdorePlay</Link>
              </li>
              <li>
                <Link to="#" className="text-sm font-modern text-on-surface-variant hover:text-primary transition-all">Termos de Uso</Link>
              </li>
              <li>
                <Link to="#" className="text-sm font-modern text-on-surface-variant hover:text-primary transition-all">Privacidade</Link>
              </li>
              <li>
                <Link to="#" className="text-sm font-modern text-on-surface-variant hover:text-primary transition-all">Ajuda & Suporte</Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-modern font-black text-primary uppercase tracking-[0.2em] mb-8">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                  <Mail size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-modern font-bold text-white/30 uppercase tracking-[0.1em]">E-MAIL</span>
                  <a href={`mailto:${footerData.email}`} className="text-sm font-modern text-on-surface-variant hover:text-white transition-colors">{footerData.email}</a>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                  <Phone size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-modern font-bold text-white/30 uppercase tracking-[0.1em]">TELEFONE</span>
                  <a href={`tel:${footerData.phone.replace(/\D/g, '')}`} className="text-sm font-modern text-on-surface-variant hover:text-white transition-colors">{footerData.phone}</a>
                </div>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                  <MapPin size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-modern font-bold text-white/30 uppercase tracking-[0.1em]">LOCALIZAÇÃO</span>
                  <span className="text-sm font-modern text-on-surface-variant">{footerData.location}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-modern font-semibold text-on-surface-variant/40 tracking-[0.2em] uppercase">
            © {currentYear} ADOREPLAY. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-help" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-help" />
            <img src="https://logopng.com.br/logos/pix-106.png" alt="Pix" className="h-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-help" />
          </div>
        </div>
      </div>
    </footer>
  );
}
