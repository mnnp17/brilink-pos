'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils/format';

interface TargetProgressBarProps {
  netProfitReal: number;
  monthlyTarget: number;
}

export function TargetProgressBar({ netProfitReal, monthlyTarget }: TargetProgressBarProps) {
  // Avoid division by zero
  const percentage = monthlyTarget > 0 ? (netProfitReal / monthlyTarget) * 100 : 0;
  // Cap percentage visual representation at 100% or allow overflow but clamp bar width
  const barWidth = Math.max(0, Math.min(100, percentage));

  return (
    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Pencapaian Target Profit Bulanan
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[16px] font-black text-slate-900">
              {formatRupiah(netProfitReal)}
            </span>
            <span className="text-[11px] text-slate-400 font-bold">
              dari target {formatRupiah(monthlyTarget)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-[15px] font-black ${
            percentage >= 100 ? 'text-emerald-600' : 'text-blue-600'
          }`}>
            {percentage.toFixed(1)}%
          </span>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Tercapai</p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            percentage >= 100 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
              : percentage >= 50
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
