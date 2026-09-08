'use client';

import React from 'react';
import { formatRupiah } from '@/lib/utils/format';
import { ServiceProfitabilityItem } from '../../types/report';
import { BarChart2, CheckCircle2 } from 'lucide-react';

interface ServicePerformanceTabProps {
  services: ServiceProfitabilityItem[];
}

export function ServicePerformanceTab({ services }: ServicePerformanceTabProps) {
  // Calculate total net profit for percentage distribution
  const totalNetProfit = services.reduce((sum, item) => sum + item.netProfit, 0);

  // SVG Donut calculation constants
  const radius = 45;
  const circumference = 2 * Math.PI * radius; // ~282.74

  let accumulatedPercentage = 0;

  // Colors list for services
  const colors = [
    { text: 'text-blue-500', stroke: '#3b82f6', bg: 'bg-blue-500' },
    { text: 'text-emerald-500', stroke: '#10b981', bg: 'bg-emerald-500' },
    { text: 'text-indigo-500', stroke: '#6366f1', bg: 'bg-indigo-500' },
    { text: 'text-amber-500', stroke: '#f59e0b', bg: 'bg-amber-500' },
    { text: 'text-rose-500', stroke: '#f43f5e', bg: 'bg-rose-500' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Table Section */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-wider">
            Analisis Performa Laba Per Layanan
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Nama Layanan</th>
                <th className="px-4 py-3 text-center">Volume Tx</th>
                <th className="px-4 py-3 text-right">Gross Admin</th>
                <th className="px-4 py-3 text-right">COGS Bank</th>
                <th className="px-4 py-3 text-right text-emerald-600 font-bold">Net Profit</th>
                <th className="px-4 py-3 text-center">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
              {services.map((item, index) => {
                const color = colors[index % colors.length];
                return (
                  <tr key={item.serviceId} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full ${color.bg}`} />
                      <span className="font-bold text-slate-800">{item.serviceName}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-700">{item.txCount} tx</td>
                    <td className="px-4 py-3.5 text-right text-indigo-600">+{formatRupiah(item.grossAdmin)}</td>
                    <td className="px-4 py-3.5 text-right text-rose-500">-{formatRupiah(item.cogsBank)}</td>
                    <td className="px-4 py-3.5 text-right text-emerald-600 font-bold">+{formatRupiah(item.netProfit)}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      {item.marginPct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donut Chart Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-[14px] font-extrabold text-slate-800 uppercase tracking-wider">
            Distribusi Net Profit
          </h3>
        </div>

        {/* SVG Donut */}
        <div className="flex items-center justify-center relative h-48">
          <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="10"
            />
            {services.map((item, index) => {
              const color = colors[index % colors.length];
              const share = totalNetProfit > 0 ? item.netProfit / totalNetProfit : 0;
              const strokeDasharray = `${share * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedPercentage * circumference;
              
              accumulatedPercentage += share;

              if (share <= 0) return null;

              return (
                <circle
                  key={item.serviceId}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={color.stroke}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Laba Bersih</span>
            <span className="text-[15px] font-black text-slate-800 leading-tight">
              {formatRupiah(totalNetProfit)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
          {services.map((item, index) => {
            const color = colors[index % colors.length];
            const share = totalNetProfit > 0 ? (item.netProfit / totalNetProfit) * 100 : 0;
            return (
              <div key={item.serviceId} className="flex items-center gap-1.5 text-slate-600">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.bg}`} />
                <span className="truncate">{item.serviceName}</span>
                <span className="text-slate-400 font-semibold">({share.toFixed(0)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
