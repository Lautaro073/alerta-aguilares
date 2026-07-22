'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, Shield, User } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';

type SetupState = 'checking' | 'ready' | 'submitting' | 'done' | 'error';

function readInviteSessionFromHash() {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) return null;
  return { access_token: accessToken, refresh_token: refreshToken };
}

export default function CreatePasswordPage() {
  const [state, setState] = useState<SetupState>('checking');
  const [message, setMessage] = useState('Validando invitacion...');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const hashSession = readInviteSessionFromHash();
      if (hashSession) {
        const { error } = await supabaseBrowser.auth.setSession(hashSession);
        if (error) {
          setState('error');
          setMessage('La invitacion expiro o ya fue usada.');
          return;
        }

        window.history.replaceState(null, '', window.location.pathname);
      }

      const { data } = await supabaseBrowser.auth.getSession();
      if (cancelled) return;

      if (!data.session) {
        setState('error');
        setMessage('No hay una invitacion activa. Pedi un nuevo enlace al administrador.');
        return;
      }

      const user = data.session.user;
      setDisplayName(String(user.user_metadata?.display_name || user.email || 'Empleado'));
      setEmail(user.email || '');
      setState('ready');
      setMessage('Completa tu contraseña para activar el acceso interno.');
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setState('error');
      setMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setState('error');
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    setState('submitting');
    setMessage('Activando acceso...');

    const { error: passwordError } = await supabaseBrowser.auth.updateUser({ password });
    if (passwordError) {
      setState('error');
      setMessage(passwordError.message || 'No se pudo guardar la contraseña.');
      return;
    }

    const { data } = await supabaseBrowser.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      await fetch('/api/auth/complete-invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      });
    }

    setState('done');
    setMessage('Acceso activado. Redirigiendo...');
    window.setTimeout(() => {
      window.location.href = '/admin';
    }, 900);
  }, [confirmPassword, password]);

  const isLoading = state === 'checking' || state === 'submitting' || state === 'done';
  const isError = state === 'error';

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <section className="w-full max-w-md glass-strong border border-white/10 p-6 md:p-8 rounded-xl shadow-glow animate-scale-in relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-6 mt-2 select-none">
          <div className="w-11 h-11 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shadow shadow-accent/10 mb-3">
            {state === 'done' ? <CheckCircle2 size={22} /> : <Shield size={22} className="animate-pulse-slow" />}
          </div>
          <h1 className="font-outfit font-extrabold text-xl md:text-2xl tracking-tight text-foreground">
            Alertas<span className="gradient-text">Aguilares</span>
          </h1>
          <p className="font-jakarta text-xs text-muted mt-1 max-w-[280px]">
            Crear contraseña para el panel interno.
          </p>
        </div>

        {(message || isError) && (
          <div className={`flex items-start gap-2.5 border p-3 rounded-lg text-xs font-jakarta mb-4 animate-fade-in ${isError ? 'bg-red-500/10 border-red-500/25 text-red-200' : 'bg-accent/10 border-accent/20 text-foreground'}`}>
            {isError ? (
              <AlertCircle size={15} className="shrink-0 text-red-400 mt-0.5" />
            ) : (
              <Shield size={15} className="shrink-0 text-accent mt-0.5" />
            )}
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-jakarta">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Nombre completo</label>
            <div className="relative flex items-center">
              <User size={15} className="absolute left-3 text-muted" />
              <input
                type="text"
                value={displayName}
                disabled
                className="w-full bg-surface-1/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-muted outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Email</label>
            <div className="relative flex items-center">
              <Mail size={15} className="absolute left-3 text-muted" />
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-surface-1/50 border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm text-muted outline-none transition-all"
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
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                minLength={8}
                autoComplete="new-password"
                placeholder="********"
                className="w-full bg-surface-1/50 border border-border focus:border-accent focus:bg-surface-1 focus:ring-1 focus:ring-accent rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted/40"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Confirmar contraseña</label>
            <div className="relative flex items-center">
              <Lock size={15} className="absolute left-3 text-muted" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isLoading}
                minLength={8}
                autoComplete="new-password"
                placeholder="********"
                className="w-full bg-surface-1/50 border border-border focus:border-accent focus:bg-surface-1 focus:ring-1 focus:ring-accent rounded-lg py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted/40"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 mt-2 h-10 select-none cursor-pointer"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Activar cuenta'}
          </button>
        </form>
      </section>
    </main>
  );
}
