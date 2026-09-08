'use client';

import React from 'react';
import { X, Copy, ShieldAlert, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import type { SystemErrorLog } from '../types/developer';

interface ErrorStackTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorLog: SystemErrorLog | null;
}

export function ErrorStackTraceModal({ isOpen, onClose, errorLog }: ErrorStackTraceModalProps) {
  if (!isOpen || !errorLog) return null;

  const handleCopyTrace = () => {
    const formatted = `Error: ${errorLog.errorName}\nMessage: ${errorLog.errorMessage}\nSeverity: ${errorLog.severity}\nRoute: ${errorLog.route}\nTimestamp: ${errorLog.timestamp}\n\nStack Trace:\n${errorLog.stackTrace}`;
    navigator.clipboard.writeText(formatted);
    toast.success('Stack trace copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-rose-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-700">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <h3 className="text-[14px] font-black uppercase tracking-wide leading-tight">Crash Stack Trace Viewer</h3>
              <p className="text-[10px] text-rose-500 font-mono mt-0.5">{errorLog.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-100 hover:text-rose-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px]">
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Error Name</span>
              <p className="font-extrabold text-rose-600 truncate">{errorLog.errorName}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Severity</span>
              <span className="font-black text-rose-600 block uppercase text-[11px] leading-tight">
                🔴 {errorLog.severity}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Trigger Route</span>
              <p className="font-mono text-slate-800 break-all">{errorLog.route}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Timestamp</span>
              <p className="text-slate-800 font-medium">{new Date(errorLog.timestamp).toLocaleString('id-ID')}</p>
            </div>
            {errorLog.cashierId && (
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Cashier Context</span>
                <p className="text-slate-800 font-mono truncate">{errorLog.cashierId}</p>
              </div>
            )}
            {errorLog.shiftId && (
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Shift Context</span>
                <p className="text-slate-800 font-mono truncate">{errorLog.shiftId}</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-[12px] font-semibold text-rose-950">
            {errorLog.errorMessage}
          </div>

          {/* Trace Code */}
          <div className="space-y-2 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                Variable Context & Stack Trace
              </span>
              <button
                onClick={handleCopyTrace}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Stack Trace
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-x-auto overflow-y-auto flex-1 font-mono text-[11px] text-rose-400 leading-normal max-h-[300px]">
              <pre className="whitespace-pre-wrap">{errorLog.stackTrace}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[12px] font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl transition-all"
          >
            Tutup Trace
          </button>
        </div>
      </div>
    </div>
  );
}
