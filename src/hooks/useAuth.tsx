'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onIdTokenChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt: unknown;
  updatedAt: unknown;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function syncUserProfile(firebaseUser: User, displayName?: string): Promise<UserProfile> {
  const token = await firebaseUser.getIdToken();
  const response = await fetch('/api/users/me', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ displayName }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'No se pudo sincronizar el perfil del usuario.');
  }

  const result = await response.json();
  return result.data as UserProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        if (firebaseUser) {
          setUser(firebaseUser);
          const userProfile = await syncUserProfile(firebaseUser);
          setProfile(userProfile);
          setIsAdmin(userProfile.role === 'admin');
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error al sincronizar el estado de autenticacion:', error);
        setUser(firebaseUser);
        setProfile(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error al iniciar sesion con Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error al iniciar sesion con Email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      const userProfile = await syncUserProfile(userCredential.user, displayName);
      setUser(userCredential.user);
      setProfile(userProfile);
      setIsAdmin(userProfile.role === 'admin');
    } catch (error) {
      console.error('Error al registrarse con Email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
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
