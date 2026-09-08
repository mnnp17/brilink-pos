'use client';

import React, { useState } from 'react';
import { QuickTimePreset } from '@/types/owner-transaction';
import { Calendar, ChevronDown, Clock } from 'lucide-react';

export interface DashboardFilterState {
  timePreset: QuickTimePreset;
  startDateTime: string;
  endDateTime: string;
}

interface DashboardTimeFilterProps {
  filter: DashboardFilterState;
  onChange: (filter: DashboardFilterState) => void;
}

const PRESETS: { value: QuickTimePreset; label: string }[] = [
  { value: 'TODAY', label: 'Hari Ini' },
  { value: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
  { value: 'THIS_MONTH', label: 'Bulan Ini' },
  { value: 'CUSTOM', label: 'Kustom' },
];

export function DashboardTimeFilter({ filter, onChange }: DashboardTimeFilterProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(filter.timePreset === 'CUSTOM');

  const selectPreset = (preset: QuickTimePreset) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === 'CUSTOM') {
      setShowCustomPicker(true);
      onChange({ ...filter, timePreset: 'CUSTOM' });
      return;
    }

    setShowCustomPicker(false);

    switch (preset) {
      case 'TODAY':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'LAST_7_DAYS':
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'THIS_MONTH':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      default:
        break;
    }

    onChange({
      timePreset: preset,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
    });
  };

  const handleCustomDateChange = (type: 'start' | 'end', isoString: string) => {
    if (!isoString) return;
    onChange({
      ...filter,
      timePreset: 'CUSTOM',
      startDateTime: type === 'start' ? new Date(isoString).toISOString() : filter.startDateTime,
      endDateTime: type === 'end' ? new Date(isoString).toISOString() : filter.endDateTime,
    });
  };

  const toLocalISO = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-[13px] font-bold text-slate-700">Filter Data Dashboard:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => {
            const isActive = filter.timePreset === p.value;
            return (
              <button
                key={p.value}
                onClick={() => selectPreset(p.value)}
                className={`px-3.5 py-1.5 rounded-xl text-[12px] font-extrabold transition-all border active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-[#001E36] text-white border-[#001E36] shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {showCustomPicker && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Mulai Dari
            </label>
            <input
              type="datetime-local"
              value={toLocalISO(filter.startDateTime)}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white text-[12px] font-semibold text-slate-700"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Sampai Dengan
            </label>
            <input
              type="datetime-local"
              value={toLocalISO(filter.endDateTime)}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50 focus:bg-white text-[12px] font-semibold text-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
