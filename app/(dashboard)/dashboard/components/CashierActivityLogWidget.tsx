'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CashierActivityLog } from '@/types/activity-log';
import { ActivityDetailModal } from './ActivityDetailModal';
import { FullActivityLogModal } from './FullActivityLogModal';
import { RefreshCw, Eye, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getCashierActivityFeedAction } from '@/lib/actions/owner';
import { CustomSelect } from '@/components/ui/CustomSelect';

import { DashboardFilterState } from './DashboardTimeFilter';

export function CashierActivityLogWidget({ timeFilter }: { timeFilter?: DashboardFilterState }) {
  const [logs, setLogs] = useState<CashierActivityLog[]>([]);
  const [cashierFilter, setCashierFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<CashierActivityLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);

  const loadLogs = useCallback(async (showToast = false) => {
    try {
      const res = await getCashierActivityFeedAction(50, timeFilter?.startDateTime, timeFilter?.endDateTime);
      if (res.success && res.data) {
        setLogs(res.data as CashierActivityLog[]);
        if (showToast) toast.success('Log aktivitas kasir berhasil diperbarui!');
      }
    } catch (e) {
      // silently fail on background refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    setLoading(true);
    loadLogs();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => loadLogs(), 30_000);
    return () => clearInterval(interval);
  }, [loadLogs]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadLogs(true);
  };

  // Get unique list of cashier names for the dropdown
  const uniqueCashiers = Array.from(new Set(logs.map(l => l.cashierName)));

  // Filter logs logic
  const filteredLogs = logs.filter(l => {
    if (cashierFilter !== 'ALL' && l.cashierName !== cashierFilter) return false;
    if (typeFilter !== 'ALL' && l.activityType !== typeFilter) return false;
    return true;
  });

  const formatLogTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  };

  const handleOpenDetail = (log: CashierActivityLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  // Slice for preview widget (max 5 rows)
  const displayLogs = filteredLogs.slice(0, 5);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col font-sans">
      {/* Title Header */}
      <div className="bg-[#001E36] text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest block">Audit Trail Real-time</span>
          <h3 className="font-extrabold text-[14px] uppercase tracking-wider mt-0.5">
            Log Aktivitas Operasional Kasir (Real-time Feed)
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold text-slate-700">
          {/* Cashier Filter */}
          <CustomSelect
            label="Filter Kasir"
            value={cashierFilter}
            onChange={(v) => setCashierFilter(v)}
            minWidth="160px"
            options={[
              { value: 'ALL', label: 'Semua Kasir' },
              ...uniqueCashiers.map((c) => ({ value: c, label: c })),
            ]}
          />

          {/* Activity Type Filter */}
          <CustomSelect
            label="Tipe Aktivitas"
            value={typeFilter}
            onChange={(v) => setTypeFilter(v)}
            minWidth="200px"
            options={[
              { value: 'ALL', label: 'Semua Aktivitas' },
              { value: 'TRANSACTION', label: 'Transaksi' },
              { value: 'REBALANCE', label: 'Pindah Saldo (Rebalance)' },
              { value: 'SHIFT_START', label: 'Shift Start' },
              { value: 'SHIFT_END', label: 'Shift End' },
              { value: 'EXPENSE_ADD', label: 'Pengeluaran OPEX' },
              { value: 'VOID_TRANSACTION', label: 'Void Transaksi' },
              { value: 'ADMIN_OVERRIDE', label: 'Admin Override' },
            ]}
          />

          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-white text-[#001E36] hover:bg-slate-100 font-extrabold rounded-xl transition-all cursor-pointer text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>

          {/* Open Full Modal Button */}
          <button
            onClick={() => setIsFullModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all cursor-pointer text-[11px] shadow-2xs active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Semua ({filteredLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Logs Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="px-5 py-3 w-28">Waktu</th>
              <th className="px-5 py-3 w-40">Kasir</th>
              <th className="px-5 py-3 w-44">Tipe Aktivitas</th>
              <th className="px-5 py-3">Ringkasan Detail</th>
              <th className="px-5 py-3 text-center w-24">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-bold">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    <span>Memuat data dari database...</span>
                  </div>
                </td>
              </tr>
            ) : displayLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-bold">
                  Belum ada log aktivitas terdaftar untuk filter ini.
                </td>
              </tr>
            ) : (
              displayLogs.map((log) => {
                // Determine Badge Style
                let typeBadge = 'bg-slate-50 border-slate-200 text-slate-700';
                if (log.activityType === 'TRANSACTION') typeBadge = 'bg-blue-50 border-blue-200 text-blue-700';
                else if (log.activityType === 'REBALANCE') typeBadge = 'bg-indigo-50 border-indigo-200 text-indigo-700';
                else if (log.activityType === 'SHIFT_START' || log.activityType === 'SHIFT_END') typeBadge = 'bg-purple-50 border-purple-200 text-purple-700';
                else if (log.activityType === 'EXPENSE_ADD') typeBadge = 'bg-rose-50 border-rose-200 text-rose-700';
                else if (log.activityType === 'VOID_TRANSACTION') typeBadge = 'bg-amber-50 border-amber-200 text-amber-700';
                else if (log.activityType === 'ADMIN_OVERRIDE') typeBadge = 'bg-cyan-50 border-cyan-200 text-cyan-700';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                    {/* Waktu */}
                    <td className="px-5 py-3.5 font-mono text-slate-500 font-bold">
                      {formatLogTime(log.timestamp)}
                    </td>

                    {/* Kasir Name */}
                    <td className="px-5 py-3.5 text-slate-800">
                      <p className="font-bold leading-tight">{log.cashierName}</p>
                      <span className="text-[9.5px] text-slate-400 uppercase font-mono block mt-0.5">{log.cashierId ? log.cashierId.slice(0, 8) : '-'}</span>
                    </td>

                    {/* Tipe Badge */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9.5px] font-extrabold uppercase border ${typeBadge}`}>
                        {log.title.replace(/[^\p{L}\p{N}\s]/gu, '').trim()}
                      </span>
                    </td>

                    {/* Ringkasan */}
                    <td className="px-5 py-3.5 text-slate-700 font-bold max-w-sm md:max-w-md truncate">
                      {log.summary}
                    </td>

                    {/* Detail button */}
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleOpenDetail(log)}
                        className="inline-flex items-center gap-1 py-1.5 px-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-[11px] font-bold text-slate-600 transition-all hover:bg-slate-100 cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Cek</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Widget Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11.5px] font-semibold text-slate-500">
        <span>
          Menampilkan <strong className="text-slate-800">{displayLogs.length}</strong> dari <strong className="text-slate-800">{filteredLogs.length}</strong> aktivitas terbaru.
        </span>
        <button
          onClick={() => setIsFullModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:border-blue-600 hover:text-blue-600 rounded-xl font-bold text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <span>Buka Log Lengkap & Filter Kustom</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Audit Detail Modal Dialog */}
      <ActivityDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLog(null);
        }}
        log={selectedLog}
      />

      {/* Full Activity Log Modal with Custom Date & Staff Filters */}
      <FullActivityLogModal
        isOpen={isFullModalOpen}
        onClose={() => setIsFullModalOpen(false)}
      />
    </div>
  );
}
