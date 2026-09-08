'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { DeveloperSidebar } from './components/DeveloperSidebar';
import { ShieldAlert } from 'lucide-react';

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'developer')) {
      // Redirect unauthorised users to their respective home pages
      if (profile?.role === 'kasir') {
        router.replace('/pos');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [profile, loading, router]);

  if (loading || !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <span className="text-sm font-bold text-slate-500">Checking credentials...</span>
        </div>
      </div>
    );
  }

  if (profile.role !== 'developer') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-5 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[15px] text-slate-900 uppercase">Access Denied</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-normal">
              Halaman ini dilindungi sistem keamanan khusus Developer. Sesi Anda ditolak.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 relative font-sans antialiased text-slate-900">
      {/* Dev Sidebar */}
      <DeveloperSidebar />

      {/* Main Dev Console Content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  );
}
