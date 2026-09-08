'use client';

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, X, Loader2, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getRoleFromUserMetadata } from '@/lib/utils/auth-routing';
import { toast } from 'sonner';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Local mock bypass for owner
    if (email === 'owner@brilink.com' && password === 'owner123') {
      toast.success('Login berhasil (Mock Owner)!');
      localStorage.setItem('owner-mock-session', 'true');
      document.cookie = "owner-mock-session=true; path=/; max-age=86400; SameSite=Lax";
      window.location.href = '/dashboard';
      return;
    }

    // Local mock bypass for cashier
    if (email.endsWith('@brilink.com')) {
      const username = email.split('@')[0];
      const storedStaff = localStorage.getItem('pos-staff-users');
      if (storedStaff) {
        try {
          const staffList = JSON.parse(storedStaff) as any[];
          const found = staffList.find(s => s.username.toLowerCase() === username.toLowerCase());
          if (found) {
            const storedPin = localStorage.getItem(`pos-pin-${found.id}`);
            if (storedPin === password || password === '123456') {
              toast.success(`Login berhasil (Mock Kasir: ${found.fullName})!`);
              localStorage.setItem('cashier-mock-session', 'true');
              localStorage.setItem('active-cashier-id', found.id);
              document.cookie = "cashier-mock-session=true; path=/; max-age=86400; SameSite=Lax";
              window.location.href = '/pos';
              return;
            }
          }
        } catch (e) {}
      }
      
      // Fallback for naufal@brilink.com specifically if not registered yet, just for ease of testing
      if (username === 'naufal') {
        toast.success('Login berhasil (Mock Kasir: Naufal)!');
        localStorage.setItem('cashier-mock-session', 'true');
        localStorage.setItem('active-cashier-id', 'mock-naufal-id');
        document.cookie = "cashier-mock-session=true; path=/; max-age=86400; SameSite=Lax";
        window.location.href = '/pos';
        return;
      }
    }


    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Email atau password salah. Silakan periksa kembali kredensial Anda.');
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    if (authData?.session) {
      toast.success('Login berhasil!');

      let role = getRoleFromUserMetadata(authData.session.user);

      if (!role) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.session.user.id)
          .maybeSingle();
        role = profile?.role ?? null;
      }

      const upperRole = role?.toUpperCase();

      // Hard redirect agar cookie autentikasi tersimpan bersih ke server Next.js
      if (upperRole === 'DEVELOPER') {
        window.location.href = '/developer';
      } else if (upperRole === 'OWNER') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/pos';
      }
      return;
    }

    setError('Email atau password salah. Silakan periksa kembali kredensial Anda.');
    toast.error('Gagal masuk ke sistem');
    setLoading(false);
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (error) setError(null);
  };

  return (
    <>
      <div className="w-full bg-white rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-200 p-8 sm:p-10 relative">
        <div className="mb-8">
          <h2 className="text-[28px] font-extrabold text-[#001E36] tracking-tight mb-2 leading-tight">
            Masuk ke Sistem
          </h2>
          <p className="text-[14px] text-slate-500 leading-relaxed">
            Masukkan email dan password yang telah diberikan.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 border border-red-100">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[13px] text-red-700 font-medium leading-relaxed flex-1">
              {error}
            </p>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-2">
              Email atau Username <span className="text-[#FF6600]">*</span>
            </label>
            <div className="relative flex items-center">
              <Mail className="w-[18px] h-[18px] text-slate-400 absolute left-[14px] pointer-events-none z-10" />
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={handleInputChange(setEmail)}
                placeholder="nama.kasir@brilink.com"
                className="w-full pl-[44px] pr-4 py-3.5 bg-white border-[1.5px] border-slate-300 rounded-xl text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00529C] focus:shadow-[0_0_0_3px_rgba(0,82,156,0.12)] transition-all disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[12px] font-bold text-slate-700 mb-2">
              Password <span className="text-[#FF6600]">*</span>
            </label>
            <div className="relative flex items-center">
              <Lock className="w-[18px] h-[18px] text-slate-400 absolute left-[14px] pointer-events-none z-10" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                value={password}
                onChange={handleInputChange(setPassword)}
                placeholder="••••••••"
                className="w-full pl-[44px] pr-[44px] py-3.5 bg-white border-[1.5px] border-slate-300 rounded-xl text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00529C] focus:shadow-[0_0_0_3px_rgba(0,82,156,0.12)] transition-all disabled:bg-slate-50 disabled:text-slate-500"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-[14px] text-slate-400 hover:text-slate-600 transition-colors z-10 cursor-pointer disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          {/* Checkbox & Help */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-slate-500 select-none">
              <input
                type="checkbox"
                disabled={loading}
                className="w-4 h-4 text-[#00529C] rounded border-slate-300 focus:ring-[#00529C] accent-[#00529C] cursor-pointer disabled:opacity-50"
              />
              <span>Ingat Saya</span>
            </label>
            <button 
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="font-bold text-[13px] text-[#00529C] hover:underline cursor-pointer"
            >
              Bantuan Login / Lupa Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#FF6600] hover:bg-[#E55C00] active:scale-[0.98] text-white font-bold text-[12px] tracking-[0.08em] rounded-xl shadow-[0_4px_16px_rgba(255,102,0,0.3)] transition-all uppercase mt-1 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-[18px] h-[18px] animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              'Masuk ke Sistem'
            )}
          </button>
        </form>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-[400px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-[18px] text-[#001E36]">Bantuan Login</h3>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 mb-2">Untuk Kasir:</h4>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Jika Anda lupa password, silakan hubungi Pemilik Outlet (Owner) untuk melakukan reset password melalui menu Kelola Kasir di dashboard mereka.
                </p>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-[13px] font-bold text-slate-900 mb-2">Technical Support:</h4>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                  Mengalami kendala sistem atau butuh bantuan lebih lanjut?
                </p>
                <a 
                  href="https://wa.me/6281234567890" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-[13px] rounded-xl transition-colors"
                >
                  <MessageCircle className="w-[18px] h-[18px]" />
                  Hubungi WhatsApp Support
                </a>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[13px] rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
