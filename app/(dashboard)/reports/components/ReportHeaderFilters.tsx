'use client';

import React, { useState } from 'react';
import { Calendar, ChevronDown, Download, Share2 } from 'lucide-react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ReportHeaderFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  comparePeriod: boolean;
  onComparePeriodChange: (compare: boolean) => void;
  onExportPDF: () => void;
  onShareWA: () => void;
}

export function ReportHeaderFilters({
  dateRange,
  onDateRangeChange,
  comparePeriod,
  onComparePeriodChange,
  onExportPDF,
  onShareWA,
}: ReportHeaderFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'CUSTOM'>('THIS_MONTH');

  const getPresetDates = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (preset === 'LAST_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (preset === 'THIS_QUARTER') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterStartMonth, 1);
      end = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const handlePresetSelect = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER') => {
    setActivePreset(preset);
    const range = getPresetDates(preset);
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const formatDateLabel = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPresetLabel = () => {
    if (activePreset === 'THIS_MONTH') return 'Bulan Ini';
    if (activePreset === 'LAST_MONTH') return 'Bulan Lalu';
    if (activePreset === 'THIS_QUARTER') return 'Kuartal Ini';
    return 'Custom';
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
      {/* Title & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[12px] font-bold transition-all"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{getPresetLabel()} ({formatDateLabel(dateRange.startDate)} - {formatDateLabel(dateRange.endDate)})</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20 overflow-hidden text-[12px]">
                <button
                  onClick={() => handlePresetSelect('THIS_MONTH')}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold ${
                    activePreset === 'THIS_MONTH' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  Bulan Ini
                </button>
                <button
                  onClick={() => handlePresetSelect('LAST_MONTH')}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold ${
                    activePreset === 'LAST_MONTH' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  Bulan Lalu
                </button>
                <button
                  onClick={() => handlePresetSelect('THIS_QUARTER')}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 font-semibold ${
                    activePreset === 'THIS_QUARTER' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  Kuartal Ini
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <div className="px-4 py-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                  Custom Tanggal
                </div>
                <div className="px-4 py-2 space-y-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">Mulai:</span>
                    <input
                      type="date"
                      value={dateRange.startDate.split('T')[0]}
                      onChange={(e) => {
                        setActivePreset('CUSTOM');
                        const start = new Date(e.target.value);
                        onDateRangeChange({
                          ...dateRange,
                          startDate: start.toISOString(),
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-700"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">Selesai:</span>
                    <input
                      type="date"
                      value={dateRange.endDate.split('T')[0]}
                      onChange={(e) => {
                        setActivePreset('CUSTOM');
                        const end = new Date(e.target.value);
                        end.setHours(23, 59, 59, 999);
                        onDateRangeChange({
                          ...dateRange,
                          endDate: end.toISOString(),
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Compare Period Toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              checked={comparePeriod}
              onChange={(e) => onComparePeriodChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </div>
          <span className="text-[12px] font-bold text-slate-600">⚖️ Bandingkan Periode Lalu</span>
        </label>
      </div>

      {/* Export Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExportPDF}
          className="flex items-center gap-2 py-2 px-3.5 bg-slate-800 hover:bg-slate-900 text-white text-[12px] font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor PDF</span>
        </button>
        <button
          onClick={onShareWA}
          className="flex items-center gap-2 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Kirim ke WA</span>
        </button>
      </div>
    </div>
  );
}
