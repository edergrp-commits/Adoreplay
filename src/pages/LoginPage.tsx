import { motion } from 'motion/react';
import { Mail, Lock, Facebook, ArrowLeft, User, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithFacebook, signUpWithEmail, signInWithEmail, resetPassword } from '../lib/firebase';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      if (isResetting) {
        await resetPassword(email);
        setResetSent(true);
      } else if (isLogin) {
        await signInWithEmail(email, password);
        navigate('/dashboard');
      } else {
        if (!name) {
          setError('Por favor, informe seu nome.');
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, name);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = 'Ocorreu um erro ao processar sua solicitação.';
      
      if (err.code === 'auth/email-already-in-use') message = 'Este e-mail já está em uso.';
      else if (err.code === 'auth/invalid-email') message = 'E-mail inválido.';
      else if (err.code === 'auth/weak-password') message = 'A senha deve ter pelo menos 6 caracteres.';
      else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'E-mail ou senha incorretos. Verifique seus dados ou clique em "Cadastro" para criar uma nova conta.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'O login por e-mail/senha não está ativado no Firebase Console. Por favor, ative-o em Authentication > Sign-in method ou use o Login com Google.';
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar com Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithFacebook();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar com Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        <Link to="/" className="absolute -top-16 left-0 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest">
          <ArrowLeft size={16} />
          Voltar ao Início
        </Link>

        <div className="mb-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl mb-6">
            <img src="/favicon.svg" alt="AdorePlay" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-4xl font-headline font-extrabold tracking-tight text-primary mb-2 uppercase">AdorePlay</h1>
          <p className="text-on-surface-variant font-headline tracking-wide text-sm">
            {isResetting ? 'Recupere seu acesso' : (isLogin ? 'Entrar' : 'Crie sua conta e comece a adorar')}
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel w-full rounded-xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
        >
          {resetSent ? (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">E-mail Enviado!</h2>
                <p className="text-on-surface-variant text-sm font-medium">
                  Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
                </p>
              </div>
              <button 
                onClick={() => {
                  setResetSent(false);
                  setIsResetting(false);
                  setIsLogin(true);
                }}
                className="w-full py-4 bg-primary text-white font-headline font-bold rounded-lg hover:scale-[1.01] transition-all"
              >
                VOLTAR PARA O LOGIN
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-bold uppercase tracking-widest text-center">
                  {error}
                </div>
              )}

              {!isResetting && (
                <div className="flex bg-black/40 rounded-lg p-1 mb-8">
                  <button 
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${isLogin ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${!isLogin ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    Cadastro
                  </button>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                {!isLogin && !isResetting && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="block text-xs font-medium text-on-surface-variant ml-1" htmlFor="name">NOME COMPLETO</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={20} />
                      <input 
                        required={!isLogin && !isResetting}
                        disabled={isLoading}
                        className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface placeholder:text-on-surface-variant/30 transition-all outline-none disabled:opacity-50" 
                        id="name" 
                        placeholder="Seu nome" 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-on-surface-variant ml-1" htmlFor="email">E-MAIL</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      required
                      disabled={isLoading}
                      className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface placeholder:text-on-surface-variant/30 transition-all outline-none disabled:opacity-50" 
                      id="email" 
                      placeholder="exemplo@adoreplay.com" 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {!isResetting && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="block text-xs font-medium text-on-surface-variant" htmlFor="password">SENHA</label>
                      {isLogin && (
                        <button 
                          type="button" 
                          onClick={() => setIsResetting(true)}
                          className="text-[10px] font-bold text-primary hover:underline transition-all"
                        >
                          ESQUECEU A SENHA?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={20} />
                      <input 
                        required={!isResetting}
                        disabled={isLoading}
                        className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface placeholder:text-on-surface-variant/30 transition-all outline-none disabled:opacity-50" 
                        id="password" 
                        placeholder="••••••••" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <button 
                  disabled={isLoading}
                  className="w-full py-4 bg-primary hover:bg-primary-container text-white font-headline font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100" 
                  type="submit"
                >
                  {isLoading ? 'PROCESSANDO...' : (isResetting ? 'ENVIAR LINK DE RECUPERAÇÃO' : (isLogin ? 'ENTRAR' : 'CRIAR CONTA'))}
                </button>

                {isResetting && (
                  <button 
                    type="button"
                    onClick={() => setIsResetting(false)}
                    className="w-full text-xs font-bold text-on-surface-variant hover:text-white transition-colors"
                  >
                    VOLTAR PARA O LOGIN
                  </button>
                )}
              </form>

              {!isResetting && (
                <>
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-[#121212] px-4 text-on-surface-variant">Ou continue com</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M12 5.04c1.74 0 3.3.6 4.53 1.77l3.39-3.39C17.85 1.44 15.15.5 12 .5 7.38.5 3.41 3.17 1.51 7.08l3.94 3.05C6.35 7.49 8.98 5.04 12 5.04z" fill="#EA4335"></path>
                        <path d="M23.49 12.27c0-.83-.07-1.63-.2-2.39H12v4.51h6.44c-.28 1.48-1.11 2.73-2.37 3.58l3.7 2.87c2.16-1.99 3.42-4.93 3.42-8.57z" fill="#4285F4"></path>
                        <path d="M5.45 14.13c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.51 6.5C.55 8.46 0 10.66 0 13s.55 4.54 1.51 6.5l3.94-3.37z" fill="#FBBC05"></path>
                        <path d="M12 23.5c3.24 0 5.95-1.08 7.93-2.92l-3.7-2.87c-1.08.73-2.48 1.16-4.23 1.16-3.02 0-5.58-2.03-6.5-4.78l-3.94 3.05c1.9 3.91 5.87 6.36 10.44 6.36z" fill="#34A853"></path>
                      </svg>
                      <span className="text-sm font-semibold">Google</span>
                    </button>
                    <button 
                      onClick={handleFacebookLogin}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      <Facebook className="w-5 h-5 text-[#1877F2]" fill="currentColor" />
                      <span className="text-sm font-semibold">Facebook</span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>

        <p className="mt-8 text-xs text-on-surface-variant/50 font-body">
          Espalhando a mensagem através da AdorePlay.
        </p>
      </div>
    </main>
  );
}
