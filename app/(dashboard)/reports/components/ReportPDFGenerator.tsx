'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import {
  FinancialReportSummary,
  AIStrategicAdvice,
  OpexBreakdownItem,
  CashierAuditSummary,
} from '../types/report';
import { formatRupiah } from '@/lib/utils/format';

// Styles definition for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottom: '2px solid #0f172a',
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#001e36',
  },
  subtitle: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
    fontWeight: 'medium',
  },
  datePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    fontSize: 8,
    color: '#334155',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0284c7',
    borderBottom: '1px solid #cbd5e1',
    paddingBottom: 3,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiContainer: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0284c7',
    marginBottom: 4,
  },
  aiText: {
    fontSize: 8.5,
    lineHeight: 1.35,
    color: '#334155',
    marginBottom: 3,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#ffffff',
  },
  kpiLabel: {
    fontSize: 7,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  kpiVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 3,
  },
  kpiProfit: {
    color: '#059669',
  },
  kpiLoss: {
    color: '#e11d48',
  },
  table: {
    width: '100%',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #cbd5e1',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderCol: {
    fontWeight: 'bold',
    fontSize: 7.5,
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRowCol: {
    fontSize: 8,
    color: '#334155',
  },
  bold: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTop: '1px solid #f1f5f9',
    paddingTop: 8,
    textAlign: 'center',
    fontSize: 7.5,
    color: '#94a3b8',
  },
});

interface PDFReportProps {
  summary: FinancialReportSummary;
  aiAdvice: AIStrategicAdvice;
  opexItems: OpexBreakdownItem[];
  cashierAudits: CashierAuditSummary[];
}

