'use client';

import React, { useState } from 'react';
import { MockDataGeneratorModal } from '../components/MockDataGeneratorModal';
import { Database, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function DataSeederPage() {
  const [isSeederOpen, setIsSeederOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleGenerateData = async (count: number, type: string) => {
    // Simulate API seeding delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.error('Sistem sekarang menggunakan database realtime! Tool suntik data lokal ini dinonaktifkan.');
  };

  const handleClearLocalStorage = async () => {
    setIsClearing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      localStorage.removeItem('pos-activity-logs');
      localStorage.removeItem('pos-staff-users');
      localStorage.removeItem('owner-mock-session');
      window.dispatchEvent(new Event('activity-logs-updated'));
      toast.success('Pembersihan LocalStorage berhasil dilakukan! Data kembali ke default.');
    } catch (e) {
      toast.error('Gagal membersihkan cache.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 font-sans">
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Manajemen Data & Tools</h1>
        <p className="text-[11px] text-slate-400 font-medium">Pengelolaan data simulasi (mock data seeder), pembersih cache, dan pengujian database</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mock Data Generator Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-[13px] font-bold text-slate-800 leading-tight">Mock Data Seeder</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Suntikkan kumpulan record transaksi POS dual-balance dan shift kasir fiktif secara instan untuk mensimulasikan kepadatan grafik laporan penjualan.
            </p>
          </div>
          <button
            onClick={() => setIsSeederOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-[12px] shadow-sm shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Buka Panel Seeder
          </button>
        </div>

        {/* Clear/Flush Storage Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
            </div>
            <h3 className="text-[13px] font-bold text-slate-800 leading-tight">Factory Reset Cache</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Bersihkan seluruh data yang tersimpan di dalam browser LocalStorage (Log Aktivitas, Custom Staff, Mock Session) untuk mengembalikan sistem ke kondisi instalasi awal.
            </p>
          </div>
          <button
            onClick={handleClearLocalStorage}
            disabled={isClearing}
            className="w-full border border-rose-200 hover:bg-rose-50/50 text-rose-600 font-bold py-2 px-4 rounded-xl text-[12px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            {isClearing ? 'Membersihkan...' : 'Reset Seluruh Cache'}
          </button>
        </div>
      </div>

      {/* Generator Modal Component */}
      <MockDataGeneratorModal
        isOpen={isSeederOpen}
        onClose={() => setIsSeederOpen(false)}
        onGenerate={handleGenerateData}
      />
    </div>
  );
}
