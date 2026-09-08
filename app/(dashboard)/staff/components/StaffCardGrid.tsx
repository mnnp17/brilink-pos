'use client';

import React from 'react';
import { StaffUser } from '../types/staff-master';
import { StaffCard } from './StaffCard';

interface StaffCardGridProps {
  staffList: StaffUser[];
  searchQuery: string;
  statusFilter: string;
  onResetPin: (staff: StaffUser) => void;
  onEditPermissions: (staff: StaffUser) => void;
  onToggleStatus: (staff: StaffUser) => void;
  onViewLogs: (staff: StaffUser) => void;
  onDelete: (staff: StaffUser) => void;
}

export function StaffCardGrid({
  staffList,
  searchQuery,
  statusFilter,
  onResetPin,
  onEditPermissions,
  onToggleStatus,
  onViewLogs,
  onDelete,
}: StaffCardGridProps) {
  // Filter list
  const filteredList = staffList.filter((staff) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = staff.fullName.toLowerCase().includes(q);
      const matchUsername = staff.username.toLowerCase().includes(q);
      const matchPhone = staff.phone.includes(q);
      if (!matchName && !matchUsername && !matchPhone) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL' && staff.status !== statusFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredList.length === 0 ? (
        <div className="col-span-full py-16 text-center text-slate-400 font-bold bg-white border border-slate-200 rounded-3xl">
          Tidak ditemukan data staf yang cocok dengan kriteria filter.
        </div>
      ) : (
        filteredList.map((staff) => (
          <StaffCard
            key={staff.id}
            staff={staff}
            onResetPin={onResetPin}
            onEditPermissions={onEditPermissions}
            onToggleStatus={onToggleStatus}
            onViewLogs={onViewLogs}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
