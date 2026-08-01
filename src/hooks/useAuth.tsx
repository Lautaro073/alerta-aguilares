'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase/client';
import { markPendingTermsAcceptance, takePendingTermsAcceptance } from '@/lib/legal';

interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'user' | 'admin' | 'operator' | 'official';
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: (acceptedTerms?: boolean) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
    acceptedTerms: boolean
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ADMIN_ROLES: UserProfile['role'][] = ['admin', 'operator', 'official'];

function hasAdminAccess(role: UserProfile['role']) {
  return ADMIN_ROLES.includes(role);
}

async function syncSupabaseProfile(
  session: Session,
  acceptedTermsVersion?: string | null
): Promise<{ user: AuthUser; profile: UserProfile }> {
  const response = await fetch('/api/users/me', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(
      acceptedTermsVersion
        ? { acceptedTerms: true, termsVersion: acceptedTermsVersion }
        : {}
    ),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'No se pudo sincronizar el perfil del usuario.');
  }

  const result = await response.json();
  const profile = result.data as UserProfile;

  return {
    profile,
    user: {
      uid: session.user.id,
      displayName: profile.displayName,
      email: profile.email || session.user.email || null,
      photoURL: profile.photoURL,
      getIdToken: async () => {
        const { data } = await supabaseBrowser.auth.getSession();
        return data.session?.access_token || session.access_token;
      },
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const applySupabaseSession = async (session: Session | null, finishLoading = true) => {
      try {
        if (finishLoading && !initializedRef.current) setLoading(true);
        if (!session) {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          return;
        }

        // El alta con Google vuelve por acá tras el redirect: si dejó marca de
        // consentimiento, este es el primer momento con sesión para registrarlo.
        const result = await syncSupabaseProfile(session, takePendingTermsAcceptance());
        if (cancelled) return;

        setUser(result.user);
        setProfile(result.profile);
        setIsAdmin(hasAdminAccess(result.profile.role));
      } catch (error) {
        console.error('Error al sincronizar el empleado de Supabase:', error);
        if (cancelled) return;
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      } finally {
        if (!cancelled && finishLoading) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    };

    void supabaseBrowser.auth.getSession().then(({ data }) => applySupabaseSession(data.session));

    const { data: authListener } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      void applySupabaseSession(session);
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.session) {
        const result = await syncSupabaseProfile(data.session);
        setUser(result.user);
        setProfile(result.profile);
        setIsAdmin(hasAdminAccess(result.profile.role));
      }
    } catch (error) {
      console.error('Error al iniciar sesion con Email:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (acceptedTerms = false) => {
    // Hay que dejar la marca ANTES del redirect: la pestaña se va al proveedor
    // de identidad y vuelve sin nada del estado de React.
    if (acceptedTerms) markPendingTermsAcceptance();

    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error) throw error;
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    acceptedTerms: boolean
  ) => {
    const { data, error } = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    // Cuando hace falta confirmar el correo no hay sesión todavía, así que no se
    // puede escribir en la tabla: queda la marca y se registra al primer ingreso.
    if (acceptedTerms) markPendingTermsAcceptance();
    if (!data.session) return false;

    const result = await syncSupabaseProfile(data.session, takePendingTermsAcceptance());
    setUser(result.user);
    setProfile(result.profile);
    setIsAdmin(hasAdminAccess(result.profile.role));
    return true;
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabaseBrowser.auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
