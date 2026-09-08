'use client';

import React, { useState } from 'react';
import { X, Database } from 'lucide-react';
import { toast } from 'sonner';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface MockDataGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (count: number, type: string) => Promise<void>;
}

export function MockDataGeneratorModal({ isOpen, onClose, onGenerate }: MockDataGeneratorModalProps) {
  const [count, setCount] = useState<number>(20);
  const [dataType, setDataType] = useState<string>('transactions');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onGenerate(count, dataType);
      toast.success(`Berhasil menyuntikkan ${count} data simulasi ${dataType}!`);
      onClose();
    } catch (err) {
      toast.error('Gagal menyuntikkan data simulasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-black uppercase text-slate-800 leading-tight">Mock Data Seeder</h3>
              <p className="text-[10px] text-slate-400 font-medium">Simulator Data Transaksi & Shift</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Target Data Select */}
          <CustomSelect
            label="Jenis Data Simulasi"
            value={dataType}
            onChange={(v) => setDataType(v)}
            minWidth="100%"
            options={[
              { value: 'transactions', label: 'Riwayat Transaksi POS (Dual-Balance)' },
              { value: 'audit_logs', label: 'Audit Logs Keamanan' },
              { value: 'error_logs', label: 'Crash & System Error Logs' },
            ]}
          />

          {/* Records Count */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Jumlah Data Record</label>
            <input
              type="number"
              min={5}
              max={100}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-[12.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400"
              required
            />
            <span className="text-[9.5px] text-slate-400 block font-medium">Maksimal 100 record per seed untuk mencegah over-utilization.</span>
          </div>

          {/* Alert Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10.5px] text-amber-800 leading-normal">
            ⚠️ <strong>Perhatian:</strong> Data ini akan disuntikkan secara aman ke database lokal. Data simulasi menggunakan format acak realistis.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 text-[12px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/35 active:scale-98 disabled:opacity-50"
          >
            {loading ? 'Menyuntikkan...' : 'Suntikkan Data'}
          </button>
        </div>
      </form>
    </div>
  );
}
