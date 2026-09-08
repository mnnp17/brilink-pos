'use client';

import React, { useEffect, useState } from 'react';

interface ImpersonationBannerProps {
  ownerName?: string;
  onExit?: () => void;
}

export function ImpersonationBanner({ ownerName, onExit }: ImpersonationBannerProps = {}) {
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);

  useEffect(() => {
    const checkSession = () => {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('impersonated_user');
        if (stored) {
          try {
            setProfileData(JSON.parse(stored));
          } catch (e) {
            setProfileData(null);
          }
        } else {
          setProfileData(null);
        }
      }
    };

    const setProfileData = (val: any) => {
      setImpersonatedUser(val);
    };

    checkSession();

    if (typeof window !== 'undefined') {
      window.addEventListener('impersonation-changed', checkSession);
      window.addEventListener('storage', checkSession);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('impersonation-changed', checkSession);
        window.removeEventListener('storage', checkSession);
      }
    };
  }, []);

  const handleExit = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('impersonated_user');
      window.dispatchEvent(new Event('impersonation-changed'));
      window.location.href = '/developer/users';
    }
  };

  if (!ownerName && !impersonatedUser) return null;

  const displayName = ownerName || impersonatedUser?.full_name || 'User';
  const displayRole = impersonatedUser?.role?.toUpperCase() || 'OWNER';
  const triggerExit = onExit || handleExit;

  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 shadow-md flex items-center justify-between z-[9999] text-xs sm:text-sm font-semibold sticky top-0 w-full shrink-0">
      <div className="flex items-center gap-2 mx-auto">
        <span className="text-base animate-pulse">⚠️</span>
        <span>
          Mode Penyamaran Developer — Terhubung sebagai [<strong className="underline">{displayName}</strong> ({displayRole})]. Seluruh tindakan dicatat di Audit Log.
        </span>
      </div>
      <button
        onClick={triggerExit}
        className="bg-amber-700 hover:bg-amber-800 text-white text-[11px] px-3 py-1 rounded-md font-medium transition-colors shrink-0"
      >
        Kembalikan Sesi
      </button>
    </div>
  );
}
