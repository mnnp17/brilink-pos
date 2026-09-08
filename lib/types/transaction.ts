/**
 * Types untuk Halaman Riwayat Transaksi (Role Kasir)
 * 
 * PERHATIAN: Tipe ini SENGAJA tidak menyertakan atribut profit/margin/modal_price
 * yang merupakan data sensitif milik owner.
 */

export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING'

export type ServiceCategory = 'TARIK_TUNAI' | 'SETOR_TUNAI' | 'TRANSFER' | 'PPOB' | 'PULSA'

export interface AccountSource {
  id: string
  accountName: string // contoh: "EDC BRI Utama", "Rekening Mandiri 02"
  accountNumber: string
}

export interface TransactionItem {
  id: string
  createdAt: string // ISO String
  sourceAccount: AccountSource
  serviceName: string // contoh: "Tarik Tunai EDC", "Transfer Bank"
  serviceCategory: ServiceCategory
  targetAccount: string // No. Rekening / ID Pelanggan / No. HP
  customerName?: string
  digitalAmount: number // Saldo terpotong/bertambah di rekening digital (+ kredit, - debit)
  cashAmount: number // Uang fisik di laci (+ masuk, - keluar)
  status: TransactionStatus
  receiptNumber: string
  notes?: string
}

export interface ShiftReconciliationSummary {
  accountId: string
  accountName: string
  accountNumber: string
  digitalBalanceChange: number // total perubahan saldo digital rekening ini
  cashLaciChange: number // total estimasi perubahan kas fisik laci terkait rekening ini
  transactionCount: number
  isMatched: boolean
}

export type DateRangeFilter = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS'

export interface TransactionFilters {
  searchQuery: string
  accountId: string // '' = semua
  dateRange: DateRangeFilter
  serviceCategory: ServiceCategory | 'ALL'
}
