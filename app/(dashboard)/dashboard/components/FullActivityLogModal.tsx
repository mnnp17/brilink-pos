'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CashierActivityLog } from '@/types/activity-log';
import { ActivityDetailModal } from './ActivityDetailModal';
import { getCashierActivityFeedAction } from '@/lib/actions/owner';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { 
  X, 
  Search, 
  Calendar, 
  RefreshCw, 
  Eye, 
  ShieldCheck, 
  ChevronLeft,
  ChevronRight,
  User,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

interface FullActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TimePreset = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'CUSTOM';


export function FullActivityLogModal({ isOpen, onClose }: FullActivityLogModalProps) {
  const [logs, setLogs] = useState<CashierActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [timePreset, setTimePreset] = useState<TimePreset>('TODAY');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCashier, setSelectedCashier] = useState('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<CashierActivityLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Compute ISO dates based on preset
  const dateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (timePreset === 'TODAY') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timePreset === 'YESTERDAY') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (timePreset === 'LAST_7_DAYS') {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timePreset === 'LAST_30_DAYS') {
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timePreset === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (timePreset === 'CUSTOM') {
      if (customStartDate) {
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
      }
      if (customEndDate) {
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
      }
    }

    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }, [timePreset, customStartDate, customEndDate]);

  // Fetch logs from server
  const fetchLogs = async (showToast = false) => {
    setLoading(true);
    try {
      const res = await getCashierActivityFeedAction(200, dateRange.startIso, dateRange.endIso);
      if (res.success && res.data) {
        setLogs(res.data as CashierActivityLog[]);
        if (showToast) toast.success('Histori log audit berhasil dimuat ulang!');
      } else {
        toast.error(res.error || 'Gagal memuat log aktivitas');
      }
    } catch (e: any) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      setCurrentPage(1);
    }
  }, [isOpen, dateRange]);

  // Unique cashiers for filter dropdown
  const uniqueCashiers = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.cashierName).filter(Boolean)));
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Cashier filter
      if (selectedCashier !== 'ALL' && log.cashierName !== selectedCashier) return false;

      // Activity type filter
      if (selectedType !== 'ALL' && log.activityType !== selectedType) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = log.title?.toLowerCase().includes(q);
        const matchSummary = log.summary?.toLowerCase().includes(q);
        const matchCashier = log.cashierName?.toLowerCase().includes(q);
        const matchNotes = log.notes?.toLowerCase().includes(q);
        const matchId = log.id?.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchCashier && !matchNotes && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedCashier, selectedType, searchQuery]);

  // Pagination slice
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Quick stats
  const stats = useMemo(() => {
    let txCount = 0;
    let rebCount = 0;
    let shiftCount = 0;
    let expCount = 0;

    filteredLogs.forEach((l) => {
      if (l.activityType === 'TRANSACTION') txCount++;
      else if (l.activityType === 'REBALANCE') rebCount++;
      else if (l.activityType === 'SHIFT_START' || l.activityType === 'SHIFT_END') shiftCount++;
      else if (l.activityType === 'EXPENSE_ADD') expCount++;
    });

    return { total: filteredLogs.length, txCount, rebCount, shiftCount, expCount };
  }, [filteredLogs]);

  if (!isOpen) return null;

  const formatFullDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { date: '-', time: '-' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fade-in font-sans">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-6xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10">
        {/* Header Modal */}
        <div className="bg-[#001E36] text-white px-5 pt-4 pb-4 shrink-0 border-b border-slate-700/50">
          {/* Single row: icon + title block + action buttons */}
          <div className="flex items-start gap-3">
            {/* Shield Icon — shrink-0 so it never collapses */}
            <div className="shrink-0 mt-0.5 w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>

            {/* Title Block — flex-1 so it takes available space, allows wrapping */}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">
                Audit Trail Lengkap
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-[14px] leading-snug">
                  Log Audit &amp; Histori Operasional Kasir
                </h3>
                <span className="shrink-0 bg-white text-[#001E36] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full leading-none">
                  {stats.total} Aktivitas
                </span>
              </div>
            </div>

            {/* Action Buttons — shrink-0, always visible, pinned to the right */}
            <div className="shrink-0 flex items-center gap-1 mt-0.5">
              <button
                onClick={() => {
                  setRefreshing(true);
                  fetchLogs(true);
                }}
                disabled={loading || refreshing}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white transition-all cursor-pointer disabled:opacity-40 border border-white/10"
                title="Segarkan Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-white transition-all cursor-pointer border border-white/10"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 pt-5 pb-4 space-y-4 shrink-0">
          <div className="flex flex-wrap items-end gap-3">

            {/* Rentang Waktu */}
            <CustomSelect
              label="Rentang Waktu"
              value={timePreset}
              onChange={(v) => setTimePreset(v as TimePreset)}
              icon={<Calendar className="w-3.5 h-3.5" />}
              minWidth="185px"
              options={[
                { value: 'TODAY', label: 'Hari Ini (Real-time)' },
                { value: 'YESTERDAY', label: 'Kemarin' },
                { value: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
                { value: 'LAST_30_DAYS', label: '30 Hari Terakhir' },
                { value: 'THIS_MONTH', label: 'Bulan Ini' },
                { value: 'CUSTOM', label: 'Rentang Kustom...' },
              ]}
            />

            {/* Staf Kasir */}
            <CustomSelect
              label="Staf Kasir"
              value={selectedCashier}
              onChange={(v) => { setSelectedCashier(v); setCurrentPage(1); }}
              icon={<User className="w-3.5 h-3.5" />}
              minWidth="165px"
              options={[
                { value: 'ALL', label: 'Semua Staf Kasir' },
                ...uniqueCashiers.map(c => ({ value: c, label: c })),
              ]}
            />

            {/* Tipe Aktivitas */}
            <CustomSelect
              label="Tipe Aktivitas"
              value={selectedType}
              onChange={(v) => { setSelectedType(v); setCurrentPage(1); }}
              icon={<Layers className="w-3.5 h-3.5" />}
              minWidth="180px"
              options={[
                { value: 'ALL', label: 'Semua Tipe Aktivitas' },
                { value: 'TRANSACTION', label: 'Transaksi Kasir' },
                { value: 'REBALANCE', label: 'Pindah Saldo (Rebalance)' },
                { value: 'SHIFT_START', label: 'Pembukaan Shift' },
                { value: 'SHIFT_END', label: 'Penutupan Shift' },
                { value: 'EXPENSE_ADD', label: 'Pengeluaran OPEX' },
              ]}
            />

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <label className={`absolute left-3 transition-all duration-200 pointer-events-none font-semibold z-10 select-none
                ${searchQuery !== '' ? '-top-2 text-[10px] bg-white px-1 text-blue-600' : 'top-2.5 text-[12px] text-slate-400'}
              `}>
                Cari transaksi, kasir, nominal...
              </label>
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 pt-3.5 pb-1.5 pr-9 text-[12.5px] font-semibold text-slate-800 outline-none
                  focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 transition-all duration-200"
              />
            </div>

          </div>

          {/* Custom Date Pickers — shown when CUSTOM selected */}
          {timePreset === 'CUSTOM' && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[12px] font-semibold w-fit">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="outline-none bg-transparent text-slate-700 font-bold text-[11.5px] cursor-pointer"
              />
              <span className="text-slate-400 font-bold">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="outline-none bg-transparent text-slate-700 font-bold text-[11.5px] cursor-pointer"
              />
            </div>
          )}


          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9.5px]">Ringkasan:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 font-bold">
              Transaksi: {stats.txCount}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-bold">
              Rebalance: {stats.rebCount}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 font-bold">
              Shift: {stats.shiftCount}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/60 font-bold">
              Pengeluaran: {stats.expCount}
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto min-h-[350px]">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] sticky top-0 z-10 backdrop-blur-xs">
                <th className="px-5 py-3 w-32">Waktu</th>
                <th className="px-5 py-3 w-40">Staf Kasir</th>
                <th className="px-5 py-3 w-44">Tipe Aktivitas</th>
                <th className="px-5 py-3">Ringkasan & Mutasi</th>
                <th className="px-5 py-3 w-48">Catatan / Terminal</th>
                <th className="px-5 py-3 text-center w-24">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-400 font-bold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      <span>Mengambil riwayat log audit dari database...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-400 font-bold">
                    Tidak ada aktivitas operasional yang cocok dengan kriteria filter waktu / pencarian ini.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const { date, time } = formatFullDate(log.timestamp);

                  let typeBadge = 'bg-slate-50 border-slate-200 text-slate-700';
                  if (log.activityType === 'TRANSACTION') typeBadge = 'bg-blue-50 border-blue-200 text-blue-700';
                  else if (log.activityType === 'REBALANCE') typeBadge = 'bg-indigo-50 border-indigo-200 text-indigo-700';
                  else if (log.activityType === 'SHIFT_START' || log.activityType === 'SHIFT_END')
                    typeBadge = 'bg-purple-50 border-purple-200 text-purple-700';
                  else if (log.activityType === 'EXPENSE_ADD') typeBadge = 'bg-rose-50 border-rose-200 text-rose-700';

                  return (
                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Waktu */}
                      <td className="px-5 py-3 font-mono">
                        <span className="font-extrabold text-slate-800 block text-[11.5px]">{time}</span>
                        <span className="text-[10px] text-slate-400">{date}</span>
                      </td>

                      {/* Kasir */}
                      <td className="px-5 py-3">
                        <p className="font-extrabold text-slate-900 leading-tight">{log.cashierName}</p>
                        <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">
                          ID: {log.cashierId ? log.cashierId.slice(0, 8) : '-'}
                        </span>
                      </td>

                      {/* Tipe */}
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${typeBadge}`}
                        >
                          {log.title.replace(/[^\p{L}\p{N}\s]/gu, '').trim()}
                        </span>
                      </td>

                      {/* Ringkasan */}
                      <td className="px-5 py-3">
                        <p className="font-bold text-slate-800">{log.summary}</p>
                        {log.shiftId && log.shiftId !== '-' && (
                          <span className="text-[9.5px] text-slate-400 font-mono">
                            Shift: #{log.shiftId.slice(0, 8)}
                          </span>
                        )}
                      </td>

                      {/* Catatan / Terminal */}
                      <td className="px-5 py-3 text-slate-500 text-[11px]">
                        <p className="truncate max-w-[180px] italic">{log.notes || 'Normal'}</p>
                        <span className="text-[9px] text-slate-400 font-mono uppercase block mt-0.5">
                          {log.deviceInfo || 'Terminal POS'}
                        </span>
                      </td>

                      {/* Detail CTA */}
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setIsDetailOpen(true);
                          }}
                          className="inline-flex items-center gap-1 py-1.5 px-3 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-xl text-[11px] font-bold text-slate-700 transition-all hover:bg-blue-50 cursor-pointer shadow-2xs active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer / Pagination */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[12px] text-slate-500 font-semibold">
            Menampilkan <span className="font-bold text-slate-800">{paginatedLogs.length}</span> dari{' '}
            <span className="font-bold text-slate-800">{filteredLogs.length}</span> aktivitas (Halaman {currentPage}{' '}
            dari {totalPages})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub Detail Audit Modal */}
      <ActivityDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLog(null);
        }}
        log={selectedLog}
      />
    </div>
  );
}
