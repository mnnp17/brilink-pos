'use client';

import React from 'react';
import { StaffUser } from '../types/staff-master';
import { Users, UserCheck, Percent } from 'lucide-react';

interface StaffHeaderProps {
  staffList: StaffUser[];
}

export function StaffHeader({ staffList }: StaffHeaderProps) {
  const totalStaff = staffList.length;
  const onDutyCount = staffList.filter(s => s.status === 'ON_DUTY').length;

  // Calculate Average Cash Accuracy for active staff with some shift history
  const staffWithShifts = staffList.filter(s => s.kpi.totalShiftCount > 0);
  const avgAccuracy = staffWithShifts.length > 0
    ? staffWithShifts.reduce((sum, s) => sum + s.kpi.cashAccuracyPercentage, 0) / staffWithShifts.length
    : 100.0;

  // Accuracy color rating
  let accuracyColor = 'text-slate-800';
  let accuracyBg = 'bg-slate-100 border-slate-200';
  if (avgAccuracy >= 98.0) {
    accuracyColor = 'text-emerald-700';
    accuracyBg = 'bg-emerald-50 border-emerald-200';
  } else if (avgAccuracy >= 95.0) {
    accuracyColor = 'text-amber-700';
    accuracyBg = 'bg-amber-50 border-amber-200';
  } else {
    accuracyColor = 'text-rose-700';
    accuracyBg = 'bg-rose-50 border-rose-200';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
      {/* Total Staff */}
      <div className="bg-[#001E36] text-white rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
        <div className="absolute right-4 top-4 text-white/5 text-[54px] font-black pointer-events-none">👥</div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">Total Staf Kasir</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h2 className="text-[22px] font-black leading-tight tabular-nums">
            {totalStaff} Orang
          </h2>
          <p className="text-[10.5px] text-blue-200 mt-1">Staf terdaftar aktif pada database outlet</p>
        </div>
      </div>

      {/* On Duty Staf */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex justify-between items-center pb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kasir Aktif (On-Duty)</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-[20px] font-black text-slate-800 tabular-nums">
            {onDutyCount} Staf
          </h3>
          <p className="text-[10.5px] text-slate-400 leading-tight font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Sedang bertugas membuka shift laci saat ini
          </p>
        </div>
      </div>

      {/* Average Accuracy Rating */}
      <div className={`rounded-3xl border p-5 shadow-xs flex items-center gap-4 transition-colors ${accuracyBg}`}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-white border border-slate-100">
          <Percent className={`w-5 h-5 ${accuracyColor}`} />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block leading-none">Rerata Akurasi Kas</span>
          <h3 className={`text-[19px] font-black tabular-nums leading-tight ${accuracyColor}`}>
            {avgAccuracy.toFixed(1)}%
          </h3>
          <p className="text-[10.5px] text-slate-500 leading-tight font-semibold">
            Rating ketepatan rekonsiliasi kas laci
          </p>
        </div>
      </div>
    </div>
  );
}
