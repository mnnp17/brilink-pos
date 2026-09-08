'use client';

import React from 'react';
import { X, ShieldAlert, UserCheck } from 'lucide-react';
import type { ActiveUserSession } from '../types/developer';

interface ImpersonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ActiveUserSession | null;
  onConfirm: (session: ActiveUserSession) => void;
}

export function ImpersonationModal({ isOpen, onClose, session, onConfirm }: ImpersonationModalProps) {
  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-800">
            <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" />
            <div>
              <h3 className="text-[14px] font-black uppercase tracking-wide leading-tight">Mulai Impersonasi User</h3>
              <p className="text-[10px] text-amber-600 font-medium">Sesi Penyamaran Pengembang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-100 hover:text-amber-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-[12px] text-slate-600 leading-relaxed">
            Anda akan melakukan penyamaran peran (impersonation) sebagai user berikut:
          </p>

          {/* User card summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#001E36] text-white flex items-center justify-center font-black text-sm shrink-0">
              {session.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-bold text-slate-800 truncate">{session.fullName}</h4>
              <p className="text-[11px] text-slate-400 font-mono">@{session.username} • {session.role}</p>
            </div>
          </div>

          {/* Warning notice */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 text-[11px] text-amber-800 space-y-1.5 leading-relaxed">
            <p className="font-extrabold flex items-center gap-1">
              <span>⚠️</span> PERINGATAN KEAMANAN:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Seluruh tindakan transaksi/void atas nama user ini akan dicatat dalam Audit Log sebagai tindakan diimpersonasi oleh Developer.</li>
              <li>Sesi developer Anda akan disimpan sementara untuk mempermudah pengembalian sesi.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-[12px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(session)}
            className="px-4 py-2.5 text-[12px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-amber-500/35 active:scale-98"
          >
            <UserCheck className="w-4 h-4" />
            Mulai Menyamar
          </button>
        </div>
      </div>
    </div>
  );
}
