'use client';

import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/hooks/useAuth';
import { X, Mail, Lock, User, AlertCircle, Loader2, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const subscribeToClientSnapshot = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeToClientSnapshot,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!isOpen || !mounted) return null;

  const handleClose = () => {
    if (isLoading) return;
    setError(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
    onClose();
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
      handleClose();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user') {
        setError('Inicio de sesión cancelado por el usuario.');
      } else {
        setError('Error al iniciar sesión con Google. Intentá de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'register' && !displayName)) {
      setError('Por favor, completá todos los campos.');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
      handleClose();
    } catch (err: unknown) {
      console.error(err);
      const code = err instanceof FirebaseError ? err.code : undefined;
      switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Email o contraseña incorrectos.');
          break;
        case 'auth/email-already-in-use':
          setError('El email ingresado ya está registrado.');
          break;
        case 'auth/invalid-email':
          setError('El formato del email no es válido.');
          break;
        case 'auth/weak-password':
          setError('La contraseña es demasiado débil.');
          break;
        default:
          setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado. Intentá de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <>
      {/* Fondo de pantalla desenfocado (Backdrop) */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[2000] bg-background/60 backdrop-blur-[6px] transition-opacity duration-300 pointer-events-auto"
      />

      {/* Contenedor principal del modal */}
      <div className="fixed inset-0 z-[2010] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md glass-strong border border-white/10 p-6 md:p-8 rounded-xl shadow-glow animate-scale-in relative overflow-hidden pointer-events-auto"
        >
          {/* Auras de neón decorativas en background */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Botón de cierre */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full bg-surface-1 border border-border text-muted hover:text-foreground hover:bg-surface-3 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X size={16} />
          </button>

          {/* Encabezado */}
          <div className="flex flex-col items-center text-center mb-6 mt-2 select-none">
            <div className="w-11 h-11 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shadow shadow-accent/10 mb-3">
              <Shield size={22} className="animate-pulse-slow" />
            </div>
            <h2 className="font-outfit font-extrabold text-xl md:text-2xl tracking-tight text-foreground">
              Alertas<span className="gradient-text">Aguilares</span>
            </h2>
            <p className="font-jakarta text-xs text-muted mt-1 max-w-[260px]">
              {mode === 'login'
                ? 'Ingresá para reportar y apoyar soluciones en tu barrio.'
                : 'Registrate para participar activamente en la comunidad.'}
            </p>
          </div>

          {/* Errores */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 p-3 rounded-lg text-red-200 text-xs font-jakarta mb-4 animate-fade-in">
              <AlertCircle size={15} className="shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-jakarta">
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Nombre Completo</label>
                <div className="relative flex items-center">
                  <User size={15} className="absolute left-3 text-muted" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoading}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-surface-1/50 border border-border focus:border-accent focus:bg-surface-1 focus:ring-1 focus:ring-accent rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted/40"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Email</label>
              <div className="relative flex items-center">
                <Mail size={15} className="absolute left-3 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  placeholder="vecino@correo.com"
                  className="w-full bg-surface-1/50 border border-border focus:border-accent focus:bg-surface-1 focus:ring-1 focus:ring-accent rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted/40"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Contraseña</label>
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full bg-surface-1/50 border border-border focus:border-accent focus:bg-surface-1 focus:ring-1 focus:ring-accent rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted/40"
                  required
                />
              </div>
            </div>

            {/* Botón de Enviar */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 mt-2 h-10 select-none cursor-pointer"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === 'login' ? (
                'Iniciar Sesión'
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="flex items-center my-5 select-none">
            <div className="flex-1 h-[1px] bg-border" />
            <span className="text-[10px] uppercase font-bold text-muted/40 px-3 tracking-widest">o continuar con</span>
            <div className="flex-1 h-[1px] bg-border" />
          </div>

          {/* Botón de Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-10 rounded-lg border border-border hover:border-border-strong bg-surface-1 hover:bg-surface-2 text-foreground font-semibold text-xs flex items-center justify-center gap-2.5 transition-all select-none cursor-pointer"
          >
            {/* SVG del Logo Oficial de Google */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>

          {/* Alternar Modo */}
          <div className="text-center mt-6 text-xs text-muted font-jakarta select-none">
            {mode === 'login' ? (
              <>
                ¿No tenés una cuenta?{' '}
                <button
                  onClick={() => {
                    setError(null);
                    setMode('register');
                  }}
                  disabled={isLoading}
                  className="text-accent hover:underline font-bold bg-transparent border-none outline-none cursor-pointer"
                >
                  Registrate gratis
                </button>
              </>
            ) : (
              <>
                ¿Ya tenés una cuenta?{' '}
                <button
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  disabled={isLoading}
                  className="text-accent hover:underline font-bold bg-transparent border-none outline-none cursor-pointer"
                >
                  Ingresá acá
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
