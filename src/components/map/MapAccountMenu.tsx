'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Shield, User, Zap } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';

export default function MapAccountMenu() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isElevating, setIsElevating] = useState(false);

  const handleElevate = async () => {
    if (!user || isElevating) return;
    setIsElevating(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/auth/elevate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await user.getIdToken(true);
        setShowUserMenu(false);
      } else {
        const result = await response.json().catch(() => ({})) as { error?: string };
        alert(result.error || 'Error al elevar permisos.');
      }
    } catch (err) {
      console.error('[DEV] Error al elevar a admin:', err);
      alert('Error inesperado al elevar permisos.');
    } finally {
      setIsElevating(false);
    }
  };

  return (
    <>
      {!user ? (
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center justify-center gap-1.5 h-10 px-3 md:px-4 rounded-pill font-outfit text-xs font-bold bg-accent border border-accent hover:bg-accent/95 hover:shadow-glow hover:shadow-accent/30 text-white transition-all duration-300 cursor-pointer shadow shadow-accent/20 active:scale-95 shrink-0"
        >
          <User size={13} className="shrink-0" />
          <span>Ingresar</span>
        </button>
      ) : (
        <div className="relative shrink-0">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-border hover:border-border-strong bg-surface-2 hover:bg-surface-3 transition-all duration-200 cursor-pointer overflow-hidden relative active:scale-95"
            title={profile?.displayName || user.displayName || 'Vecino'}
          >
            {profile?.photoURL || user.photoURL ? (
              <Image
                src={profile?.photoURL || user.photoURL || ''}
                alt="Avatar"
                fill
                sizes="40px"
                unoptimized
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-accent/15 text-accent font-outfit font-extrabold text-sm">
                {(profile?.displayName || user.displayName || 'V').charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {showUserMenu && (
            <>
              <div
                onClick={() => setShowUserMenu(false)}
                className="fixed inset-0 z-[1000] cursor-default"
              />
              <div className="absolute right-0 mt-2 w-48 glass-strong border border-white/10 rounded-xl shadow-glow py-1.5 z-[1010] animate-scale-in text-left pointer-events-auto font-jakarta">
                <div className="px-3 py-2 border-b border-border select-none">
                  <p className="font-outfit font-bold text-xs text-foreground truncate">
                    {profile?.displayName || user.displayName || 'Vecino'}
                  </p>
                  <p className="font-jakarta text-[10px] text-muted truncate mt-0.5">
                    {profile?.email || user.email}
                  </p>
                </div>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-yellow-400 hover:bg-surface-3 transition-colors select-none"
                  >
                    <Shield size={13} className="shrink-0 text-yellow-400" />
                    <span>Panel de Moderacion</span>
                  </Link>
                )}

                {process.env.NODE_ENV !== 'production' && !isAdmin && (
                  <button
                    onClick={handleElevate}
                    disabled={isElevating}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-colors select-none cursor-pointer border-none bg-transparent border-t border-border/40"
                    title="[Solo Desarrollo] Promover esta cuenta a Administrador"
                  >
                    {isElevating ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                    ) : (
                      <Zap size={13} className="shrink-0" />
                    )}
                    <span>{isElevating ? 'Elevando...' : '[Dev] Hacerme Admin'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    void signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-surface-3 transition-colors select-none cursor-pointer border-none bg-transparent"
                >
                  <LogOut size={13} className="shrink-0 text-red-400" />
                  <span>Cerrar Sesion</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
