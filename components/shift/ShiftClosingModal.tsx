'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, Printer, AlertTriangle, Calculator, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { formatRupiah, formatDateTime } from '@/lib/utils/format';
import type { ShiftSession, DenominationState } from '@/lib/types/shift';
import { SettlementReceipt } from './SettlementReceipt';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { useActiveShift, useShiftSummary } from '@/lib/hooks/useShift';
import { closeShift } from '@/lib/actions/shift.actions';

interface ShiftClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Fallback / mock default session if not provided
  initialSession?: ShiftSession;
}

const DEFAULT_MOCK_SESSION: ShiftSession = {
  id: 'shift-mock-123',
  cashierName: 'Ahmad Gozali',
  clockInAt: new Date(Date.now() - 8 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(), // 8 Jam 15 Menit yang lalu
  clockOutAt: new Date().toISOString(),
  openingCash: 500000,
  totalCashIn: 2450000,
  totalCashOut: 1200000,
  expectedCash: 1750000, // 500k + 2.45jt - 1.2jt = 1.75jt
};

export function ShiftClosingModal({ isOpen, onClose, initialSession }: ShiftClosingModalProps) {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [clockOutTime] = useState(() => new Date());

  const { data: activeShift, isLoading: isLoadingShift } = useActiveShift(profile?.id);
  const { data: summary, isLoading: isLoadingSummary } = useShiftSummary(activeShift?.id);

  const session = useMemo(() => {
    if (initialSession) return initialSession;
    if (!activeShift || !summary) {
      return {
        ...DEFAULT_MOCK_SESSION,
        clockOutAt: clockOutTime.toISOString()
      };
    }
    return {
      id: activeShift.id,
      cashierName: activeShift.kasir_name,
      clockInAt: activeShift.opened_at,
      clockOutAt: clockOutTime.toISOString(),
      openingCash: activeShift.opening_cash,
      totalCashIn: summary.totalCashIn,
      totalCashOut: summary.totalCashOut,
      expectedCash: summary.expectedCash,
    };
  }, [initialSession, activeShift, summary, clockOutTime]);

  const isLoading = !initialSession && (isLoadingShift || (activeShift && isLoadingSummary));

  // Calculating Shift Duration
  const durationText = useMemo(() => {
    const start = new Date(session.clockInAt);
    const end = clockOutTime;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return '0 Menit';
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours} Jam ${mins} Menit` : `${mins} Menit`;
  }, [session.clockInAt, clockOutTime]);

  // Tab Toggle Mode for Cash Opname
  const [opnameMode, setOpnameMode] = useState<'DIRECT' | 'DENOMINATION'>('DIRECT');

  // Direct Mode State
  const [directPhysicalCash, setDirectPhysicalCash] = useState<number>(0);

  // Denomination Mode State
  const [denominations, setDenominations] = useState<DenominationState>({
    d100k: 0,
    d50k: 0,
    d20k: 0,
    d10k: 0,
    d5k: 0,
    d2k: 0,
    d1k: 0,
  });

  // Calculate actual cash from denominations
  const denominationTotal = useMemo(() => {
    return (
      denominations.d100k * 100000 +
      denominations.d50k * 50000 +
      denominations.d20k * 20000 +
      denominations.d10k * 10000 +
      denominations.d5k * 5000 +
      denominations.d2k * 2000 +
      denominations.d1k * 1000
    );
  }, [denominations]);

  // Actual cash in drawer based on selected mode
  const actualPhysicalCash = opnameMode === 'DIRECT' ? directPhysicalCash : denominationTotal;

  // Variance & Status
  const variance = actualPhysicalCash - session.expectedCash;

  const statusType = useMemo(() => {
    if (variance === 0) return 'MATCH';
    if (variance < 0) return 'MINUS';
    return 'PLUS';
  }, [variance]);

  const statusLabel = useMemo(() => {
    if (statusType === 'MATCH') return '🟢 MATCH (Sesuai)';
    if (statusType === 'MINUS') return `🔴 MINUS (${formatRupiah(Math.abs(variance))})`;
    return `🟡 PLUS (${formatRupiah(variance)})`;
  }, [statusType, variance]);

  // Note for discrepancy
  const [varianceReason, setVarianceReason] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Form validity
  const isSubmitDisabled = (statusType !== 'MATCH') && !varianceReason.trim();

  // Print Handling
  // Print Handling (A4 Formal Slip Document)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      toast.error('Gagal membuka jendela pratinjau cetak. Izinkan pop-up browser untuk mencetak laporan.');
      return;
    }

    const reportElement = document.getElementById('settlement-receipt-print');
    const reportHtml = reportElement ? reportElement.innerHTML : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Laporan_Rekonsiliasi_Shift_${session.id || 'CLOSING'}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              background-color: #ffffff !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .shift-print-document {
              width: 100%;
              max-width: 210mm;
              margin: 0 auto;
              padding: 15mm;
              background-color: #ffffff;
            }

            @media print {
              @page {
                size: A4 portrait;
                margin: 0;
              }

              body {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .no-print, nav, sidebar, header, button {
                display: none !important;
              }

              .shift-print-document {
                padding: 15mm;
                width: 100%;
                box-shadow: none !important;
                border: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="shift-print-document">
            ${reportHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Close Shift & Logout Actions
  const handleCloseShiftAndLogout = async () => {
    if (isSubmitDisabled) {
      toast.error('Alasan selisih wajib diisi jika terdapat selisih uang laci!');
      return;
    }
    if (!session) return;

    setLoadingSubmit(true);
    try {
      // Call closeShift action (DB)
      const result = await closeShift(session.id, actualPhysicalCash, varianceReason);
      if (!result.success) {
        toast.error(`Gagal menutup shift: ${result.error}`);
        return;
      }


      toast.success('Shift berhasil ditutup! Mengeluarkan sesi...');
      setTimeout(async () => {
        localStorage.clear();
        sessionStorage.clear();
        try {
          await signOut();
        } catch (err) {
          console.error('Error signing out:', err);
          router.push('/login');
        }
      }, 1000);
    } catch (err) {
      toast.error('Terjadi kesalahan saat menutup shift.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDenominationChange = (key: keyof DenominationState, value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    setDenominations((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#001E36] border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Mempersiapkan data rekonsiliasi shift...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Tutup Shift Kasir</h2>
              <p className="text-[11px] text-slate-400">Verifikasi saldo & penutupan sesi kerja</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto space-y-6">
          
          {/* Section 1: Absensi */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Absen Masuk</p>
                <p className="text-[12px] font-bold text-slate-700">{formatDateTime(session.clockInAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <ArrowRight className="w-4 h-4 text-slate-300 hidden sm:block shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Absen Keluar</p>
                <p className="text-[12px] font-bold text-slate-700">{formatDateTime(clockOutTime.toISOString())}</p>
              </div>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 text-center flex flex-col justify-center">
              <span className="text-[9px] text-blue-500 font-bold uppercase tracking-wider">Durasi Shift</span>
              <span className="text-[13px] font-bold text-blue-700">{durationText}</span>
            </div>
          </div>

          {/* Section 2: Ringkasan Uang Laci */}
          <div>
            <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Ringkasan Dana Laci</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <span className="text-[10px] text-slate-400 block mb-1">Modal Awal</span>
                <span className="text-[13px] font-bold text-slate-800 tabular-nums">{formatRupiah(session.openingCash)}</span>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <span className="text-[10px] text-emerald-500 block mb-1">Uang Tunai Masuk</span>
                <span className="text-[13px] font-bold text-emerald-600 tabular-nums">+{formatRupiah(session.totalCashIn)}</span>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <span className="text-[10px] text-rose-500 block mb-1">Uang Tunai Keluar</span>
                <span className="text-[13px] font-bold text-rose-600 tabular-nums">-{formatRupiah(session.totalCashOut)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 block mb-1 font-semibold">Ekspektasi Uang Fisik</span>
                <span className="text-[13px] font-extrabold text-[#001E36] tabular-nums">{formatRupiah(session.expectedCash)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Cash Opname */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Cash Opname (Uang Aktual)</h3>
              
              {/* Tab Selector */}
              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setOpnameMode('DIRECT')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    opnameMode === 'DIRECT'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Langsung
                </button>
                <button
                  type="button"
                  onClick={() => setOpnameMode('DENOMINATION')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                    opnameMode === 'DENOMINATION'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Lembaran
                </button>
              </div>
            </div>

            {/* Direct Input Mode */}
            {opnameMode === 'DIRECT' && (
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] font-bold">Rp</span>
                <input
                  type="number"
                  placeholder="Masukkan total uang fisik di laci saat ini..."
                  value={directPhysicalCash || ''}
                  onChange={(e) => setDirectPhysicalCash(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-10 pr-4 py-3 text-[14px] font-bold text-slate-800 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            )}

            {/* Denomination Mode Grid Input */}
            {opnameMode === 'DENOMINATION' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'd100k', nominal: 100000, label: '100.000' },
                  { key: 'd50k', nominal: 50000, label: '50.000' },
                  { key: 'd20k', nominal: 20000, label: '20.000' },
                  { key: 'd10k', nominal: 10000, label: '10.000' },
                  { key: 'd5k', nominal: 5000, label: '5.000' },
                  { key: 'd2k', nominal: 2000, label: '2.000' },
                  { key: 'd1k', nominal: 1000, label: '1.000' },
                ].map((denom) => (
                  <div key={denom.key} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-500 w-[55px]">Rp {denom.label}</span>
                    <span className="text-slate-400 text-[11px]">x</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={denominations[denom.key as keyof DenominationState] || ''}
                      onChange={(e) => handleDenominationChange(denom.key as keyof DenominationState, e.target.value)}
                      className="w-16 px-1.5 py-1 text-[12px] font-bold text-center border border-slate-200 rounded-lg outline-none bg-white focus:border-blue-400"
                    />
                    <span className="text-[11px] text-slate-400 font-medium ml-auto">
                      {formatRupiah((denominations[denom.key as keyof DenominationState] || 0) * denom.nominal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Selisih & Alasan */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <div>
                <p className="text-[12px] text-slate-500">Hasil Rekonsiliasi</p>
                <p className="text-[14px] font-extrabold text-slate-800 mt-0.5">{statusLabel}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total Uang Fisik</span>
                  <span className="text-[15px] font-black text-slate-800 tabular-nums">{formatRupiah(actualPhysicalCash)}</span>
                </div>
              </div>
            </div>

            {/* Note Discrepancy Textarea */}
            {statusType !== 'MATCH' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Alasan Selisih <span className="text-rose-500">* Wajib Diisi</span>
                </label>
                <textarea
                  rows={3}
                  value={varianceReason}
                  onChange={(e) => setVarianceReason(e.target.value)}
                  placeholder="Tuliskan keterangan detail mengapa terdapat selisih uang laci hari ini..."
                  className="w-full px-4 py-3 text-[13px] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-2.5 px-4.5 bg-slate-800 hover:bg-slate-900 text-white text-[13px] font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <Printer className="w-4 h-4 text-blue-300" />
            <span>Cetak Dokumen Setoran (A4)</span>
          </button>
          
          <button
            type="button"
            disabled={isSubmitDisabled || loadingSubmit}
            onClick={handleCloseShiftAndLogout}
            className={`sm:ml-auto flex items-center justify-center gap-2 py-2.5 px-5 text-white text-[13px] font-bold rounded-xl transition-all ${
              isSubmitDisabled || loadingSubmit
                ? 'bg-slate-300 cursor-not-allowed opacity-80'
                : 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/35 active:scale-98 cursor-pointer'
            }`}
          >
            🔴 {loadingSubmit ? 'MEMPROSES...' : 'TUTUP SHIFT & LOGOUT'}
          </button>
        </div>

        {/* Hidden Printer Component */}
        <SettlementReceipt
          session={session}
          actualCash={actualPhysicalCash}
          variance={variance}
          varianceReason={varianceReason}
          statusLabel={statusLabel}
          durationText={durationText}
          denominations={opnameMode === 'DENOMINATION' ? denominations : undefined}
          outletName="KIOS BRILINK SENTRAL"
          outletAddress="Jl. Raya Utama No. 88, Pusat Niaga Sentral"
          outletPhone="Hotline / WA: 0812-3456-7890"
          cashierRole={profile?.role === 'kasir' ? 'Kasir Operasional' : 'Petugas Shift'}
        />
      </div>
    </div>
  );
}
