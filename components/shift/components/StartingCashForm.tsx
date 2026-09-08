'use client';

import React from 'react';
import { Calculator, Rocket, AlertTriangle, FileText } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';

interface StartingCashFormProps {
  startingCash: number;
  setStartingCash: (val: number) => void;
  notes: string;
  setNotes: (val: string) => void;
  isAutoFilled: boolean;
  setIsAutoFilled: (val: boolean) => void;
  inputHighlight: boolean;
  onTriggerDenomination: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export function StartingCashForm({
  startingCash,
  setStartingCash,
  notes,
  setNotes,
  isAutoFilled,
  setIsAutoFilled,
  inputHighlight,
  onTriggerDenomination,
  onSubmit,
  loading,
}: StartingCashFormProps) {

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const numVal = Math.max(0, parseInt(rawVal) || 0);
    setStartingCash(numVal);
    
    // Jika kasir mengubah angka secara manual setelah menekan tombol auto-fill, 
    // batalkan badge [✓ Sesuai Kas Kemarin] dan kembalikan flag isAutoFilled = false.
    if (isAutoFilled) {
      setIsAutoFilled(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Starting Cash Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
            Saldo Kas Awal Laci (Tunai)
          </label>
          <button
            type="button"
            onClick={onTriggerDenomination}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200/40 transition-colors cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            Gunakan Kalkulator Pecahan
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] font-extrabold">
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={startingCash ? startingCash.toLocaleString('id-ID') : ''}
            onChange={handleCashChange}
            placeholder="0"
            className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 hover:bg-white text-slate-800 text-[20px] font-black font-mono border rounded-2xl outline-none focus:bg-white transition-all ${
              inputHighlight
                ? 'border-emerald-500 ring-4 ring-emerald-100'
                : 'border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
            }`}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
          Hitung fisik uang tunai di laci sebelum memulai operasional. Nominal tidak boleh bernilai negatif.
        </p>
      </div>

      {/* Catatan Shift */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          Catatan Pembukaan
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tuliskan catatan pembukaan (misal: denominasi pas, ada koin tambahan, dll)..."
          className="w-full px-4 py-3 text-[13px] border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none bg-slate-50 focus:bg-white"
        />
      </div>

      {/* Error or Alert Guardrail */}
      {startingCash < 0 && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span>Nominal kas awal tidak boleh kurang dari Rp 0!</span>
        </div>
      )}

      {/* Start Button */}
      <button
        type="submit"
        disabled={loading || startingCash < 0}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-[#FF6600] hover:bg-[#E65C00] text-white font-extrabold text-[14px] rounded-2xl shadow-lg shadow-orange-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <Rocket className="w-4 h-4" />
        {loading ? 'MEMBUKA SHIFT...' : '🚀 MULAI SHIFT'}
      </button>
    </form>
  );
}
