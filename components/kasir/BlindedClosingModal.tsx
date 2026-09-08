'use client';

import React, { useState } from 'react';
import { closeShiftAction } from '@/lib/actions/shift';

interface BlindedClosingModalProps {
  isOpen: boolean;
  shiftId: string;
  onClose: () => void;
  onSuccess?: (summary: Record<string, unknown>) => void;
}

const DENOMINATIONS = [
  { value: 100000, label: 'Rp 100.000' },
  { value: 50000, label: 'Rp 50.000' },
  { value: 20000, label: 'Rp 20.000' },
  { value: 10000, label: 'Rp 10.000' },
  { value: 5000, label: 'Rp 5.000' },
  { value: 2000, label: 'Rp 2.000' },
  { value: 1000, label: 'Rp 1.000 (Lembar/Koin)' },
];

export function BlindedClosingModal({
  isOpen,
  shiftId,
  onClose,
  onSuccess,
}: BlindedClosingModalProps) {
  const [counts, setCounts] = useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const totalCalculated = Object.entries(counts).reduce(
    (sum, [denom, count]) => sum + Number(denom) * (count || 0),
    0
  );

  const handleCountChange = (value: number, input: string) => {
    const qty = parseInt(input, 10) || 0;
    setCounts((prev) => ({ ...prev, [value]: qty < 0 ? 0 : qty }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await closeShiftAction({
      shiftId,
      actualCash: totalCalculated,
    });

    setLoading(false);

    if (res.success) {
      if (onSuccess && res.summary) onSuccess(res.summary);
      onClose();
    } else {
      setError(res.error || 'Gagal menutup shift');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-[#00529C] px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🔒</span> Blinded Closing Shift Kasir
            </h2>
            <p className="text-xs text-blue-100">
              Input hitungan uang fisik di laci kasir (Target laci disembunyikan)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold p-1 hover:bg-white/10 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Table Pecahan Uang */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Kalkulator Pecahan Lembaran / Koin
            </label>

            {DENOMINATIONS.map((denom) => {
              const qty = counts[denom.value] || 0;
              const subtotal = denom.value * qty;

              return (
                <div
                  key={denom.value}
                  className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs"
                >
                  <span className="font-semibold text-gray-800 w-36">{denom.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">x</span>
                    <input
                      type="number"
                      min="0"
                      value={qty || ''}
                      onChange={(e) => handleCountChange(denom.value, e.target.value)}
                      placeholder="0"
                      className="w-20 px-2 py-1 bg-white border border-gray-300 rounded-lg text-center font-bold text-gray-900 focus:ring-2 focus:ring-[#00529C] focus:outline-none"
                    />
                    <span className="text-gray-400">lembar =</span>
                  </div>
                  <span className="w-28 text-right font-bold text-blue-900 font-mono">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grand Total */}
          <div className="bg-[#FFF0E6] border border-[#FF6600]/30 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Total Hasil Hitungan Kas Laci</p>
              <p className="text-xs text-gray-400">(Actual Physical Cash)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-[#FF6600]">
                Rp {totalCalculated.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || totalCalculated <= 0}
              className="px-6 py-2.5 bg-[#FF6600] hover:bg-[#E55C00] text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Mengunci Shift...</span>
                </>
              ) : (
                <span>🔒 Kunci & Tutup Shift</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
