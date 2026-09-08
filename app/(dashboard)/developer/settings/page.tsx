'use client';

import React, { useState, useEffect } from 'react';
import { FeatureFlagToggle } from '../components/FeatureFlagToggle';
import { Sliders, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { FeatureFlag } from '../types/developer';

const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    id: 'flag-1',
    key: 'ai_liquidity_advisor',
    name: 'AI Business Liquidity Advisor',
    description: 'Menampilkan widget analisa likuiditas otomatis berbasis AI pada dashboard utama Owner.',
    isEnabled: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'flag-2',
    key: 'fast_rebalance_pos',
    name: 'Fast Rebalance POS Flow',
    description: 'Mengaktifkan pintasan satu-klik untuk penyeimbangan saldo digital di halaman kasir.',
    isEnabled: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'flag-3',
    key: 'strict_shift_lock',
    name: 'Strict Cashier Shift Enforcement',
    description: 'Memblokir secara keras kasir yang mencoba bertransaksi tanpa membuka shift kerja terlebih dahulu.',
    isEnabled: true,
    updatedAt: new Date().toISOString(),
  },
];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('pos-feature-flags');
    if (stored) {
      try {
        setFlags(JSON.parse(stored));
      } catch (e) {
        setFlags(DEFAULT_FLAGS);
      }
    } else {
      setFlags(DEFAULT_FLAGS);
      localStorage.setItem('pos-feature-flags', JSON.stringify(DEFAULT_FLAGS));
    }
  }, []);

  const handleToggleFlag = async (toggled: FeatureFlag) => {
    // Simulate minor network sync delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const updated = flags.map((f) => {
      if (f.key === toggled.key) {
        return { ...f, isEnabled: !f.isEnabled, updatedAt: new Date().toISOString() };
      }
      return f;
    });

    setFlags(updated);
    localStorage.setItem('pos-feature-flags', JSON.stringify(updated));
    // Dispatch custom event for real-time listener updates
    window.dispatchEvent(new Event('feature-flags-updated'));
    toast.success(`Feature Flag [${toggled.key}] berhasil diperbarui!`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 font-sans">
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pengaturan & Fitur Sistem</h1>
        <p className="text-[11px] text-slate-400 font-medium">Pengontrol sakelar fitur dinamis (feature flags), mode perbaikan, dan variabel lingkungan</p>
      </div>

      <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-2.5 bg-white">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Sliders className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-slate-800">Feature Toggle Registry</h3>
            <p className="text-[10px] text-slate-400 font-medium">Daftar konfigurasi dinamis yang aktif pada cluster saat ini</p>
          </div>
        </div>

        {/* Flags List */}
        <div className="p-5 divide-y divide-slate-100">
          {flags.map((flag) => (
            <FeatureFlagToggle
              key={flag.id}
              flag={flag}
              onToggle={handleToggleFlag}
            />
          ))}
          {flags.length === 0 && (
            <div className="text-center py-6 text-slate-400 font-bold text-[12px]">
              Tidak ada feature flag terdaftar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
