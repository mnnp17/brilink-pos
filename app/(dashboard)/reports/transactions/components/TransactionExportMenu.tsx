'use client';

import React, { useState } from 'react';
import { RefactoredOwnerTransaction } from '@/types/owner-transaction';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/format';
import { toast } from 'sonner';

interface TransactionExportMenuProps {
  transactions: RefactoredOwnerTransaction[];
  filterState: {
    startDateTime: string;
    endDateTime: string;
  };
}

export function TransactionExportMenu({ transactions, filterState }: TransactionExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  // ── 1. Export Excel (CSV File) ──
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error('Tidak ada data transaksi untuk diekspor.');
      return;
    }

    const headers = [
      'ID Transaksi',
      'Tanggal',
      'Jam',
      'Layanan',
      'EDC / Rekening Asal',
      'Kasir',
      'Nominal Utama (Rp)',
      'Admin Pelanggan (Rp)',
      'Biaya Bank / COGS (Rp)',
      'Laba Bersih Riil (Rp)',
      'Status',
      'Status Audit',
      'Catatan Audit'
    ];

    const rows = transactions.map(tx => {
      const auditStatus = tx.netProfit <= 0 || tx.hasAnomaly 
        ? 'ANOMALI MARGIN' 
        : (tx.anomalyNote?.includes('diskon') ? 'DISKON ADMIN' : 'OK');

      return [
        tx.transactionNumber,
        formatDate(tx.createdAt),
        formatTime(tx.createdAt),
        `"${tx.serviceName.replace(/"/g, '""')}"`,
        `"${tx.sourceAccountName.replace(/"/g, '""')}"`,
        `"${tx.cashierName.replace(/"/g, '""')}"`,
        tx.amount,
        tx.customerAdminFee,
        tx.bankFee,
        tx.netProfit,
        tx.status,
        auditStatus,
        `"${(tx.anomalyNote || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_transaksi_owner_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('File Excel (CSV) berhasil di-generate!');
    setIsOpen(false);
  };

  // ── 2. Export PDF via Printable Window ──
  const handleExportPDF = () => {
    if (transactions.length === 0) {
      toast.error('Tidak ada data transaksi untuk dicetak.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak PDF');
      return;
    }

    // Calculations
    const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalCogs = transactions.reduce((sum, tx) => sum + tx.bankFee, 0);
    const totalAdmin = transactions.reduce((sum, tx) => sum + tx.customerAdminFee, 0);
    const netProfitTotal = totalAdmin - totalCogs;

    const reportHtml = `
      <html>
        <head>
          <title>Laporan Audit Transaksi Owner</title>
          <style>
            body { 
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
              padding: 40px; 
              color: #1e293b;
              background: #fff;
              margin: 0;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #0f172a;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header-info h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header-info p {
              margin: 5px 0 0 0;
              font-size: 11px;
              color: #64748b;
              font-weight: bold;
            }
            .period-badge {
              background-color: #f1f5f9;
              border: 1px solid #e2e8f0;
              padding: 8px 15px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: bold;
              color: #334155;
              text-align: right;
            }
            .kpi-row {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .kpi-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px;
              background-color: #f8fafc;
            }
            .kpi-card span {
              display: block;
              font-size: 10px;
              font-weight: 800;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kpi-card p {
              margin: 5px 0 0 0;
              font-size: 18px;
              font-weight: 900;
              color: #0f172a;
            }
            .kpi-card p.profit {
              color: #059669;
            }
            .kpi-card p.cogs {
              color: #e11d48;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              margin-top: 10px;
            }
            th {
              background-color: #f1f5f9;
              border-bottom: 2px solid #cbd5e1;
              border-top: 1px solid #e2e8f0;
              padding: 10px 12px;
              font-weight: 800;
              text-align: left;
              color: #475569;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.5px;
            }
            td {
              border-bottom: 1px solid #f1f5f9;
              padding: 10px 12px;
              color: #334155;
            }
            tr.anomaly-row {
              background-color: #ffe4e6;
            }
            tr.discount-row {
              background-color: #fffbeb;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .font-mono {
              font-family: monospace;
              font-weight: bold;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .badge-ok {
              background-color: #d1fae5;
              color: #065f46;
            }
            .badge-discount {
              background-color: #fef3c7;
              color: #92400e;
            }
            .badge-anomaly {
              background-color: #ffe4e6;
              color: #991b1b;
            }
            .footer {
              margin-top: 50px;
              font-size: 9px;
              text-align: center;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
              padding-top: 15px;
              font-weight: bold;
            }
            @media print {
              body { padding: 0; }
              .header-container { margin-bottom: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="header-info">
              <h1>Laporan Pengawasan Transaksi & Margin Owner</h1>
              <p>Agen BRILink Gemilang POS Auditor • Transparansi 100%</p>
            </div>
            <div class="period-badge">
              <div>Dicetak: ${new Date().toLocaleDateString('id-ID')}</div>
              <div style="font-size: 9px; color: #94a3b8; margin-top: 3px;">Periode Terfilter</div>
            </div>
          </div>

          <div class="kpi-row">
            <div class="kpi-card">
              <span>Volume Transaksi</span>
              <p>${formatRupiah(totalVolume)}</p>
            </div>
            <div class="kpi-card">
              <span>Beban COGS Bank</span>
              <p class="cogs">-${formatRupiah(totalCogs)}</p>
            </div>
            <div class="kpi-card">
              <span>Laba Bersih Total</span>
              <p class="profit">${formatRupiah(netProfitTotal)}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Waktu & ID</th>
                <th>Layanan</th>
                <th>EDC/Rekening</th>
                <th>Kasir</th>
                <th class="text-right">Nominal</th>
                <th class="text-right">Admin</th>
                <th class="text-right">COGS Bank</th>
                <th class="text-right">Net Profit</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(tx => {
                const isAnomaly = tx.netProfit <= 0 || tx.hasAnomaly;
                const isDiscount = tx.anomalyNote?.toLowerCase().includes('diskon');
                let rowClass = '';
                let badgeClass = 'badge-ok';
                let badgeText = 'OK';

                if (isAnomaly) {
                  rowClass = 'class="anomaly-row"';
                  badgeClass = 'badge-anomaly';
                  badgeText = 'ANOMALI';
                } else if (isDiscount) {
                  rowClass = 'class="discount-row"';
                  badgeClass = 'badge-discount';
                  badgeText = 'DISKON';
                }

                return `
                  <tr ${rowClass}>
                    <td>
                      <div style="font-weight: bold;">${formatTime(tx.createdAt)}</div>
                      <div style="font-size: 9px; color: #94a3b8;">${formatDate(tx.createdAt)}</div>
                      <div style="font-size: 9px; font-family: monospace; color: #64748b;">${tx.transactionNumber}</div>
                    </td>
                    <td style="font-weight: bold;">${tx.serviceName}</td>
                    <td>${tx.sourceAccountName}</td>
                    <td>${tx.cashierName}</td>
                    <td class="text-right font-mono">${formatRupiah(tx.amount)}</td>
                    <td class="text-right font-mono" style="color: #4f46e5;">+${formatRupiah(tx.customerAdminFee)}</td>
                    <td class="text-right font-mono" style="color: #e11d48;">-${formatRupiah(tx.bankFee)}</td>
                    <td class="text-right font-mono" style="font-weight: bold; color: ${tx.netProfit > 0 ? '#059669' : '#e11d48'};">
                      ${tx.netProfit >= 0 ? '+' : ''}${formatRupiah(tx.netProfit)}
                    </td>
                    <td class="text-center">
                      <span class="badge ${badgeClass}">${badgeText}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            Generated by BRILink POS Executive Owner Panel. Seluruh perhitungan margin bersumber dari formula: Admin Pelanggan - COGS Bank.
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 py-1 px-2.5 sm:py-1.5 sm:px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-[12px] font-bold rounded-xl shadow-xs transition-colors active:scale-95 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
        <span>Ekspor Laporan</span>
        <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-lg py-2 z-20 overflow-hidden text-[12px]">
            <button
              onClick={handleExportCSV}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-semibold cursor-pointer"
            >
              <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
              <span>Unduh Excel (CSV)</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-semibold cursor-pointer"
            >
              <FileText className="w-4.5 h-4.5 text-blue-600" />
              <span>Cetak Laporan PDF</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
