'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils/format';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ShieldAlert, Award } from 'lucide-react';

interface ReportMetricCardsProps {
  grossVolume: number;
  cogsBankFee: number;
  totalOpex: number;
  netProfitReal: number;
  momGrowth: {
    grossVolumePct: number;
    cogsPct: number;
    opexPct: number;
    netProfitPct: number;
  };
}

export function ReportMetricCards({
  grossVolume,
  cogsBankFee,
  totalOpex,
  netProfitReal,
  momGrowth,
}: ReportMetricCardsProps) {
  
  const renderGrowthIndicator = (pct: number) => {
    const isPositive = pct >= 0;
    const absPct = Math.abs(pct).toFixed(1);
    
    return (
      <div className={`flex items-center gap-1 text-[11px] font-bold mt-1.5 ${
        isPositive ? 'text-emerald-600' : 'text-rose-600'
      }`}>
        {isPositive ? (
          <TrendingUp className="w-3.5 h-3.5" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5" />
        )}
        <span>{isPositive ? '+' : '-'}{absPct}% MoM</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Omset Gross */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Omset Gross (Volume)</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[18px] font-black text-slate-900 mt-2 font-mono leading-none">
            {formatRupiah(grossVolume)}
          </p>
        </div>
        {renderGrowthIndicator(momGrowth.grossVolumePct)}
      </div>

      {/* 2. COGS (Biaya Bank) */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">COGS (Biaya Bank)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[18px] font-black text-rose-600 mt-2 font-mono leading-none">
            -{formatRupiah(cogsBankFee)}
          </p>
        </div>
        {renderGrowthIndicator(momGrowth.cogsPct)}
      </div>

      {/* 3. OPEX (Operasional) */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">OPEX (Beban Toko)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[18px] font-black text-slate-700 mt-2 font-mono leading-none">
            -{formatRupiah(totalOpex)}
          </p>
        </div>
        {renderGrowthIndicator(momGrowth.opexPct)}
      </div>

      {/* 4. Net Profit Riil */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between ring-1 ring-emerald-500/15 bg-gradient-to-b from-white to-emerald-50/10">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Net Profit Riil</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[18px] font-black text-emerald-600 mt-2 font-mono leading-none">
            {formatRupiah(netProfitReal)}
          </p>
        </div>
        {renderGrowthIndicator(momGrowth.netProfitPct)}
      </div>
    </div>
  );
}
