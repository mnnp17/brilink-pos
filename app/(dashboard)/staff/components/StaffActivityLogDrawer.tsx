'use client';

import React from 'react';
import { StaffUser } from '../types/staff-master';
import { CashierActivityLog } from '@/types/activity-log';
import { X, FileText, Info } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';

interface StaffActivityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffUser | null;
  activityLogs: CashierActivityLog[];
}

export function StaffActivityLogDrawer({
  isOpen,
  onClose,
  staff,
  activityLogs,
}: StaffActivityLogDrawerProps) {
  if (!isOpen || !staff) return null;

  // Filter logs specifically for this staff member
  const filteredLogs = activityLogs
    .filter((log) => log.cashierId === staff.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Resolve Activity Type Label
  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'TRANSACTION': return 'POS Transaksi';
      case 'REBALANCE': return 'Rebalance';
      case 'SHIFT_START': return 'Shift Mulai';
      case 'SHIFT_END': return 'Shift Selesai';
      case 'EXPENSE_ADD': return 'OPEX Toko';
      case 'VOID_TRANSACTION': return 'Void';
      case 'ADMIN_OVERRIDE': return 'Admin Override';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[80vh] animate-fade-in">
        {/* Header */}
        <div className="bg-[#001E36] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-300" />
            <div>
              <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block">Audit Trail Staf</span>
              <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5 truncate max-w-[280px]">
                Log Aktivitas: {staff.fullName}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Selected staff detail info bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex justify-between items-center text-[10.5px] shrink-0 font-semibold text-slate-500">
          <span>Username: @{staff.username}</span>
          <span>Akurasi Kas: <strong className="text-slate-800">{staff.kpi.cashAccuracyPercentage.toFixed(1)}%</strong></span>
        </div>

        {/* Scrollable logs list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-1 text-center">
              <Info className="w-8 h-8 text-slate-300" />
              <p className="font-bold text-[12.5px]">Belum ada aktivitas terdaftar.</p>
              <p className="text-[10.5px] max-w-[280px]">Tindakan kasir ini pada modul POS, biaya OPEX, atau shift akan terekam otomatis di sini.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              // Badge color style
              let typeBadge = 'bg-slate-50 text-slate-600 border-slate-200';
              if (log.activityType === 'TRANSACTION') typeBadge = 'bg-blue-50 text-blue-600 border-blue-200/50';
              else if (log.activityType === 'REBALANCE') typeBadge = 'bg-indigo-50 text-indigo-600 border-indigo-200/50';
              else if (log.activityType === 'SHIFT_START' || log.activityType === 'SHIFT_END') typeBadge = 'bg-purple-50 text-purple-600 border-purple-200/50';
              else if (log.activityType === 'EXPENSE_ADD') typeBadge = 'bg-rose-50 text-rose-600 border-rose-200/50';
              else if (log.activityType === 'VOID_TRANSACTION') typeBadge = 'bg-amber-50 text-amber-600 border-amber-200/50';

              return (
                <div key={log.id} className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-1.5 hover:shadow-xs transition-shadow">
                  {/* Row 1: Timestamp & Badge */}
                  <div className="flex justify-between items-center text-[10.5px] font-semibold">
                    <span className="text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${typeBadge}`}>
                      {getActivityTypeLabel(log.activityType)}
                    </span>
                  </div>

                  {/* Row 2: Summary */}
                  <p className="text-[12px] font-black text-slate-800 leading-tight">
                    {log.summary}
                  </p>

                  {/* Row 3: Notes & Device */}
                  {log.notes && (
                    <p className="text-[11px] text-slate-500 font-medium italic">
                      "{log.notes}"
                    </p>
                  )}

                  {/* Row 4: Device log */}
                  <div className="pt-1.5 border-t border-slate-100/50 flex justify-between text-[9px] text-slate-400 font-semibold leading-none">
                    <span>ID: {log.id.replace('log-', '#LOG-')}</span>
                    <span className="font-mono">{log.deviceInfo || 'POS-TERMINAL-01 (192.168.1.15)'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-[12px] cursor-pointer"
          >
            Tutup Riwayat
          </button>
        </div>
      </div>
    </div>
  );
}
