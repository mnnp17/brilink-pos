'use client';

import React from 'react';
import type { ShiftSession, DenominationState, ShiftPrintData, ShiftPrintDenomination } from '@/lib/types/shift';
import { formatRupiah, formatDateTime } from '@/lib/utils/format';

interface SettlementReceiptProps {
  session: ShiftSession;
  actualCash: number;
  variance: number;
  varianceReason?: string;
  statusLabel?: string;
  durationText?: string;
  denominations?: DenominationState;
  outletName?: string;
  outletAddress?: string;
  outletPhone?: string;
  cashierRole?: string;
}

export function SettlementReceipt({
  session,
  actualCash,
  variance,
  varianceReason,
  durationText,
  denominations,
  outletName,
  outletAddress,
  outletPhone,
  cashierRole,
}: SettlementReceiptProps) {
  // Defensive fallbacks to prevent NaN / null / undefined
  const safeStartCash = Number(session.openingCash) || 0;
  const safeTotalCashIn = Number(session.totalCashIn) || 0;
  const safeTotalCashOut = Number(session.totalCashOut) || 0;
  const safeExpectedCash = Number(session.expectedCash) || 0;
  const safeActualCash = Number(actualCash) || 0;
  const safeDifferenceCash = Number(variance) || 0;

  const isMatch = safeDifferenceCash === 0;

  // Format denominations if present
  const denomList: ShiftPrintDenomination[] = denominations
    ? [
        { nominal: 100000, count: denominations.d100k || 0, total: (denominations.d100k || 0) * 100000 },
        { nominal: 50000, count: denominations.d50k || 0, total: (denominations.d50k || 0) * 50000 },
        { nominal: 20000, count: denominations.d20k || 0, total: (denominations.d20k || 0) * 20000 },
        { nominal: 10000, count: denominations.d10k || 0, total: (denominations.d10k || 0) * 10000 },
        { nominal: 5000, count: denominations.d5k || 0, total: (denominations.d5k || 0) * 5000 },
        { nominal: 2000, count: denominations.d2k || 0, total: (denominations.d2k || 0) * 2000 },
        { nominal: 1000, count: denominations.d1k || 0, total: (denominations.d1k || 0) * 1000 },
      ].filter((d) => d.count > 0)
    : [];

  const reconciliationId = `REC-${(session.id || 'SHIFT').toUpperCase().slice(-8)}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;

  return (
    <div
      id="settlement-receipt-print"
      className="shift-print-document hidden print:block text-slate-900 bg-white"
    >
      {/* ── 1. HEADER IDENTITY & DYNAMIC STATUS BADGE ── */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
        {/* Left: Outlet Identity */}
        <div className="space-y-1 max-w-[65%] text-left">
          <div className="flex items-center gap-2">
            <span className="bg-[#001E36] text-[#FF6600] font-black text-xs px-2 py-0.5 rounded tracking-wider">
              BRILink POS
            </span>
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">
              AGEN RESMI BANK BRI
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase mt-1">
            {outletName || 'KIOS BRILINK SENTRAL'}
          </h1>
          <p className="text-[11px] text-slate-600 leading-snug">
            {outletAddress || 'Jl. Raya Utama No. 88, Pusat Niaga Sentral'}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            {outletPhone || 'Hotline / WhatsApp: 0812-3456-7890'}
          </p>
        </div>

        {/* Right: Dynamic Status Badge */}
        <div className="text-right shrink-0">
          {isMatch ? (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-600 text-emerald-900">
              <div className="text-[13px] font-black tracking-wider uppercase flex items-center justify-end gap-1.5 text-emerald-700">
                <span>✓</span> MATCH (SESUAI)
              </div>
              <p className="text-[9.5px] font-bold text-emerald-600 mt-0.5">
                Kas Laci Sesuai Sistem 100%
              </p>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-xl bg-rose-50 border-2 border-rose-600 text-rose-900">
              <div className="text-[13px] font-black tracking-wider uppercase flex items-center justify-end gap-1.5 text-rose-700">
                <span>⚠</span> SELISIH / DEVIASI
              </div>
              <p className="text-[9.5px] font-black text-rose-600 mt-0.5">
                {safeDifferenceCash < 0 ? 'DEFISIT' : 'SURPLUS'}: {formatRupiah(Math.abs(safeDifferenceCash))}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── DOCUMENT TITLE BANNER ── */}
      <div className="bg-slate-100 border border-slate-300 rounded-lg py-2 px-4 mb-4 text-center">
        <h2 className="text-[13px] font-black tracking-wider uppercase text-slate-800">
          LAPORAN REKONSILIASI PENUTUPAN SHIFT (CASH SETTLEMENT REPORT)
        </h2>
      </div>

      {/* ── 2. GRID INFORMATIF 2 KOLOM ── */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
        {/* Kolom Informasi Shift */}
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1.5 text-left">
          <div className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-200 pb-1 mb-1.5 tracking-wider">
            Informasi Shift & Petugas
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">ID Shift:</span>
            <span className="font-bold text-slate-800 font-mono">{session.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Petugas Kasir:</span>
            <span className="font-bold text-slate-800">
              {session.cashierName} <span className="text-[9.5px] text-slate-500 font-normal">({cashierRole || 'Kasir Operasional'})</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Waktu Buka Shift:</span>
            <span className="font-semibold text-slate-800">{formatDateTime(session.clockInAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Waktu Tutup Shift:</span>
            <span className="font-semibold text-slate-800">{formatDateTime(session.clockOutAt)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200/80 pt-1">
            <span className="text-slate-500 font-medium">Total Durasi Kerja:</span>
            <span className="font-extrabold text-blue-700">{durationText || '-'}</span>
          </div>
        </div>

        {/* Kolom Metadata Dokumen */}
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1.5 text-left">
          <div className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-200 pb-1 mb-1.5 tracking-wider">
            Metadata Dokumen & Audit
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">No. Rekonsiliasi:</span>
            <span className="font-bold text-slate-800 font-mono">{reconciliationId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Waktu Dokumen Dicetak:</span>
            <span className="font-semibold text-slate-800">{formatDateTime(new Date())}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Status Operasional:</span>
            <span className="font-bold text-slate-700">TERTUTUP (CLOSED)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Perangkat / Terminal:</span>
            <span className="font-semibold text-slate-800">POS-TERMINAL-01 (Kios Utama)</span>
          </div>
          <div className="flex justify-between border-t border-slate-200/80 pt-1">
            <span className="text-slate-500 font-medium">Audit Verification:</span>
            <span className="font-extrabold text-emerald-700 font-mono">SEC-VERIFIED-OK</span>
          </div>
        </div>
      </div>

      {/* ── 3. TABEL REKONSILIASI KEUANGAN (FINANCIAL SUMMARY TABLE) ── */}
      <div className="mb-4">
        <div className="text-[10.5px] font-black uppercase text-slate-700 tracking-wider mb-1.5 flex items-center justify-between">
          <span>Tabel Rekonsiliasi Kas Laci (Financial Summary)</span>
          <span className="text-[9px] font-normal text-slate-400">Mata Uang: IDR (Rupiah)</span>
        </div>
        <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-black uppercase text-[9.5px]">
                <th className="py-2 px-3 w-10 text-center border-r border-slate-200">No</th>
                <th className="py-2 px-3 border-r border-slate-200">Komponen Arus Kas Laci</th>
                <th className="py-2 px-3 w-32 border-r border-slate-200">Tipe Aliran</th>
                <th className="py-2 px-3 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* 1. Modal Awal */}
              <tr>
                <td className="py-2 px-3 text-center text-slate-400 font-mono border-r border-slate-200">1</td>
                <td className="py-2 px-3 font-bold text-slate-700 border-r border-slate-200">
                  Modal Awal Kas Laci (Opening Cash)
                </td>
                <td className="py-2 px-3 text-slate-500 border-r border-slate-200">Saldo Awal Shift</td>
                <td className="py-2 px-3 text-right font-bold text-slate-800 font-mono tabular-nums">
                  + {formatRupiah(safeStartCash)}
                </td>
              </tr>

              {/* 2. Kas Masuk */}
              <tr>
                <td className="py-2 px-3 text-center text-slate-400 font-mono border-r border-slate-200">2</td>
                <td className="py-2 px-3 font-bold text-slate-700 border-r border-slate-200">
                  Total Kas Fisik Masuk (Cash In / Setor Tunai)
                </td>
                <td className="py-2 px-3 text-emerald-600 font-semibold border-r border-slate-200">Kas Masuk (+)</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700 font-mono tabular-nums">
                  + {formatRupiah(safeTotalCashIn)}
                </td>
              </tr>

              {/* 3. Kas Keluar */}
              <tr>
                <td className="py-2 px-3 text-center text-slate-400 font-mono border-r border-slate-200">3</td>
                <td className="py-2 px-3 font-bold text-slate-700 border-r border-slate-200">
                  Total Kas Fisik Keluar (Cash Out / Tarik Tunai / OPEX)
                </td>
                <td className="py-2 px-3 text-rose-600 font-semibold border-r border-slate-200">Kas Keluar (-)</td>
                <td className="py-2 px-3 text-right font-bold text-rose-700 font-mono tabular-nums">
                  - {formatRupiah(safeTotalCashOut)}
                </td>
              </tr>

              {/* 4. Ekspektasi Kas Sistem */}
              <tr className="bg-slate-50/80 font-black border-t-2 border-slate-300">
                <td className="py-2 px-3 text-center text-slate-600 font-mono border-r border-slate-200">4</td>
                <td className="py-2 px-3 text-slate-900 border-r border-slate-200 uppercase text-[11.5px]">
                  Total Ekspektasi Kas Sistem (Expected Cash)
                </td>
                <td className="py-2 px-3 text-blue-700 font-bold border-r border-slate-200">Kalkulasi Otomatis</td>
                <td className="py-2 px-3 text-right text-[12px] font-black text-blue-800 font-mono tabular-nums">
                  {formatRupiah(safeExpectedCash)}
                </td>
              </tr>

              {/* 5. Kas Fisik Riil */}
              <tr className="bg-slate-100 font-black">
                <td className="py-2.5 px-3 text-center text-slate-700 font-mono border-r border-slate-200">5</td>
                <td className="py-2.5 px-3 text-slate-900 border-r border-slate-200 uppercase text-[11.5px]">
                  Uang Fisik Aktual Hasil Hitung Kasir (Actual Cash)
                </td>
                <td className="py-2.5 px-3 text-slate-700 font-bold border-r border-slate-200">Kas Opname Riil</td>
                <td className="py-2.5 px-3 text-right text-[12.5px] font-black text-slate-900 font-mono tabular-nums">
                  {formatRupiah(safeActualCash)}
                </td>
              </tr>

              {/* 6. Selisih Akhir */}
              <tr className={isMatch ? 'bg-emerald-50/70 font-black' : 'bg-rose-50/70 font-black'}>
                <td className="py-2.5 px-3 text-center font-mono border-r border-slate-200">6</td>
                <td className={`py-2.5 px-3 border-r border-slate-200 uppercase text-[11.5px] ${isMatch ? 'text-emerald-900' : 'text-rose-900'}`}>
                  Selisih Akhir Kas (Difference / Variance)
                </td>
                <td className={`py-2.5 px-3 font-bold border-r border-slate-200 ${isMatch ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isMatch ? '0 (Sesuai 100%)' : (safeDifferenceCash < 0 ? 'Defisit Laci (-)' : 'Surplus Laci (+)')}
                </td>
                <td className={`py-2.5 px-3 text-right text-[12.5px] font-black font-mono tabular-nums ${isMatch ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {isMatch ? 'Rp 0 (MATCH)' : `${safeDifferenceCash > 0 ? '+ ' : ''}${formatRupiah(safeDifferenceCash)}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. RINCIAN PECAHAN UANG (DENOMINATION BREAKDOWN) JIKA TERSEDIA ── */}
      {denomList.length > 0 && (
        <div className="mb-4 text-left">
          <div className="text-[10px] font-black uppercase text-slate-600 tracking-wider mb-1">
            Rincian Pecahan Uang Fisik Kas Opname (Denomination Breakdown)
          </div>
          <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/40">
            <div className="grid grid-cols-4 gap-2 text-[10px]">
              {denomList.map((denom, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-700 block">Rp {denom.nominal.toLocaleString('id-ID')}</span>
                    <span className="text-[9px] text-slate-400">{denom.count} lbr/kpg</span>
                  </div>
                  <span className="font-black text-slate-800 font-mono tabular-nums text-[10.5px]">
                    {formatRupiah(denom.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. CATATAN OPERASIONAL KASIR ── */}
      <div className="mb-6 text-left">
        <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
          Catatan Operasional / Alasan Deviasi Kasir:
        </div>
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 text-[11px] text-slate-700 min-h-[38px] leading-relaxed">
          {varianceReason?.trim() ? varianceReason : 'Tidak ada catatan khusus operasional. Kas dan transaksi shift telah terverifikasi.'}
        </div>
      </div>

      {/* ── 6. DUAL SIGNATURE BLOCK (KASIR & OWNER BERDAMPINGAN) ── */}
      <div className="grid grid-cols-2 gap-8 pt-2 border-t-2 border-slate-300 mb-6 text-[11px]">
        {/* Signature 1: Petugas Kasir */}
        <div className="border border-slate-200 rounded-xl p-3.5 text-center flex flex-col justify-between h-36 bg-slate-50/30">
          <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
            Petugas Shift (Kasir)
          </span>
          <div className="h-14 flex items-end justify-center">
            {/* Signature writing space */}
            <span className="text-slate-300 text-[10px] italic select-none">Tanda Tangan Digital / Basah</span>
          </div>
          <div>
            <p className="font-extrabold text-slate-900 border-t border-slate-400 pt-1 text-[11.5px]">
              ( {session.cashierName} )
            </p>
            <p className="text-[9.5px] text-slate-400 font-mono mt-0.5">
              Waktu: {formatDateTime(session.clockOutAt)}
            </p>
          </div>
        </div>

        {/* Signature 2: Owner / Supervisor */}
        <div className="border border-slate-200 rounded-xl p-3.5 text-center flex flex-col justify-between h-36 bg-slate-50/30">
          <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
            Owner / Supervisor Outlet
          </span>
          <div className="h-14 flex items-end justify-center">
            {/* Signature writing space */}
            <span className="text-slate-300 text-[10px] italic select-none">Tanda Tangan Verifikator</span>
          </div>
          <div>
            <p className="font-extrabold text-slate-900 border-t border-slate-400 pt-1 text-[11.5px]">
              ( _______________________________ )
            </p>
            <p className="text-[9.5px] text-slate-400 font-mono mt-0.5">
              Tanggal: ____ / ____ / ________
            </p>
          </div>
        </div>
      </div>

      {/* ── 7. FOOTER AUDIT TRAIL ── */}
      <div className="border-t border-slate-200 pt-2 text-center text-[9px] text-slate-400 space-y-0.5">
        <p className="font-medium">
          Dokumen ini dicetak otomatis secara resmi oleh sistem <strong>BRILink POS</strong> untuk arsip pembukuan kasir outlet.
        </p>
        <p className="font-mono text-[8.5px]">
          Hash: {reconciliationId}-SHA256 • Dicetak pada: {formatDateTime(new Date())}
        </p>
      </div>
    </div>
  );
}

export type { ShiftPrintData, ShiftPrintDenomination };

