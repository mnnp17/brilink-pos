'use client';

import React from 'react';
import { AIOperationalAdvice } from '../types/catalog-master';
import { Lightbulb, Play, AlertTriangle } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';

interface AIOperationalAdvisorProps {
  advices: AIOperationalAdvice[];
  onApplyAdvice: (adviceId: string, serviceId: string, accountId: string) => void;
}

export function AIOperationalAdvisor({ advices, onApplyAdvice }: AIOperationalAdvisorProps) {
  if (advices.length === 0) return null;

  return (
    <div className="space-y-3">
      {advices.map((advice) => (
        <div
          key={advice.id}
          className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  AI Operational Advisor
                </span>
                {advice.impactMonthlyAmount && (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-1.5 py-0.25 rounded-md">
                    Potensi Hemat: +{formatRupiah(advice.impactMonthlyAmount)}/bln
                  </span>
                )}
              </div>
              <h4 className="font-extrabold text-[13px] text-white mt-0.5">{advice.title}</h4>
              <p className="text-[12px] text-slate-400 leading-normal mt-1">{advice.description}</p>
            </div>
          </div>

          {/* Action button */}
          {advice.targetServiceId && advice.suggestedAccountId && (
            <button
              onClick={() => onApplyAdvice(advice.id, advice.targetServiceId!, advice.suggestedAccountId!)}
              className="flex items-center justify-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-[12px] rounded-xl transition-all shrink-0 self-start sm:self-center cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Terapkan Rute</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
