'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calculator, Plus, Minus } from 'lucide-react';
import type { DenominationBreakdown } from '@/types/shift';
import { formatRupiah } from '@/lib/utils/format';

interface DenominationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (breakdown: DenominationBreakdown) => void;
  initialBreakdown?: DenominationBreakdown;
}

const NOMINALS = [
  { value: 100000, label: 'Rp 100.000' },
  { value: 50000, label: 'Rp 50.000' },
  { value: 20000, label: 'Rp 20.000' },
  { value: 10000, label: 'Rp 10.000' },
  { value: 5000, label: 'Rp 5.000' },
  { value: 2000, label: 'Rp 2.000' },
  { value: 1000, label: 'Rp 1.000' },
  { value: 500, label: 'Rp 500 (Koin)' },
  { value: 200, label: 'Rp 200 (Koin)' },
  { value: 100, label: 'Rp 100 (Koin)' },
];

export function DenominationModal({ isOpen, onClose, onApply, initialBreakdown }: DenominationModalProps) {
  const [counts, setCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (isOpen) {
      const initialCounts: Record<number, number> = {};
      NOMINALS.forEach((n) => {
        initialCounts[n.value] = initialBreakdown?.[n.value] || 0;
      });
      setCounts(initialCounts);
    }
  }, [isOpen, initialBreakdown]);

  const totalAmount = useMemo(() => {
    return Object.entries(counts).reduce(
      (sum, [nominal, count]) => sum + Number(nominal) * count,
      0
    );
  }, [counts]);

  const handleChange = (nominal: number, val: string) => {
    const parsed = Math.max(0, parseInt(val) || 0);
    setCounts((prev) => ({
      ...prev,
      [nominal]: parsed,
    }));
  };

  const adjustCount = (nominal: number, delta: number) => {
    setCounts((prev) => {
      const current = prev[nominal] || 0;
      return {
        ...prev,
        [nominal]: Math.max(0, current + delta),
      };
    });
  };

  const handleApply = () => {
    onApply(counts);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-800">Kalkulator Denominasi Uang</h3>
              <p className="text-[10px] text-slate-400">Pecahan lembaran & koin fisik laci</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Denominations */}
        <div className="p-5 overflow-y-auto max-h-[50vh] space-y-2.5">
          {NOMINALS.map((nom) => {
            const count = counts[nom.value] || 0;
            return (
              <div
                key={nom.value}
                className="flex items-center justify-between gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] font-extrabold text-slate-700">{nom.label}</span>
                </div>
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => adjustCount(nom.value, -1)}
                    className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={count || ''}
                    placeholder="0"
                    onChange={(e) => handleChange(nom.value, e.target.value)}
                    className="w-12 px-1 py-1 text-center font-bold text-[12px] text-slate-800 border border-slate-200 rounded-lg outline-none bg-white focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => adjustCount(nom.value, 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="w-[100px] text-right shrink-0">
                  <span className="text-[12px] font-bold text-slate-800 font-mono tabular-nums">
                    {formatRupiah(count * nom.value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer/Total */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-bold text-slate-500">Total Terhitung</span>
            <span className="text-[16px] font-black text-blue-600 font-mono tabular-nums">
              {formatRupiah(totalAmount)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-[0.99]"
            >
              Terapkan Nominal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
