'use client';

import React, { useState } from 'react';
import { changePasswordAction } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { getDashboardPathForRole, resolveUserRole } from '@/lib/utils/auth-routing';

export default function ForceChangePassScreen() {
  const supabase = createClient();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Kosong', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Lemah', color: 'bg-red-500' };
    if (score === 2 || score === 3) return { score: 2, label: 'Sedang', color: 'bg-amber-500' };
    return { score: 4, label: 'Sangat Kuat', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    setError('');

    const res = await changePasswordAction(newPassword);
    setLoading(false);

    if (res.success) {
      const { data: { user } } = await supabase.auth.getUser();
      const role = user ? await resolveUserRole(supabase, user.id) : null;
      const destination = getDashboardPathForRole(role);

      setSuccessMsg('Password berhasil diperbarui! Mengalihkan ke dashboard...');
      window.location.href = destination;
    } else {
      setError(res.error || 'Gagal memperbarui password');
    }
  };

  return (
    <div className="min-h-screen bg-[#00529C] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6 border border-white/20 animate-in fade-in duration-300">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#FF6600] rounded-2xl flex items-center justify-center font-extrabold text-white text-2xl mx-auto shadow-lg">
            BR
          </div>
          <h1 className="text-xl font-extrabold text-[#001E36]">Wajib Ganti Password Perdana</h1>
          <p className="text-xs text-gray-500">
            Demi keamanan akun kasir Agen BRILink Anda, harap ganti password default perbankan sebelum melanjutkan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-200 text-xs font-medium">
              {successMsg}
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password Baru *</label>
            <input
              type="password"
              required
              placeholder="Minimal 8 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00529C] focus:outline-none"
            />

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">Kekuatan Password:</span>
                  <span className="font-bold text-gray-800">{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} transition-all duration-300 w-full`}></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Konfirmasi Password Baru *</label>
            <input
              type="password"
              required
              placeholder="Ketik ulang password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#00529C] focus:outline-none"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading || !newPassword || newPassword !== confirmPassword}
            className="w-full py-3 bg-[#FF6600] hover:bg-[#E55C00] text-white font-extrabold text-sm rounded-xl shadow-lg transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Menyimpan Password...</span>
              </>
            ) : (
              <span>Simpan & Lanjutkan ke POS Utama ➔</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
