'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils/format';
import { CashierAuditSummary } from '../../types/report';
import { Users, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface CashierAuditTabProps {
  audits: CashierAuditSummary[];
}

export function CashierAuditTab({ audits }: CashierAuditTabProps) {
  const getStatusBadge = (status: CashierAuditSummary['status']) => {
    if (status === 'EXCELLENT') {
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        icon: CheckCircle2,
        label: 'EXCELLENT',
      };
    } else if (status === 'GOOD') {
      return {
        bg: 'bg-blue-50 border-blue-200 text-blue-700',
        icon: CheckCircle2,
        label: 'GOOD',
      };
    } else {
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        icon: AlertTriangle,
        label: 'EVALUASI',
      };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-wider">
          Audit Skor Ketelitian & Shift Kasir
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="px-4 py-3">Nama Staf Kasir</th>
              <th className="px-4 py-3 text-center">Total Kerja Shift</th>
              <th className="px-4 py-3 text-center">Shift Sesuai (Match)</th>
              <th className="px-4 py-3 text-right">Total Selisih Kas (Rp)</th>
              <th className="px-4 py-3 text-center">Skor Akurasi (%)</th>
              <th className="px-4 py-3 text-center">Status Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
            {audits.map((cashier) => {
              const badge = getStatusBadge(cashier.status);
              const BadgeIcon = badge.icon;
              
              return (
                <tr key={cashier.cashierId} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5 font-bold text-slate-800">{cashier.cashierName}</td>
                  <td className="px-4 py-3.5 text-center text-slate-700">{cashier.totalShifts} shift</td>
                  <td className="px-4 py-3.5 text-center text-emerald-600">{cashier.matchedShifts} shift</td>
                  <td className={`px-4 py-3.5 text-right font-bold ${
                    cashier.totalVarianceAmount === 0 
                      ? 'text-slate-500' 
                      : cashier.totalVarianceAmount < 0 
                        ? 'text-rose-600' 
                        : 'text-amber-500'
                  }`}>
                    {cashier.totalVarianceAmount === 0 
                      ? 'Rp 0' 
                      : (cashier.totalVarianceAmount > 0 ? '+' : '') + formatRupiah(cashier.totalVarianceAmount)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`text-[12.5px] font-black ${
                      cashier.accuracyScore >= 95 
                        ? 'text-emerald-600' 
                        : cashier.accuracyScore >= 80 
                          ? 'text-blue-600' 
                          : 'text-rose-600'
                    }`}>
                      {cashier.accuracyScore.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 border rounded-full text-[10px] font-black ${badge.bg}`}>
                      <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{badge.label}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
