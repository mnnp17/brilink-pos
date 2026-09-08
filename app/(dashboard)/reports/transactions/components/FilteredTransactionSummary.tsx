'use client';

import React from 'react';
import { RefactoredOwnerTransaction } from '@/types/owner-transaction';
import { formatRupiah } from '@/lib/utils/format';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FilteredTransactionSummaryProps {
  transactions: RefactoredOwnerTransaction[];
}

export function FilteredTransactionSummary({ transactions }: FilteredTransactionSummaryProps) {
  // 1. Calculate Volume Transaksi
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  // 2. Calculate Total COGS Bank
  const totalCogs = transactions.reduce((sum, tx) => sum + tx.bankFee, 0);

  // 3. Calculate Total Customer Admin
  const totalAdmin = transactions.reduce((sum, tx) => sum + tx.customerAdminFee, 0);

  // 4. Calculate Net Profit Total (Admin Pelanggan - COGS Bank)
  const netProfitTotal = totalAdmin - totalCogs;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Volume Transaksi Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Volume Transaksi</span>
          <p className="text-[18px] font-black text-slate-800 leading-tight mt-0.5">
            {formatRupiah(totalVolume)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total dana berputar terfilter</p>
        </div>
      </div>

      {/* Total COGS Bank Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center shrink-0">
          <TrendingDown className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total COGS Bank</span>
          <p className="text-[18px] font-black text-rose-600 leading-tight mt-0.5">
            -{formatRupiah(totalCogs)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Potongan biaya admin bank</p>
        </div>
      </div>

      {/* Laba Bersih Total Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Laba Bersih Total</span>
          <p className={`text-[18px] font-black leading-tight mt-0.5 ${netProfitTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netProfitTotal >= 0 ? '+' : ''}{formatRupiah(netProfitTotal)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Formula: Admin Pelanggan - COGS</p>
        </div>
      </div>
    </div>
  );
}
