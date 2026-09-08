'use client';

import React from 'react';
import { RefactoredOwnerTransaction } from '@/types/owner-transaction';
import { formatRupiah } from '@/lib/utils/format';
import { CreditCard, Eye } from 'lucide-react';

interface OwnerTransactionTableProps {
  transactions: RefactoredOwnerTransaction[];
  onSelectRow: (tx: RefactoredOwnerTransaction) => void;
}

export function OwnerTransactionTable({ transactions, onSelectRow }: OwnerTransactionTableProps) {
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' WIB';
  };

  // Determine audit status and badges
  const getAuditBadge = (tx: RefactoredOwnerTransaction) => {
    if (tx.netProfit <= 0 || tx.hasAnomaly) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
          🔴 Anomali Margin
        </span>
      );
    }
    
    // Check if it has a discount applied (e.g. noted in note)
    if (tx.anomalyNote?.toLowerCase().includes('diskon') || tx.anomalyNote === 'DISCOUNT') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
          🟡 Diskon Admin
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
        🟢 OK
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              <th className="px-5 py-3">Waktu & ID</th>
              <th className="px-5 py-3">Layanan & EDC</th>
              <th className="px-5 py-3">Kasir</th>
              <th className="px-5 py-3 text-right">Nominal Transaksi</th>
              <th className="px-5 py-3 text-right">Margin Breakdown (Admin - COGS)</th>
              <th className="px-5 py-3 text-center">Status Audit</th>
              <th className="px-5 py-3 text-center">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr 
                  key={tx.id} 
                  onClick={() => onSelectRow(tx)}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  {/* Waktu & ID */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-slate-800">{formatTime(tx.createdAt)}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(tx.createdAt)}</div>
                    <div className="text-[9.5px] font-mono text-slate-400 mt-0.5 select-all">ID: {tx.transactionNumber}</div>
                  </td>

                  {/* Layanan & EDC */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-slate-700">{tx.serviceName}</div>
                    <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-100">
                      <CreditCard className="w-3 h-3 text-blue-500" />
                      <span>{tx.sourceAccountName}</span>
                    </div>
                  </td>

                  {/* Kasir */}
                  <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-700">
                    {tx.cashierName}
                  </td>

                  {/* Nominal Transaksi */}
                  <td className="px-5 py-3.5 text-right font-extrabold text-slate-800 font-mono">
                    {formatRupiah(tx.amount)}
                  </td>

                  {/* Margin Breakdown Column */}
                  <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap">
                    <div className="text-[10px] text-slate-400 font-bold">
                      {formatRupiah(tx.customerAdminFee)} - {formatRupiah(tx.bankFee)}
                    </div>
                    <div className={`font-extrabold text-[12px] mt-0.5 ${tx.netProfit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      = {tx.netProfit >= 0 ? '+' : ''}{formatRupiah(tx.netProfit)}
                    </div>
                  </td>

                  {/* Status Audit Badge */}
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    {getAuditBadge(tx)}
                  </td>

                  {/* Detail Arrow / Eye */}
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex p-1 rounded-lg border border-slate-200 bg-white group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 text-slate-400 shadow-xs transition-all">
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                  <div className="font-bold text-[13px]">Tidak ada transaksi ditemukan</div>
                  <div className="text-[10px] mt-0.5">Sesuaikan filter pencarian atau parameter penyaringan Anda</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
