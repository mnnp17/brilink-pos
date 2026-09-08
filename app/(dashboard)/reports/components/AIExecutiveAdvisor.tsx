'use client';

import React from 'react';
import { ShieldAlert, TrendingUp, Cpu, CheckCircle } from 'lucide-react';

interface AIExecutiveAdvisorProps {
  healthScore: number;
  executiveSummary: string[];
  strategicRecommendations: string[];
}

export function AIExecutiveAdvisor({
  healthScore,
  executiveSummary,
  strategicRecommendations,
}: AIExecutiveAdvisorProps) {
  // Get health color classes based on score
  const getHealthBadgeStyles = (score: number) => {
    if (score >= 80) {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        dot: 'bg-emerald-500',
        label: 'SEHAT',
      };
    } else if (score >= 60) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        dot: 'bg-amber-500',
        label: 'WASPAADA',
      };
    } else {
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        dot: 'bg-rose-500',
        label: 'KRITIS',
      };
    }
  };

  const badgeStyles = getHealthBadgeStyles(healthScore);

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
      {/* Header with AI Badge and Health Score */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <Cpu className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-[13px] text-white">AI Executive Advisor</h3>
            <p className="text-[10px] text-slate-400 font-medium">Analisis Finansial Otomatis oleh Co-Pilot</p>
          </div>
        </div>

        {/* Health Score Badge */}
        <div className={`flex items-center gap-2 px-3 py-1 border rounded-xl text-[11px] font-bold ${badgeStyles.bg}`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${badgeStyles.dot}`} />
          <span>Health Score: {healthScore}/100 ({badgeStyles.label})</span>
        </div>
      </div>

      {/* Grid 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[12px] leading-relaxed">
        {/* Column 1: Executive Summary */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-blue-300 text-[11px] uppercase tracking-wider">
            Ringkasan Eksekutif Finansial
          </h4>
          <ul className="space-y-2">
            {executiveSummary.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-slate-300">
                <TrendingUp className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Strategic Recommendations */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-emerald-400 text-[11px] uppercase tracking-wider">
            Rekomendasi Tindakan AI
          </h4>
          <ul className="space-y-2">
            {strategicRecommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
