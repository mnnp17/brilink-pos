'use client';

import React from 'react';
import type { PreviousShiftInfo } from '@/types/shift';
import { formatRupiah, formatDateTime } from '@/lib/utils/format';
import { ClipboardCopy, CheckCircle2 } from 'lucide-react';

interface PreviousShiftBannerProps {
  info: PreviousShiftInfo | null;
  isAutoFilled: boolean;
  onCopy: () => void;
}

export function PreviousShiftBanner({ info, isAutoFilled, onCopy }: PreviousShiftBannerProps) {
  if (!info) return null;

  return (
    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4.5 space-y-3.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Saldo Kas Shift Sebelumnya</h4>
          <p className="text-[18px] font-extrabold text-[#001E36] tabular-nums">
            {formatRupiah(info.closingBalance)}
          </p>
        </div>
        
        {isAutoFilled ? (
          <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg animate-fade-in shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Sesuai Kas Kemarin
          </span>
        ) : (
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            Samakan dengan Sisa Kas Kemarin
          </button>
        )}
      </div>

      <div className="border-t border-slate-200/40 pt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 font-medium">
        <span>
          Ditutup oleh: <strong className="text-slate-700 font-bold">{info.closedByName}</strong>
        </span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span>
          Waktu: <span className="text-slate-700 font-semibold">{formatDateTime(info.closedAt)}</span>
        </span>
      </div>
    </div>
  );
}
