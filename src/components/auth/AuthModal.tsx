'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createRecoveryClient, supabaseBrowser } from '@/lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register' | 'recover' | 'verify' | 'reset';

const subscribeToClientSnapshot = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.64.39 3.19 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const recoveryClientRef = useRef<ReturnType<typeof createRecoveryClient> | null>(null);
  const mounted = useSyncExternalStore(
    subscribeToClientSnapshot,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!isOpen || !mounted) return null;

  const resetForm = () => {
    setMode('login');
    setError(null);
    setMessage(null);
    setDisplayName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
  };

  const clearRecoverySession = () => {
    if (!recoveryClientRef.current) return;
    void recoveryClientRef.current.auth.signOut();
    recoveryClientRef.current = null;
  };

  const handleClose = () => {
    if (isLoading) return;
    clearRecoverySession();
    resetForm();
    onClose();
  };

  const changeMode = (nextMode: AuthMode) => {
    clearRecoverySession();
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setPassword('');
    setConfirmPassword('');
    setOtp('');
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (caughtError) {
      const rawMessage = caughtError instanceof Error ? caughtError.message : '';
      setError(rawMessage || 'No se pudo iniciar sesión con Google.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Ingresa tu correo electrónico.');
      return;
    }
    if (mode === 'register' && displayName.trim().length < 2) {
      setError('Ingresa tu nombre completo.');
      return;
    }
    if ((mode === 'login' || mode === 'register') && !password) {
      setError('Ingresa tu contraseña.');
      return;
    }
    if ((mode === 'login' || mode === 'register' || mode === 'reset') && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (mode === 'verify' && !otp.trim()) {
      setError('Ingresa el código recibido por correo.');
      return;
    }
    if ((mode === 'register' || mode === 'reset') && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setMessage(null);

      if (mode === 'recover') {
        const { error: recoveryError } = await supabaseBrowser.auth.resetPasswordForEmail(normalizedEmail);
        if (recoveryError) throw recoveryError;
        setMode('verify');
        setMessage('Te enviamos un código de recuperación por correo.');
        return;
      }

      if (mode === 'verify') {
        const recoveryClient = createRecoveryClient();
        const { error: verificationError } = await recoveryClient.auth.verifyOtp({
          email: normalizedEmail,
          token: otp.trim(),
          type: 'recovery',
        });
        if (verificationError) throw verificationError;

        recoveryClientRef.current = recoveryClient;
        setMode('reset');
        setMessage('Código verificado. Ahora definí tu nueva contraseña.');
        return;
      }

      if (mode === 'reset') {
        const recoveryClient = recoveryClientRef.current;
        if (!recoveryClient) throw new Error('La verificación venció. Solicita un código nuevo.');

        const { error: passwordError } = await recoveryClient.auth.updateUser({ password });
        if (passwordError) throw passwordError;

        await recoveryClient.auth.signOut();
        recoveryClientRef.current = null;
        await signInWithEmail(normalizedEmail, password);
        toast.success('Contraseña actualizada. Sesión iniciada.');
        resetForm();
        onClose();
        return;
      }

      if (mode === 'register') {
        const hasSession = await signUpWithEmail(normalizedEmail, password, displayName);
        if (hasSession) {
          toast.success('Cuenta creada. Ya puedes publicar alertas.');
          resetForm();
          onClose();
        } else {
          toast.success('Cuenta creada. Revisa tu correo para confirmarla.');
          changeMode('login');
          setEmail(normalizedEmail);
        }
        return;
      }

      await signInWithEmail(normalizedEmail, password);
      toast.success('Sesión iniciada.');
      resetForm();
      onClose();
    } catch (caughtError: unknown) {
      console.error(caughtError);
      const rawMessage = caughtError instanceof Error ? caughtError.message : '';
      const lowerMessage = rawMessage.toLowerCase();
      const cooldownSeconds = rawMessage.match(/after (\d+) seconds?/i)?.[1];

      if (cooldownSeconds) {
        setError(`Por seguridad, podrás solicitar otro código dentro de ${cooldownSeconds} segundos.`);
      } else if (mode === 'verify' && (lowerMessage.includes('expired') || lowerMessage.includes('invalid'))) {
        setError('El código es incorrecto o venció. Solicita uno nuevo.');
      } else if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid credentials')) {
        setError('Email o contraseña incorrectos.');
      } else if (lowerMessage.includes('email not confirmed')) {
        setError('Debes confirmar tu email antes de iniciar sesión.');
      } else if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
        setError('Ya existe una cuenta con ese correo.');
      } else if (lowerMessage.includes('too many requests') || lowerMessage.includes('rate limit')) {
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.');
      } else {
        setError(rawMessage || 'Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isPrimaryMode = mode === 'login' || mode === 'register';

  return createPortal(
    <>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[2000] bg-background/60 backdrop-blur-[6px] transition-opacity duration-300 pointer-events-auto"
      />

      <div className="fixed inset-0 z-[2010] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md glass-strong border border-white/10 p-6 md:p-8 rounded-xl shadow-glow animate-scale-in relative overflow-hidden pointer-events-auto">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full bg-surface-1 border border-border text-muted hover:text-foreground hover:bg-surface-3 transition-colors cursor-pointer"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col items-center text-center mb-6 mt-2 select-none">
            <div className="w-11 h-11 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shadow shadow-accent/10 mb-3">
              <Shield size={22} />
            </div>
            <h2 className="font-outfit font-extrabold text-xl md:text-2xl tracking-tight text-foreground">
              Alertas<span className="gradient-text">Aguilares</span>
            </h2>
            <p className="font-jakarta text-xs text-muted mt-1.5 max-w-[300px]">
              {mode === 'login' && 'Inicia sesión para crear y seguir tus alertas.'}
              {mode === 'register' && 'Crea tu cuenta ciudadana para publicar alertas.'}
              {mode === 'recover' && 'Te enviaremos un código para validar tu correo.'}
              {mode === 'verify' && 'Ingresa el código recibido para comprobar tu identidad.'}
              {mode === 'reset' && 'Código verificado. Definí una nueva contraseña.'}
            </p>
            {!isPrimaryMode && (
              <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-accent">
                Paso {mode === 'recover' ? 1 : mode === 'verify' ? 2 : 3} de 3
              </span>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 p-3 rounded-lg text-red-200 text-xs font-jakarta mb-4 animate-fade-in">
              <AlertCircle size={15} className="shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-lg text-emerald-100 text-xs font-jakarta mb-4 animate-fade-in">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-jakarta">
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-name" className="text-[11px] font-bold text-muted uppercase tracking-wider">Nombre completo</label>
                <div className="relative flex items-center">
                  <User size={15} className="absolute left-3 text-muted" />
                  <input
                    id="auth-name"
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    disabled={isLoading}
                    autoComplete="name"
                    placeholder="Nombre y apellido"
                    className="w-full bg-surface-1/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted/40"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-[11px] font-bold text-muted uppercase tracking-wider">Email</label>
              <div className="relative flex items-center">
                <Mail size={15} className="absolute left-3 text-muted" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading || mode === 'verify' || mode === 'reset'}
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="w-full bg-surface-1/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted/40 disabled:opacity-70"
                  required
                />
              </div>
            </div>

            {mode === 'verify' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-otp" className="text-[11px] font-bold text-muted uppercase tracking-wider">Código</label>
                <div className="relative flex items-center">
                  <KeyRound size={15} className="absolute left-3 text-muted" />
                  <input
                    id="auth-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                    disabled={isLoading}
                    placeholder="000000"
                    className="w-full bg-surface-1/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted/40"
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-password" className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  {mode === 'reset' ? 'Nueva contraseña' : 'Contraseña'}
                </label>
                <div className="relative flex items-center">
                  <Lock size={15} className="absolute left-3 text-muted" />
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoading}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="********"
                    className="w-full bg-surface-1/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted/40"
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'register' || mode === 'reset') && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-password-confirm" className="text-[11px] font-bold text-muted uppercase tracking-wider">Confirmar contraseña</label>
                <div className="relative flex items-center">
                  <Lock size={15} className="absolute left-3 text-muted" />
                  <input
                    id="auth-password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                    placeholder="********"
                    className="w-full bg-surface-1/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted/40"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <button type="button" onClick={() => changeMode('recover')} className="self-end text-xs font-semibold text-accent hover:text-accent/80 transition-colors cursor-pointer">
                Olvidé mi contraseña
              </button>
            )}

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 mt-1 h-10 select-none cursor-pointer">
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : mode === 'recover' ? 'Enviar código' : mode === 'verify' ? 'Comprobar código' : 'Cambiar contraseña'}
            </button>

            {isPrimaryMode && (
              <>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted">
                  <span className="h-px flex-1 bg-border" />
                  <span>o continúa con</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full h-10 rounded-lg border border-border bg-surface-1 text-foreground hover:bg-surface-3 transition-colors text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <GoogleIcon />
                  Google
                </button>
              </>
            )}

            {!isPrimaryMode && (
              <button
                type="button"
                disabled={isLoading}
                onClick={() => changeMode(mode === 'verify' ? 'recover' : 'login')}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                {mode === 'verify' ? 'Solicitar otro código' : 'Volver al inicio de sesión'}
              </button>
            )}
          </form>

          {isPrimaryMode && (
            <p className="text-center mt-5 text-xs text-muted font-jakarta select-none">
              {mode === 'login' ? '¿Todavía no tienes cuenta?' : '¿Ya tienes una cuenta?'}{' '}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}
                className="font-bold text-accent hover:text-accent/80 cursor-pointer"
              >
                {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </p>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
