'use client';

import React from 'react';
import { FinancialAccount } from '../types/account-master';
import { formatRupiah } from '@/lib/utils/format';
import { Wallet, CreditCard, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface AccountHeaderProps {
  accounts: FinancialAccount[];
}

export function AccountHeader({ accounts }: AccountHeaderProps) {
  const activeAccounts = accounts.filter(a => a.isActive);
  
  // 1. Total Liquidity
  const totalLiquidity = activeAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

  // 2. Cash vs Digital percentages
  const cashBalance = activeAccounts
    .filter(a => a.accountType === 'CASH_DRAWER')
    .reduce((sum, a) => sum + a.currentBalance, 0);
    
  const digitalBalance = totalLiquidity - cashBalance;
  
  const cashPct = totalLiquidity > 0 ? (cashBalance / totalLiquidity) * 100 : 0;
  const digitalPct = totalLiquidity > 0 ? (digitalBalance / totalLiquidity) * 100 : 0;

  // 3. Critical Accounts count
  const criticalAccounts = activeAccounts.filter(a => a.currentBalance < a.minBalanceThreshold);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
      {/* Card 1: Total Liquidity */}
      <div className="bg-[#001E36] text-white rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
        <div className="absolute right-4 top-4 text-white/5 text-[54px] font-black">💰</div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">Total Likuiditas Toko</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h2 className="text-[22px] font-black leading-tight tabular-nums">
            {formatRupiah(totalLiquidity)}
          </h2>
          <p className="text-[10.5px] text-blue-200 mt-1">Konsolidasi seluruh kas fisik & saldo digital</p>
        </div>
      </div>

      {/* Card 2: Cash vs Digital Ratio */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex justify-between items-center pb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Porsi Alokasi Modal</span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-bold text-slate-700">
            <span>Kas Fisik: {cashPct.toFixed(0)}%</span>
            <span>Digital: {digitalPct.toFixed(0)}%</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${cashPct}%` }} />
            <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${digitalPct}%` }} />
          </div>
          <div className="flex justify-between text-[9.5px] text-slate-400 font-semibold leading-none pt-0.5">
            <span>{formatRupiah(cashBalance)}</span>
            <span>{formatRupiah(digitalBalance)}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Alert low threshold accounts */}
      <div className={`rounded-3xl border p-5 shadow-xs flex items-center gap-4 transition-colors ${
        criticalAccounts.length > 0
          ? 'bg-rose-50 border-rose-200'
          : 'bg-white border-slate-200'
      }`}>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
          criticalAccounts.length > 0
            ? 'bg-rose-100 border-rose-300 text-rose-600'
            : 'bg-emerald-50 border-emerald-200 text-emerald-600'
        }`}>
          {criticalAccounts.length > 0 ? (
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          ) : (
            <ArrowUpRight className="w-5 h-5" />
          )}
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Kondisi Kesehatan Saldo</span>
          {criticalAccounts.length > 0 ? (
            <>
              <p className="text-[14px] font-black text-rose-700 leading-tight">
                {criticalAccounts.length} Akun Limit Kritis!
              </p>
              <p className="text-[10.5px] text-rose-500 leading-tight font-medium">
                Saldo menyentuh di bawah threshold aman
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] font-black text-emerald-700 leading-tight">
                Seluruh Saldo Aman
              </p>
              <p className="text-[10.5px] text-slate-400 leading-tight font-medium">
                Semua akun berada di atas threshold limit
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
