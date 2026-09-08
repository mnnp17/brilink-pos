'use client';

import React from 'react';
import { Plus, Search } from 'lucide-react';
import { StaffStatus } from '../types/staff-master';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface StaffToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onAddStaffClick: () => void;
}

export function StaffToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddStaffClick,
}: StaffToolbarProps) {
  return (
    <div className="bg-white p-3.5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 font-sans">
      {/* Search Input */}
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Cari nama staf atau username kasir..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-3 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] outline-none focus:bg-white focus:border-blue-400 text-slate-700 font-semibold"
        />
      </div>

      {/* Filter Dropdown */}
      <div className="flex gap-2 shrink-0">
        <CustomSelect
          label="Filter Status"
          value={statusFilter}
          onChange={(v) => onStatusFilterChange(v)}
          options={[
            { value: 'ALL', label: 'Semua Status' },
            { value: 'ON_DUTY', label: '🟢 On Duty' },
            { value: 'OFF_DUTY', label: '⚪ Off Duty' },
            { value: 'SUSPENDED', label: '🔴 Suspended' },
          ]}
        />

        {/* Add Staff Button */}
        <button
          onClick={onAddStaffClick}
          className="flex items-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-extrabold rounded-xl active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Staf</span>
        </button>
      </div>
    </div>
  );
}
