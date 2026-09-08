'use client';

import React, { useState, useEffect } from 'react';
import { TransactionFilterState, AITransactionAuditResponse } from '@/types/owner-transaction';
import { Sparkles, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';

interface AITransactionSummaryCardProps {
  filter: TransactionFilterState;
  aggregateStats: {
    totalVolume: number;
    totalTransactions: number;
    anomalyCount: number;
  };
}

export function AITransactionSummaryCard({ filter, aggregateStats }: AITransactionSummaryCardProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [auditData, setAuditData] = useState<AITransactionAuditResponse | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch('/api/ai/transaction-audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...filter,
            aggregateStats,
          }),
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const data = await response.json();
        setAuditData(data);
      } catch (err) {
        console.error('AI transaction audit failed:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [
    filter.timePreset, 
    filter.startDateTime, 
    filter.endDateTime, 
    filter.cashierId, 
    filter.accountId, 
    filter.serviceId, 
    filter.marginStatus, 
    aggregateStats.totalTransactions
  ]);

  // Fallback: If API returns error/timeout, hide widget completely as per brief
  if (error) {
    return null;
  }

  // Loading State: Animated shimmer skeleton loader
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-100 rounded-3xl p-5 shadow-xs space-y-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-blue-200" />
          <div className="h-4 bg-blue-200 rounded w-48" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 bg-slate-200 rounded w-full" />
          <div className="h-3.5 bg-slate-200 rounded w-11/12" />
          <div className="h-3.5 bg-slate-200 rounded w-4/5" />
        </div>
        <div className="pt-2 flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-200" />
          <div className="h-3 bg-amber-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!auditData) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/70 rounded-3xl p-5 shadow-xs space-y-4 relative overflow-hidden">
      {/* Decorative backdrop elements */}
      <div className="absolute right-4 top-4 text-blue-500/10 text-5xl">✨</div>

      {/* Title */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
        <h3 className="font-extrabold text-[14px] text-slate-800">Analisa AI Auditor Transaksi</h3>
        <span className="bg-blue-100 text-blue-700 text-[8.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Live Audit
        </span>
      </div>

      {/* ── Summary Bullets ── */}
      <div className="space-y-2.5">
        {auditData.summaryPoints.map((point, index) => (
          <p key={index} className="text-[12px] text-slate-600 leading-relaxed font-semibold flex items-start gap-2">
            <span className="text-blue-500 mt-1 select-none">•</span>
            <span>{point}</span>
          </p>
        ))}
      </div>

      {/* ── Anomaly Alert Banner (Dinamis jika ditemukan anomali) ── */}
      {auditData.anomaliesFound && auditData.anomalyDetails && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3.5 flex items-start gap-3 mt-1">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <h4 className="text-[11.5px] font-black text-rose-800 uppercase tracking-wider">Deteksi Kebocoran Margin / Anomali</h4>
            <div className="mt-1 space-y-1">
              {auditData.anomalyDetails.map((detail, idx) => (
                <p key={idx} className="text-[11px] text-rose-700 font-bold leading-normal">
                  ⚠️ {detail}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── COGS Efficiency Tip ── */}
      {auditData.efficiencyTip && (
        <div className="bg-white/80 backdrop-blur-xs border border-indigo-100/60 rounded-2xl p-3.5 flex items-start gap-3">
          <Lightbulb className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11.5px] font-black text-indigo-900 uppercase tracking-wider">Tips Efisiensi COGS</h4>
            <p className="text-[11px] text-slate-600 font-semibold leading-relaxed mt-0.5">
              {auditData.efficiencyTip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
