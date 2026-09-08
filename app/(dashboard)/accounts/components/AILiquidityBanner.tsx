'use client';

import React from 'react';
import { FinancialAccount } from '../types/account-master';
import { formatRupiah } from '@/lib/utils/format';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AILiquidityBannerProps {
  accounts: FinancialAccount[];
  onTriggerRebalance: (fromId: string, toId: string, suggestedAmount: number) => void;
}

export function AILiquidityBanner({ accounts, onTriggerRebalance }: AILiquidityBannerProps) {
  const activeAccounts = accounts.filter(a => a.isActive);
  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  
  const cashAcc = activeAccounts.find(a => a.accountType === 'CASH_DRAWER');
  const mainBankAcc = activeAccounts.find(a => a.accountType === 'BANK_ACCOUNT' || a.accountType === 'EDC_MERCHANT');

  if (!cashAcc || !mainBankAcc || totalBalance <= 0) return null;

  const cashRatio = cashAcc.currentBalance / totalBalance;
  
  // Suggest rebalance if cash exceeds 40% of total liquidity
  const isCashTooHigh = cashRatio > 0.4;
  const suggestedTransferAmount = Math.max(0, cashAcc.currentBalance - (totalBalance * 0.25));

  if (!isCashTooHigh || suggestedTransferAmount < 1000000) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans relative overflow-hidden">
      <div className="absolute right-4 top-4 text-blue-500/5 text-[80px] font-black pointer-events-none">✨</div>
      <div className="flex items-start gap-3.5 max-w-2xl">
        <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-[13px] font-black text-slate-800">Rekomendasi Rebalancing Saldo AI</h4>
            <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Optimalisasi Kas
            </span>
          </div>
          <p className="text-[12px] text-slate-600 leading-relaxed font-semibold">
            Proporsi dana mengendap di <span className="text-slate-800 font-extrabold">{cashAcc.accountName}</span> terlalu besar (<strong>{(cashRatio * 100).toFixed(0)}%</strong> dari total likuiditas).
            Sistem menyarankan memindahkan <strong className="text-blue-700">{formatRupiah(suggestedTransferAmount)}</strong> ke <span className="text-slate-800 font-extrabold">{mainBankAcc.accountName}</span> guna menekan risiko penumpukan uang tunai fisik.
          </p>
        </div>
      </div>
      <button
        onClick={() => onTriggerRebalance(cashAcc.id, mainBankAcc.id, suggestedTransferAmount)}
        className="flex items-center gap-1.5 py-2 px-4.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-black rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 self-end md:self-auto"
      >
        <span>Pindahkan Saldo</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
