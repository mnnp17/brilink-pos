'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils/format';
import { OpexBreakdownItem } from '../../types/report';
import { FileText, TrendingUp, DollarSign } from 'lucide-react';

interface ProfitLossTabProps {
  customerAdminIncome: number;
  cogsBankFee: number;
  grossProfit: number;
  opexItems: OpexBreakdownItem[];
  totalOpex: number;
  netProfitReal: number;
}

export function ProfitLossTab({
  customerAdminIncome,
  cogsBankFee,
  grossProfit,
  opexItems,
  totalOpex,
  netProfitReal,
}: ProfitLossTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <FileText className="w-5 h-5 text-blue-600" />
        <h3 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-wider">
          Laporan Laba-Rugi Statement (P&L)
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="px-4 py-3">Deskripsi Rekening Akun</th>
              <th className="px-4 py-3 text-right">Nominal Pendapatan</th>
              <th className="px-4 py-3 text-right text-rose-600">Beban / Pengeluaran</th>
              <th className="px-4 py-3 text-right text-slate-800 font-bold">Subtotal (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {/* 1. Pendapatan */}
            <tr className="hover:bg-slate-50/50">
              <td className="px-4 py-3.5 font-bold text-slate-800">Total Pendapatan Admin Pelanggan</td>
              <td className="px-4 py-3.5 text-right text-emerald-600 font-bold">
                +{formatRupiah(customerAdminIncome)}
              </td>
              <td className="px-4 py-3.5 text-right text-slate-300">-</td>
              <td className="px-4 py-3.5 text-right text-slate-800 font-bold">
                {formatRupiah(customerAdminIncome)}
              </td>
            </tr>

            {/* 2. COGS */}
            <tr className="hover:bg-slate-50/50">
              <td className="px-4 py-3.5 font-bold text-slate-800">Biaya Administrasi Bank (COGS)</td>
              <td className="px-4 py-3.5 text-right text-slate-300">-</td>
              <td className="px-4 py-3.5 text-right text-rose-500 font-bold">
                -{formatRupiah(cogsBankFee)}
              </td>
              <td className="px-4 py-3.5 text-right text-rose-500 font-bold">
                -{formatRupiah(cogsBankFee)}
              </td>
            </tr>

            {/* 3. Gross Profit */}
            <tr className="bg-slate-50 font-bold border-y border-slate-200">
              <td className="px-4 py-3.5 font-extrabold text-slate-800 text-[12.5px] uppercase">Laba Kotor (Gross Profit)</td>
              <td className="px-4 py-3.5 text-right text-slate-300">-</td>
              <td className="px-4 py-3.5 text-right text-slate-300">-</td>
              <td className="px-4 py-3.5 text-right text-slate-900 font-black text-[13px]">
                {formatRupiah(grossProfit)}
              </td>
            </tr>

            {/* 4. OPEX Breakdown */}
            <tr>
              <td colSpan={4} className="px-4 py-2 bg-slate-50/40 text-[10.5px] font-black text-slate-400 uppercase tracking-widest">
                Rincian Biaya Operasional (OPEX)
              </td>
            </tr>
            {opexItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 pl-8 text-slate-600">Beban {item.categoryName}</td>
                <td className="px-4 py-3 text-right text-slate-300">-</td>
                <td className="px-4 py-3 text-right text-rose-500 font-medium">
                  -{formatRupiah(item.amount)}
                </td>
                <td className="px-4 py-3 text-right text-slate-500">
                  -{formatRupiah(item.amount)}
                </td>
              </tr>
            ))}

            {/* 5. Total OPEX */}
            <tr className="bg-slate-50/80 font-bold">
              <td className="px-4 py-3.5 font-extrabold text-slate-700 pl-6">Total Beban Operasional (OPEX)</td>
              <td className="px-4 py-3.5 text-right text-slate-300">-</td>
              <td className="px-4 py-3.5 text-right text-rose-500 font-black">
                -{formatRupiah(totalOpex)}
              </td>
              <td className="px-4 py-3.5 text-right text-rose-500 font-black">
                -{formatRupiah(totalOpex)}
              </td>
            </tr>

            {/* 6. Net Profit Riil */}
            <tr className="bg-emerald-500/10 font-bold border-t-2 border-emerald-500">
              <td className="px-4 py-4 font-black text-emerald-800 text-[13px] uppercase tracking-wide">
                Laba Bersih Riil (Net Profit)
              </td>
              <td className="px-4 py-4 text-right text-slate-300">-</td>
              <td className="px-4 py-4 text-right text-slate-300">-</td>
              <td className="px-4 py-4 text-right text-emerald-600 font-black text-[15px]">
                {formatRupiah(netProfitReal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
