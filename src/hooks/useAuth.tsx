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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt: any;
  updatedAt: any;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Escuchar cambios de estado de sesión
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // Buscar/Crear perfil en Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let userProfile: UserProfile;

          if (!userDocSnap.exists()) {
            // Si el perfil no existe, crearlo
            userProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Vecino Anónimo',
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL || null,
              role: 'user', // Default role
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            await setDoc(userDocRef, userProfile);
          } else {
            // Si ya existe, usar los datos existentes y verificar si necesita actualización
            const existingData = userDocSnap.data() as UserProfile;
            userProfile = {
              ...existingData,
              // Mantener actualizados campos que cambian (foto o nombre si vienen de Google)
              displayName: existingData.displayName || firebaseUser.displayName || 'Vecino Anónimo',
              photoURL: existingData.photoURL || firebaseUser.photoURL || null,
              email: existingData.email || firebaseUser.email,
            };

            // Guardar actualizaciones silenciosas si cambiaron los datos de perfil
            if (
              existingData.displayName !== userProfile.displayName ||
              existingData.photoURL !== userProfile.photoURL
            ) {
              await setDoc(userDocRef, {
                ...userProfile,
                updatedAt: serverTimestamp(),
              }, { merge: true });
            }
          }

          setProfile(userProfile);
          setIsAdmin(userProfile.role === 'admin');
        } else {
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error al sincronizar el estado de autenticación:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Iniciar Sesión con Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Iniciar Sesión con Email
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error al iniciar sesión con Email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Registrarse con Email
  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualizar el perfil en Firebase Auth para que tenga el displayName al crearse
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });

      // Crear el perfil correspondiente en Firestore inmediatamente
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        displayName: displayName,
        email: email,
        photoURL: null,
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, userProfile);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error al registrarse con Email:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar Sesión
  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
