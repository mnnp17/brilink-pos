'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils/format';
import { AccountBalanceItem } from '../../types/report';
import { Landmark, ArrowUpRight, ArrowDownLeft, ShieldAlert } from 'lucide-react';

interface AccountBalanceTabProps {
  accounts: AccountBalanceItem[];
}

export function AccountBalanceTab({ accounts }: AccountBalanceTabProps) {
  return (
    <div className="space-y-4">
      {/* Overview Title */}
      <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-blue-600" />
          <h3 className="text-[13px] font-extrabold text-slate-800 uppercase tracking-wider">
            Pengawasan Rekening & Potongan Merchant Fee EDC
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-bold">Total Terdaftar: {accounts.length} Akun</span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => {
          const isBelowThreshold = acc.currentBalance < acc.minThreshold;
          
          return (
            <div
              key={acc.accountId}
              className={`bg-white rounded-2xl border p-4.5 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${
                isBelowThreshold 
                  ? 'border-rose-300 ring-1 ring-rose-500/10 bg-gradient-to-b from-white to-rose-50/5' 
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-[13px] text-slate-800 leading-tight">{acc.accountName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{acc.accountNumber}</p>
                  </div>
                  
                  {isBelowThreshold && (
                    <span className="flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-600 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Sisa Limit</span>
                    </span>
                  )}
                </div>

                {/* Balance Info */}
                <div className="mt-3.5">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Saldo Digital Riil</span>
                  <p className="text-[17px] font-black text-slate-900 leading-tight mt-0.5">
                    {formatRupiah(acc.currentBalance)}
                  </p>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-[11px] font-semibold text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Limit Minimum:</span>
                  <span className="text-slate-700 font-bold">{formatRupiah(acc.minThreshold)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mutasi Transaksi:</span>
                  <span className="text-slate-800 font-extrabold">{acc.totalMutationsCount} mutasi</span>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-1.5 font-bold text-rose-500">
                  <span>Potongan Fee Bank:</span>
                  <span className="font-black">-{formatRupiah(acc.totalMerchantFee)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
