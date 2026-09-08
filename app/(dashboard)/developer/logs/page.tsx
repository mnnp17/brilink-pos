'use client';

import React, { useState } from 'react';
import { ErrorStackTraceModal } from '../components/ErrorStackTraceModal';
import { Search, ShieldAlert, AlertTriangle, Info, Terminal, Eye } from 'lucide-react';
import type { SystemErrorLog } from '../types/developer';

const INITIAL_ERROR_LOGS: SystemErrorLog[] = [];


export default function ErrorLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [selectedError, setSelectedError] = useState<SystemErrorLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredErrors = INITIAL_ERROR_LOGS.filter((err) => {
    const matchesSeverity = severityFilter === 'ALL' ? true : err.severity === severityFilter;
    const matchesSearch = 
      err.id.includes(searchQuery) ||
      err.errorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      err.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (err.cashierId && err.cashierId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (err.shiftId && err.shiftId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (severity: 'CRITICAL' | 'WARNING' | 'INFO') => {
    switch (severity) {
      case 'CRITICAL':
        return {
          label: 'CRITICAL',
          classes: 'bg-rose-50 border-rose-200 text-rose-700 font-extrabold',
          icon: ShieldAlert,
        };
      case 'WARNING':
        return {
          label: 'WARNING',
          classes: 'bg-amber-50 border-amber-200 text-amber-700 font-extrabold',
          icon: AlertTriangle,
        };
      default:
        return {
          label: 'INFO',
          classes: 'bg-sky-50 border-sky-200 text-sky-700 font-bold',
          icon: Info,
        };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 font-sans">
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Log Sistem & Error</h1>
        <p className="text-[11px] text-slate-400 font-medium">Pelacakan error, stack trace, dan audit trail teknis berdasarkan tingkat keparahan</p>
      </div>

      {/* Main logs table container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Filter Controls Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-800 leading-tight">Crash Exception Registry</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Lacak urutan crash berdasarkan ID Kasir atau ID Shift tertentu</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Severity filter pills */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40">
              {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                    severityFilter === sev
                      ? 'bg-white shadow-sm text-rose-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Context Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari Kasir / Shift / ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 text-[11.5px] border border-slate-200 rounded-xl w-56 outline-none focus:ring-1 focus:ring-rose-400 focus:border-rose-400"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Exception</th>
                <th className="px-5 py-3">Message Summary</th>
                <th className="px-5 py-3 text-center">Cashier Context</th>
                <th className="px-5 py-3 text-center">Shift Context</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredErrors.map((err) => {
                const badge = getSeverityBadge(err.severity);
                return (
                  <tr key={err.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] border uppercase ${badge.classes}`}>
                        <badge.icon className="w-2.5 h-2.5 shrink-0" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500 tabular-nums">
                      {new Date(err.timestamp).toLocaleTimeString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-rose-600 font-bold">{err.errorName}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-700 truncate max-w-xs">{err.errorMessage}</td>
                    <td className="px-5 py-3.5 text-center font-mono text-slate-600">{err.cashierId ?? '-'}</td>
                    <td className="px-5 py-3.5 text-center font-mono text-slate-600">{err.shiftId ?? '-'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedError(err);
                          setIsModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg font-bold border border-slate-200 hover:border-rose-200 transition-all flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Trace
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredErrors.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-bold bg-white">
                    Tidak ditemukan data exception error log yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stack Trace Modal popup */}
      <ErrorStackTraceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedError(null);
        }}
        errorLog={selectedError}
      />
    </div>
  );
}
