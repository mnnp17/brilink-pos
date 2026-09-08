'use client';

import React from 'react';
import { StaffUser, StaffRole, StaffStatus } from '../types/staff-master';
import { Shield, Key, Eye, ToggleLeft, ToggleRight, Check, X, FileText, Ban, Trash2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';

interface StaffCardProps {
  staff: StaffUser;
  onResetPin: (staff: StaffUser) => void;
  onEditPermissions: (staff: StaffUser) => void;
  onToggleStatus: (staff: StaffUser) => void;
  onViewLogs: (staff: StaffUser) => void;
  onDelete: (staff: StaffUser) => void;
}

export function StaffCard({
  staff,
  onResetPin,
  onEditPermissions,
  onToggleStatus,
  onViewLogs,
  onDelete,
}: StaffCardProps) {
  // Resolve role label
  const getRoleLabel = (role: StaffRole) => {
    switch (role) {
      case 'SENIOR_CASHIER': return 'Senior Kasir';
      case 'JUNIOR_CASHIER': return 'Junior Kasir';
      case 'TRAINEE': return 'Kasir Magang';
      default: return role;
    }
  };

  // Resolve role color badge
  const getRoleColor = (role: StaffRole) => {
    switch (role) {
      case 'SENIOR_CASHIER': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'JUNIOR_CASHIER': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'TRAINEE': return 'bg-slate-50 border-slate-200 text-slate-500';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  // Resolve status color badge
  const getStatusBadge = (status: StaffStatus) => {
    switch (status) {
      case 'ON_DUTY':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 ON DUTY</span>;
      case 'OFF_DUTY':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-50 text-slate-400 border border-slate-200">⚪ OFF DUTY</span>;
      case 'SUSPENDED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">🔴 SUSPENDED</span>;
      default:
        return null;
    }
  };

  // KPI Accuracy color rating
  const accuracy = staff.kpi.cashAccuracyPercentage;
  let accuracyClass = 'text-slate-700 bg-slate-50 border-slate-200';
  if (accuracy >= 98.0) {
    accuracyClass = 'text-emerald-600 bg-emerald-50/50 border-emerald-200';
  } else if (accuracy >= 95.0) {
    accuracyClass = 'text-amber-600 bg-amber-50/50 border-amber-200';
  } else {
    accuracyClass = 'text-rose-600 bg-rose-50/50 border-rose-200';
  }

  return (
    <div className={`rounded-3xl border p-5 shadow-xs flex flex-col justify-between min-h-[250px] transition-all font-sans relative ${
      staff.status === 'SUSPENDED'
        ? 'border-rose-300 bg-rose-50/5/10'
        : 'border-slate-200 hover:border-slate-300 bg-white'
    }`}>
      
      {/* Top Section Info */}
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${getRoleColor(staff.role)}`}>
            {getRoleLabel(staff.role)}
          </span>
          {getStatusBadge(staff.status)}
        </div>

        <div>
          <h3 className="font-extrabold text-[14px] text-slate-800 leading-tight truncate">
            {staff.fullName}
          </h3>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            {staff.username}@brilink.com • {staff.phone}
          </p>
        </div>
      </div>

      {/* Permissions List Grid */}
      <div className="py-2 border-t border-slate-100/70">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400">Hak Akses Sistem</span>
          <span className="text-[8px] font-bold text-blue-600">
            {[
              staff.permissions.canProcessPos,
              staff.permissions.canManageShift,
              staff.permissions.canRebalance,
              staff.permissions.canProcessExpense,
              staff.permissions.canViewHistory,
              staff.permissions.canReprintReceipt,
              staff.permissions.canVoidTransaction,
              staff.permissions.canApplyCustomDiscount,
            ].filter(Boolean).length}/8 Aktif
          </span>
        </div>
        <div className="flex flex-wrap gap-1 text-[9px] font-extrabold">
          <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border ${
            staff.permissions.canProcessPos ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
          }`}>
            POS
          </span>
          <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border ${
            staff.permissions.canManageShift ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
          }`}>
            Shift
          </span>
          <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border ${
            staff.permissions.canRebalance ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
          }`}>
            Rebalance
          </span>
          <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border ${
            staff.permissions.canProcessExpense ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
          }`}>
            OPEX
          </span>
          <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border ${
            staff.permissions.canViewHistory ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
          }`}>
            Riwayat
          </span>
          <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border ${
            staff.permissions.canVoidTransaction ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
          }`}>
            Void
          </span>
          <span className={`px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border ${
            staff.permissions.canApplyCustomDiscount ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
          }`}>
            Diskon
          </span>
        </div>
      </div>

      {/* KPI Stats & Aksi Buttons */}
      <div className="pt-3 border-t border-slate-100 space-y-3 shrink-0">
        <div className="grid grid-cols-2 gap-3 text-[10px]">
          {/* Accuracy KPI */}
          <div className={`p-2 rounded-xl border flex flex-col justify-center text-center ${accuracyClass}`}>
            <span className="text-[8px] font-black uppercase text-slate-400 block leading-none">Akurasi Kas</span>
            <span className="font-extrabold text-[12.5px] tabular-nums mt-1 block">
              {accuracy.toFixed(1)}%
            </span>
          </div>

          {/* Shifts KPI */}
          <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 flex flex-col justify-center text-center">
            <span className="text-[8px] font-black uppercase text-slate-400 block leading-none">Total Shift</span>
            <span className="font-bold text-[12.5px] tabular-nums mt-1 block">
              {staff.kpi.totalShiftCount} Shift
            </span>
          </div>
        </div>

        {/* Action button Grid toolbar */}
        <div className="grid grid-cols-5 gap-1 text-[9.5px] font-extrabold">
          <button
            onClick={() => onResetPin(staff)}
            title="Reset PIN Login"
            className="flex flex-col items-center justify-center py-1.5 px-0.5 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50/20 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <Key className="w-3.5 h-3.5 text-slate-400" />
            <span className="mt-0.5">PIN</span>
          </button>

          <button
            onClick={() => onEditPermissions(staff)}
            title="Kelola Hak Akses"
            className="flex flex-col items-center justify-center py-1.5 px-0.5 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/20 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span className="mt-0.5">Akses</span>
          </button>

          <button
            onClick={() => onToggleStatus(staff)}
            title={staff.status === 'SUSPENDED' ? 'Aktifkan Akun' : 'Suspend Akun (Kill-Switch)'}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 border transition-all cursor-pointer active:scale-95 rounded-xl ${
              staff.status === 'SUSPENDED'
                ? 'border-emerald-200 hover:bg-emerald-50/30 text-emerald-700 hover:border-emerald-300'
                : 'border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50/20'
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-slate-400" />
            <span className="mt-0.5">{staff.status === 'SUSPENDED' ? 'Active' : 'Ban'}</span>
          </button>

          <button
            onClick={() => onViewLogs(staff)}
            title="Buka Log Staf"
            className="flex flex-col items-center justify-center py-1.5 px-0.5 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="mt-0.5">Log</span>
          </button>

          <button
            onClick={() => onDelete(staff)}
            title="Hapus Karyawan"
            className="flex flex-col items-center justify-center py-1.5 px-0.5 border border-slate-200 hover:border-red-300 text-slate-500 hover:text-red-600 hover:bg-red-50/30 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="mt-0.5">Hapus</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}
