'use client';

import React, { useEffect } from 'react';
import { QuickTimePreset, TransactionFilterState } from '@/types/owner-transaction';
import { Calendar, Clock, SlidersHorizontal, User, Wallet, Settings, ShieldAlert } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface TimeFilterBarProps {
  filter: TransactionFilterState;
  onChange: (filter: TransactionFilterState) => void;
}

const PRESETS: { value: QuickTimePreset; label: string }[] = [
  { value: 'TODAY', label: 'Hari Ini' },
  { value: 'ACTIVE_SHIFT', label: 'Shift Aktif' },
  { value: 'YESTERDAY', label: 'Kemarin' },
  { value: 'LAST_7_DAYS', label: '7 Hari' },
  { value: 'THIS_MONTH', label: 'Bulan Ini' },
];

export function TimeFilterBar({ filter, onChange }: TimeFilterBarProps) {
  // Update Date & Time based on preset selection
  const selectPreset = (preset: QuickTimePreset) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    const formatDateLocal = (d: Date) => {
      // Return YYYY-MM-DDTHH:mm formatted for datetime-local inputs
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    switch (preset) {
      case 'TODAY':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'ACTIVE_SHIFT':
        // Active shift e.g. 08:00 to 16:00 today
        start.setHours(8, 0, 0, 0);
        end.setHours(16, 0, 0, 0);
        break;
      case 'YESTERDAY':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
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
        return; // For custom, let users choose
    }

    onChange({
      ...filter,
      timePreset: preset,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
    });
  };

  // Convert ISO string back to local datetime-local value (YYYY-MM-DDTHH:MM)
  const toLocalISO = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const tzOffset = d.getTimezoneOffset() * 60000; // in ms
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  return (
    <div className="bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
      
      {/* ── Quick Time Presets & Granular Range Picker ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        {/* Preset Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => {
            const isActive = filter.timePreset === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => selectPreset(p.value)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all border active:scale-95 cursor-pointer ${
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

        {/* Granular Date-Time Picker */}
        <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px] font-bold">
          <div className="relative flex items-center">
            <Calendar className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="datetime-local"
              value={toLocalISO(filter.startDateTime)}
              onChange={(e) => {
                const val = e.target.value;
                onChange({
                  ...filter,
                  timePreset: 'CUSTOM',
                  startDateTime: val ? new Date(val).toISOString() : '',
                });
              }}
              className="pl-8 pr-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl outline-none focus:bg-white text-[11px] font-bold text-slate-700"
            />
          </div>
          <span className="text-slate-400">s/d</span>
          <div className="relative flex items-center">
            <Clock className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="datetime-local"
              value={toLocalISO(filter.endDateTime)}
              onChange={(e) => {
                const val = e.target.value;
                onChange({
                  ...filter,
                  timePreset: 'CUSTOM',
                  endDateTime: val ? new Date(val).toISOString() : '',
                });
              }}
              className="pl-8 pr-2.5 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl outline-none focus:bg-white text-[11px] font-bold text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* ── Secondary Multi-parametric Dropdowns ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Cashier Selector */}
        <div className="space-y-1">
          <CustomSelect
            label="Kasir"
            icon={<User className="w-3.5 h-3.5" />}
            value={filter.cashierId || 'ALL'}
            onChange={(v) => onChange({ ...filter, cashierId: v === 'ALL' ? undefined : v })}
            minWidth="100%"
            options={[
              { value: 'ALL', label: 'Semua Kasir' },
              { value: 'Astri', label: 'Astri (Karyawan 01)' },
              { value: 'Rudi', label: 'Rudi (Karyawan 02)' },
              { value: 'Dewi', label: 'Dewi (Karyawan 03)' },
            ]}
          />
        </div>

        {/* EDC / Account Selector */}
        <div className="space-y-1">
          <CustomSelect
            label="EDC / Rekening"
            icon={<Wallet className="w-3.5 h-3.5" />}
            value={filter.accountId || 'ALL'}
            onChange={(v) => onChange({ ...filter, accountId: v === 'ALL' ? undefined : v })}
            minWidth="100%"
            options={[
              { value: 'ALL', label: 'Semua EDC/Rekening' },
              { value: 'EDC BRI Utama', label: 'EDC BRI Utama' },
              { value: 'EDC BRILink Kios', label: 'EDC BRILink Kios' },
              { value: 'Rekening Mandiri 02', label: 'Rekening Mandiri 02' },
            ]}
          />
        </div>

        {/* Service Selector */}
        <div className="space-y-1">
          <CustomSelect
            label="Jenis Layanan"
            icon={<Settings className="w-3.5 h-3.5" />}
            value={filter.serviceId || 'ALL'}
            onChange={(v) => onChange({ ...filter, serviceId: v === 'ALL' ? undefined : v })}
            minWidth="100%"
            options={[
              { value: 'ALL', label: 'Semua Layanan' },
              { value: 'Tarik Tunai EDC', label: 'Tarik Tunai EDC' },
              { value: 'Setor Tunai', label: 'Setor Tunai' },
              { value: 'Transfer Bank Lain', label: 'Transfer Bank Lain' },
              { value: 'Bayar Token Listrik', label: 'Bayar Token Listrik' },
            ]}
          />
        </div>

        {/* Margin / Anomaly Selector */}
        <div className="space-y-1">
          <CustomSelect
            label="Status Margin"
            icon={<ShieldAlert className="w-3.5 h-3.5" />}
            value={filter.marginStatus || 'ALL'}
            onChange={(v) => onChange({ ...filter, marginStatus: v as any })}
            minWidth="100%"
            options={[
              { value: 'ALL', label: 'Semua Margin' },
              { value: 'NORMAL', label: 'Normal (Profit > 0)' },
              { value: 'ANOMALY', label: 'Anomali (Profit ≤ 0)' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