// PDF Document component using @react-pdf/renderer
export function FinancialReportPDFDocument({
  summary,
  aiAdvice,
  opexItems,
  cashierAudits,
}: PDFReportProps) {
  return (
    <Document>
      {/* ── Page 1: Briefing & KPI Cards ── */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>LAPORAN KINERJA BISNIS & LABA RUGI</Text>
            <Text style={styles.subtitle}>Agen BRILink Gemilang POS Auditor • Transparansi 100%</Text>
          </View>
          <View style={styles.datePill}>
            <Text style={{ fontWeight: 'bold' }}>Periode: {summary.periodLabel}</Text>
            <Text style={{ fontSize: 6.5, color: '#94a3b8', marginTop: 1 }}>Dicetak: {new Date().toLocaleDateString('id-ID')}</Text>
          </View>
        </View>

        {/* AI Co-Pilot Strategic Briefing */}
        <Text style={styles.sectionTitle}>AI Executive Advisor & Health Score ({aiAdvice.healthScore}/100)</Text>
        <View style={styles.aiContainer}>
          <Text style={styles.aiTitle}>Ringkasan Finansial:</Text>
          {aiAdvice.executiveSummary.map((text, idx) => (
            <Text key={idx} style={styles.aiText}>• {text}</Text>
          ))}
          
          <Text style={[styles.aiTitle, { marginTop: 6 }]}>Rekomendasi AI:</Text>
          {aiAdvice.strategicRecommendations.map((text, idx) => (
            <Text key={idx} style={styles.aiText}>• {text}</Text>
          ))}
        </View>

        {/* KPI Cards */}
        <Text style={styles.sectionTitle}>Ringkasan KPI Finansial</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Omset Gross</Text>
            <Text style={styles.kpiVal}>{formatRupiah(summary.grossVolume)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Beban COGS Bank</Text>
            <Text style={[styles.kpiVal, styles.kpiLoss]}>-{formatRupiah(summary.cogsBankFee)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Beban OPEX Toko</Text>
            <Text style={[styles.kpiVal, styles.kpiLoss]}>-{formatRupiah(summary.totalOpex)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Net Profit Riil</Text>
            <Text style={[styles.kpiVal, styles.kpiProfit]}>{formatRupiah(summary.netProfitReal)}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 7.5, color: '#94a3b8', textAlign: 'center', marginTop: 30 }}>
          Halaman 1 dari 2 • Lanjutkan ke Halaman Berikutnya untuk rincian data Laba-Rugi & Kasir
        </Text>

        <View style={styles.footer}>
          <Text>Sistem POS Agen BRILink Gemilang. Seluruh hak cipta dilindungi.</Text>
        </View>
      </Page>

      {/* ── Page 2: Detailed P&L and Cashier Audits ── */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>LAPORAN KINERJA BISNIS & LABA RUGI</Text>
            <Text style={styles.subtitle}>Detail Keuangan & Rekapitulasi Audit Kasir</Text>
          </View>
          <Text style={styles.datePill}>Periode: {summary.periodLabel}</Text>
        </View>

        {/* Detailed P&L */}
        <Text style={styles.sectionTitle}>Breakdown Laba-Rugi Statement (P&L)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { flex: 2 }]}>Deskripsi Akun</Text>
            <Text style={[styles.tableHeaderCol, { flex: 1, textAlign: 'right' }]}>Pendapatan</Text>
            <Text style={[styles.tableHeaderCol, { flex: 1, textAlign: 'right' }]}>Beban</Text>
            <Text style={[styles.tableHeaderCol, { flex: 1, textAlign: 'right' }]}>Net Subtotal</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableRowCol, { flex: 2 }]}>Total Admin Pelanggan</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right', color: '#059669' }]}>+{formatRupiah(summary.customerAdminIncome)}</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right' }]}>-</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{formatRupiah(summary.customerAdminIncome)}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableRowCol, { flex: 2 }]}>Merchant Fee / COGS Bank</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right' }]}>-</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right', color: '#e11d48' }]}>-{formatRupiah(summary.cogsBankFee)}</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right', color: '#e11d48' }]}>-{formatRupiah(summary.cogsBankFee)}</Text>
          </View>

          <View style={[styles.tableRow, { backgroundColor: '#f8fafc', fontWeight: 'bold' }]}>
            <Text style={[styles.tableRowCol, { flex: 2, fontWeight: 'bold' }]}>Gross Profit (Laba Kotor)</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right' }]}>-</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right' }]}>-</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right', fontWeight: 'bold' }]}>{formatRupiah(summary.grossProfit)}</Text>
          </View>

          {opexItems.map((item, idx) => (
            <View style={styles.tableRow} key={idx}>
              <Text style={[styles.tableRowCol, { flex: 2, paddingLeft: 10 }]}>Beban {item.categoryName}</Text>
              <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right' }]}>-</Text>
              <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right', color: '#e11d48' }]}>-{formatRupiah(item.amount)}</Text>
              <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right', color: '#64748b' }]}>-{formatRupiah(item.amount)}</Text>
            </View>
          ))}

          <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
            <Text style={[styles.tableRowCol, { flex: 2, fontWeight: 'bold', paddingLeft: 5 }]}>Total Beban Operasional (OPEX)</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right' }]}>-</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right', color: '#e11d48', fontWeight: 'bold' }]}>-{formatRupiah(summary.totalOpex)}</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right', color: '#e11d48', fontWeight: 'bold' }]}>-{formatRupiah(summary.totalOpex)}</Text>
          </View>

          <View style={[styles.tableRow, { backgroundColor: '#ecfdf5', borderTop: '1px solid #10b981' }]}>
            <Text style={[styles.tableRowCol, { flex: 2, fontWeight: 'bold', color: '#065f46' }]}>Net Profit Riil (Laba Bersih)</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right' }]}>-</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right' }]}>-</Text>
            <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#059669', fontSize: 9.5 }]}>{formatRupiah(summary.netProfitReal)}</Text>
          </View>
        </View>

        {/* Cashier Audits */}
        <Text style={styles.sectionTitle}>Rekapitulasi Audit Ketelitian Kasir</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { flex: 2 }]}>Nama Kasir</Text>
            <Text style={[styles.tableHeaderCol, { flex: 1, textAlign: 'center' }]}>Shift Kerja</Text>
            <Text style={[styles.tableHeaderCol, { flex: 1, textAlign: 'center' }]}>Shift Match</Text>
            <Text style={[styles.tableHeaderCol, { flex: 1.5, textAlign: 'right' }]}>Total Selisih (Rp)</Text>
            <Text style={[styles.tableHeaderCol, { flex: 1, textAlign: 'center' }]}>Skor Akurasi</Text>
          </View>

          {cashierAudits.map((item) => (
            <View style={styles.tableRow} key={item.cashierId}>
              <Text style={[styles.tableRowCol, { flex: 2, fontWeight: 'bold' }]}>{item.cashierName}</Text>
              <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'center' }]}>{item.totalShifts} shift</Text>
              <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'center', color: '#059669' }]}>{item.matchedShifts} shift</Text>
              <Text style={[styles.tableRowCol, { flex: 1.5, textAlign: 'right', color: item.totalVarianceAmount < 0 ? '#e11d48' : '#334155' }]}>
                {item.totalVarianceAmount === 0 ? 'Rp 0' : formatRupiah(item.totalVarianceAmount)}
              </Text>
              <Text style={[styles.tableRowCol, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>{item.accuracyScore.toFixed(1)}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Dokumen digital ini diterbitkan secara sah oleh Agen BRILink Gemilang POS Owner Panel.</Text>
        </View>
      </Page>
    </Document>
  );
}

// Function to trigger client-side download using PDF blob
export async function downloadFinancialReportPDF(
  summary: FinancialReportSummary,
  aiAdvice: AIStrategicAdvice,
  opexItems: OpexBreakdownItem[],
  cashierAudits: CashierAuditSummary[]
) {
  const doc = (
    <FinancialReportPDFDocument
      summary={summary}
      aiAdvice={aiAdvice}
      opexItems={opexItems}
      cashierAudits={cashierAudits}
    />
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const formattedDate = new Date().toISOString().slice(0, 10);
  link.download = `laporan_kinerja_bisnis_${formattedDate}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
