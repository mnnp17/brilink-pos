'use client';

import React from 'react';
import { ReportTabType } from '../types/report';
import { BarChart3, Server, Users, Landmark } from 'lucide-react';

interface ReportTabsProps {
  activeTab: ReportTabType;
  onTabChange: (tab: ReportTabType) => void;
}

export function ReportTabs({ activeTab, onTabChange }: ReportTabsProps) {
  const tabs = [
    {
      id: 'PROFIT_LOSS' as const,
      label: 'Laporan Laba-Rugi Statement',
      icon: BarChart3,
    },
    {
      id: 'SERVICES' as const,
      label: 'Performa Layanan',
      icon: Server,
    },
    {
      id: 'CASHIER_AUDIT' as const,
      label: 'Audit Shift Kasir',
      icon: Users,
    },
    {
      id: 'BANK_MUTATION' as const,
      label: 'Bank & EDC',
      icon: Landmark,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0 overflow-x-auto scrollbar-none">
      <div className="flex gap-6 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 text-[13px] font-bold border-b-2 transition-colors relative cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
