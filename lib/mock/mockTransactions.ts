/**
 * Mock Data untuk Halaman Riwayat Transaksi Kasir
 * Digunakan sebagai pengganti API sebelum integrasi backend.
 */

import type { TransactionItem, AccountSource, ShiftReconciliationSummary } from '@/lib/types/transaction'

// ── Daftar Akun EDC / Rekening Tersedia ──────────────────────────────────────

export const MOCK_ACCOUNTS: AccountSource[] = [
  { id: 'acc-001', accountName: 'EDC BRI Utama', accountNumber: '0021-01-001234-50-1' },
  { id: 'acc-002', accountName: 'EDC BRILink Kios', accountNumber: '0021-02-005678-88-9' },
  { id: 'acc-003', accountName: 'Rekening Mandiri 02', accountNumber: '1440-0123-4567' },
]

// ── Helper: Generate ISO timestamp offset hari ────────────────────────────────

function daysAgo(days: number, hour = 10, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// ── Mock Transactions (15 data variasi) ───────────────────────────────────────

export const MOCK_TRANSACTIONS: TransactionItem[] = [
  // ── HARI INI ──────────────────────────────────────────────────────────────
  {
    id: 'txn-001',
    createdAt: daysAgo(0, 8, 15),
    sourceAccount: MOCK_ACCOUNTS[0],
    serviceName: 'Tarik Tunai EDC',
    serviceCategory: 'TARIK_TUNAI',
    targetAccount: '081234567890',
    customerName: 'Budi Santoso',
    digitalAmount: 500000,     // +500rb kredit ke digital (bank transfer masuk)
    cashAmount: -497500,       // -497.5rb keluar dari laci (diserahkan ke nasabah, net setelah fee)
    status: 'SUCCESS',
    receiptNumber: 'BRL-20260818-0001',
    notes: 'Tarik tunai nasabah reguler',
  },
  {
    id: 'txn-002',
    createdAt: daysAgo(0, 9, 30),
    sourceAccount: MOCK_ACCOUNTS[1],
    serviceName: 'Setor Tunai',
    serviceCategory: 'SETOR_TUNAI',
    targetAccount: '0021-01-999888-50-3',
    customerName: 'Siti Rahayu',
    digitalAmount: -1000000,   // -1jt debit dari digital (dikirim ke rekening tujuan)
    cashAmount: 1003000,       // +1.003jt masuk ke laci (diterima dari nasabah + fee)
    status: 'SUCCESS',
    receiptNumber: 'BRL-20260818-0002',
  },
  {
    id: 'txn-003',
    createdAt: daysAgo(0, 10, 5),
    sourceAccount: MOCK_ACCOUNTS[0],
    serviceName: 'Transfer Bank Lain',
    serviceCategory: 'TRANSFER',
    targetAccount: 'BCA 1234567890',
    customerName: 'Ahmad Fauzi',
    digitalAmount: -750000,
    cashAmount: 754000,
    status: 'SUCCESS',
    receiptNumber: 'BRL-20260818-0003',
  },
  {
    id: 'txn-004',
    createdAt: daysAgo(0, 11, 20),
    sourceAccount: MOCK_ACCOUNTS[2],
    serviceName: 'Bayar Token Listrik',
    serviceCategory: 'PPOB',
    targetAccount: '12345678901',
    customerName: 'Dewi Lestari',
    digitalAmount: -200000,
    cashAmount: 202500,
    status: 'SUCCESS',
    receiptNumber: 'BRL-20260818-0004',
    notes: 'Token listrik 200rb Prabayar',
  },
  {
    id: 'txn-005',
    createdAt: daysAgo(0, 12, 45),
    sourceAccount: MOCK_ACCOUNTS[0],
    serviceName: 'Tarik Tunai EDC',
    serviceCategory: 'TARIK_TUNAI',
    targetAccount: '082345678901',
    customerName: 'Hendra Wijaya',
    digitalAmount: 0,
    cashAmount: 0,
    status: 'FAILED',
    receiptNumber: 'BRL-20260818-0005',
    notes: 'Gagal: Koneksi terputus ke jaringan BRI',
  },
  {
    id: 'txn-006',
    createdAt: daysAgo(0, 13, 10),
    sourceAccount: MOCK_ACCOUNTS[1],
    serviceName: 'Beli Pulsa Telkomsel',
    serviceCategory: 'PULSA',
    targetAccount: '08123456789',
    customerName: 'Rina Fitriani',
    digitalAmount: -50000,
    cashAmount: 52000,
    status: 'SUCCESS',
    receiptNumber: 'BRL-20260818-0006',
  },
  {
    id: 'txn-007',
    createdAt: daysAgo(0, 14, 0),
    sourceAccount: MOCK_ACCOUNTS[0],
    serviceName: 'Transfer Antar Bank',
    serviceCategory: 'TRANSFER',
    targetAccount: 'Mandiri 1234-5678-9012',
    customerName: 'Joko Susilo',
    digitalAmount: -2500000,
    cashAmount: 2507500,
    status: 'PENDING',
    receiptNumber: 'BRL-20260818-0007',
    notes: 'Menunggu konfirmasi jaringan',
  },
  // ── KEMARIN ───────────────────────────────────────────────────────────────
  {
    id: 'txn-008',
    createdAt: daysAgo(1, 8, 0),
    sourceAccount: MOCK_ACCOUNTS[0],
    serviceName: 'Tarik Tunai EDC',
    serviceCategory: 'TARIK_TUNAI',
    targetAccount: '089876543210',
    customerName: 'Ratna Sari',
    digitalAmount: 300000,
    cashAmount: -297500,
    status: 'SUCCESS',
    receiptNumber: 'BRL-20260817-0001',
  },
  {
    id: 'txn-009',
    createdAt: daysAgo(1, 10, 30),
    sourceAccount: MOCK_ACCOUNTS[2],
    serviceName: 'Bayar BPJS Kesehatan',
    serviceCategory: 'PPOB',
    targetAccount: '0001234567',
    customerName: 'Yusuf Prasetyo',
    digitalAmount: -150000,
    cashAmount: 152000,
    status: 'SUCCESS',
    receiptNumber: 'BRL-20260817-0002',
  },
  {
    id: 'txn-010',
    createdAt: daysAgo(1, 13, 45),
    sourceAccount: MOCK_ACCOUNTS[1],
    serviceName: 'Setor Tunai',
    serviceCategory: 'SETOR_TUNAI',
    targetAccount: '0021-01-777666-50-2',
    customerName: 'Marini Putri',
    digitalAmount: -800000,
    cashAmount: 803000,
    status: 'SUCCESS',
    receiptNumber: 'BRL-20260817-0003',
  },
  {
    id: 'txn-011',
    createdAt: daysAgo(1, 15, 20),
    sourceAccount: MOCK_ACCOUNTS[0],
    serviceName: 'Tarik Tunai EDC',
    serviceCategory: 'TARIK_TUNAI',
    targetAccount: '081122334455',
    customerName: 'Bambang Haryono',
    digitalAmount: 0,
    cashAmount: 0,
    status: 'FAILED',
    receiptNumber: 'BRL-20260817-0004',
    notes: 'Gagal: Kartu ditolak jaringan',
  },
  // ── 7 HARI TERAKHIR ───────────────────────────────────────────────────────
  {
    id: 'txn-012',
    createdAt: daysAgo(3, 9, 0),
    sourceAccount: MOCK_ACCOUNTS[0],
    serviceName: 'Transfer Bank Lain',
    serviceCategory: 'TRANSFER',
    targetAccount: 'BNI 987654321',
    customerName: 'Lina Kusuma',
    digitalAmount: -1500000,
    cashAmount: 1507500,
    status: 'SUCCESS',
    receiptNumber: 'BRL-20260815-0001',
  },
  {
    id: 'txn-013',
    createdAt: daysAgo(4, 11, 15),
    sourceAccount: MOCK_ACCOUNTS[2],
    serviceName: 'Beli Paket Data',
    serviceCategory: 'PULSA',
    targetAccount: '08567890123',
    customerName: 'Agus Prasetya',
    digitalAmount: -100000,
    cashAmount: 102500,
    status: 'SUCCESS',
    receiptNumber: 'BRL-20260814-0001',
  },
  {
    id: 'txn-014',
    createdAt: daysAgo(5, 14, 30),
    sourceAccount: MOCK_ACCOUNTS[1],
    serviceName: 'Tarik Tunai EDC',
    serviceCategory: 'TARIK_TUNAI',
    targetAccount: '082299887766',
    customerName: 'Sri Wahyuni',
    digitalAmount: 1000000,
    cashAmount: -996000,
    status: 'SUCCESS',
    receiptNumber: 'BRL-20260813-0002',
  },
  {
    id: 'txn-015',
    createdAt: daysAgo(6, 16, 0),
    sourceAccount: MOCK_ACCOUNTS[0],
    serviceName: 'Bayar Tagihan Air',
    serviceCategory: 'PPOB',
    targetAccount: 'PDAM-00987654',
    customerName: 'Doni Setiawan',
    digitalAmount: -75000,
    cashAmount: 76500,
    status: 'PENDING',
    receiptNumber: 'BRL-20260812-0001',
    notes: 'Menunggu konfirmasi dari PDAM',
  },
]

// ── Mock Reconciliation Summary ───────────────────────────────────────────────

export function buildMockReconciliation(
  transactions: TransactionItem[]
): ShiftReconciliationSummary[] {
  const accountMap = new Map<string, ShiftReconciliationSummary>()

  // Initialize from all known accounts
  MOCK_ACCOUNTS.forEach((acc) => {
    accountMap.set(acc.id, {
      accountId: acc.id,
      accountName: acc.accountName,
      accountNumber: acc.accountNumber,
      digitalBalanceChange: 0,
      cashLaciChange: 0,
      transactionCount: 0,
      isMatched: true,
    })
  })

  // Accumulate from SUCCESS transactions only
  transactions
    .filter((t) => t.status === 'SUCCESS')
    .forEach((t) => {
      const rec = accountMap.get(t.sourceAccount.id)
      if (rec) {
        rec.digitalBalanceChange += t.digitalAmount
        rec.cashLaciChange += t.cashAmount
        rec.transactionCount += 1
        // Simple match rule: net(digital + cash) should be near zero (just fees)
        const netDiff = Math.abs(rec.digitalBalanceChange + rec.cashLaciChange)
        rec.isMatched = netDiff < 50000 // within Rp50k tolerance
      }
    })

  return Array.from(accountMap.values()).filter((r) => r.transactionCount > 0)
}
