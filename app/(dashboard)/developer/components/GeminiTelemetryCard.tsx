'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, DollarSign, Zap, AlertOctagon, CheckCircle } from 'lucide-react';
import type { GeminiUsageMetrics } from '../types/developer';

export function GeminiTelemetryCard() {
  const [metrics, setMetrics] = useState<GeminiUsageMetrics>({
    promptTokensToday: 41250,
    candidatesTokensToday: 18240,
    estimatedCostUsd: 0.124,
    rateLimitStatus: 'HEALTHY',
    averageLatencyMs: 1420,
  });

  useEffect(() => {
    const fetchUsage = () => {
      // Simulate real usage token growth
      setMetrics((prev) => {
        const newPrompts = prev.promptTokensToday + Math.floor(Math.random() * 250);
        const newCandidates = prev.candidatesTokensToday + Math.floor(Math.random() * 120);
        // Cost formulas: Prompt ($0.075 / 1M), Candidates ($0.30 / 1M)
        const newCost = (newPrompts * 0.000000075) + (newCandidates * 0.0000003);

        // Dynamic rate limits simulation
        let rateLimit: 'HEALTHY' | 'WARNING_80' | 'RATE_LIMITED' = 'HEALTHY';
        const usageRatio = newPrompts / 100000;
        if (usageRatio > 0.95) {
          rateLimit = 'RATE_LIMITED';
        } else if (usageRatio > 0.8) {
          rateLimit = 'WARNING_80';
        }

        return {
          promptTokensToday: newPrompts,
          candidatesTokensToday: newCandidates,
          estimatedCostUsd: Number(newCost.toFixed(4)),
          rateLimitStatus: rateLimit,
          averageLatencyMs: Math.floor(Math.random() * 200) + 1300,
        };
      });
    };

    const interval = setInterval(fetchUsage, 6000);
    return () => clearInterval(interval);
  }, []);

  const getStatusDisplay = (status: 'HEALTHY' | 'WARNING_80' | 'RATE_LIMITED') => {
    switch (status) {
      case 'RATE_LIMITED':
        return {
          label: 'RATE LIMITED (100%)',
          color: 'bg-rose-50 border-rose-200 text-rose-700',
          icon: AlertOctagon,
        };
      case 'WARNING_80':
        return {
          label: 'CONGESTION WARNING (80%+)',
          color: 'bg-amber-50 border-amber-200 text-amber-700',
          icon: AlertOctagon,
        };
      default:
        return {
          label: 'HEALTHY (OPERATIONAL)',
          color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          icon: CheckCircle,
        };
    }
  };

  const statusInfo = getStatusDisplay(metrics.rateLimitStatus);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between font-sans">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-slate-800 leading-tight">Google Gemini AI Engine</h3>
            <p className="text-[10px] text-slate-400 font-medium">Model: gemini-1.5-flash</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border ${statusInfo.color}`}>
          <statusInfo.icon className="w-2.5 h-2.5" />
          {statusInfo.label}
        </span>
      </div>

      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Prompt Tokens */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prompt Tokens</span>
          <span className="text-xl font-black text-slate-800 tabular-nums">
            {metrics.promptTokensToday.toLocaleString('id-ID')}
          </span>
          <span className="text-[9px] text-slate-400 block font-medium">Input Sent Today</span>
        </div>

        {/* Completion Tokens */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidate Tokens</span>
          <span className="text-xl font-black text-slate-800 tabular-nums">
            {metrics.candidatesTokensToday.toLocaleString('id-ID')}
          </span>
          <span className="text-[9px] text-slate-400 block font-medium">Output Generated</span>
        </div>

        {/* Avg Latency */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Latency</span>
          <span className="text-xl font-black text-slate-800 tabular-nums flex items-baseline gap-0.5">
            {(metrics.averageLatencyMs / 1000).toFixed(2)}
            <span className="text-xs font-semibold text-slate-400">s</span>
          </span>
          <span className="text-[9px] text-slate-400 block font-medium">Response Generation</span>
        </div>

        {/* Estimated Cost */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Cost</span>
          <span className="text-xl font-black text-indigo-600 tabular-nums flex items-center">
            <DollarSign className="w-4 h-4 shrink-0" />
            {metrics.estimatedCostUsd.toFixed(4)}
          </span>
          <span className="text-[9px] text-emerald-600 block font-extrabold uppercase">Under Budget</span>
        </div>
      </div>
    </div>
  );
}
