import type { StaffPermissions } from '@/app/(dashboard)/staff/types/staff-master';

export type UserRole = 'developer' | 'owner' | 'kasir'
export type AccountType = 'bank_bri' | 'edc_mobile' | 'bank_lain' | 'kas_laci'
export type TransactionType = 'setor_tunai' | 'tarik_tunai' | 'ppob' | 'pulsa' | 'transfer_internal' | 'cash_drop'
export type TransactionStatus = 'pending' | 'success' | 'void' | 'failed'
export type ShiftStatus = 'open' | 'closed'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  must_change_password: boolean
  is_active: boolean
  phone?: string
  outlet_id?: string
  permissions?: StaffPermissions
  created_at: string
  updated_at: string
}

export interface StoreAccount {
  id: string
  name: string
  account_type: AccountType
  account_number?: string
  bank_name?: string
  initial_balance: number
  current_balance: number
  min_threshold: number
  is_active: boolean
  is_deleted: boolean
  color_hex: string
  icon: string
  sort_order: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Shift {
  id: string
  kasir_id: string
  kasir_name: string
  status: ShiftStatus
  opening_cash: number
  closing_cash?: number
  system_expected_cash?: number
  cash_discrepancy?: number
  notes?: string
  opened_at: string
  closed_at?: string
  created_at: string
}

export interface Transaction {
  id: string
  transaction_number: string
  type: TransactionType
  status: TransactionStatus
  account_id: string
  shift_id?: string
  nominal: number
  fee_amount: number
  modal_price: number
  sell_price: number
  profit_amount: number
  cash_in: number
  cash_out: number
  balance_debit: number
  balance_credit: number
  customer_name?: string
  customer_phone?: string
  customer_id_number?: string
  destination_account?: string
  notes?: string
  is_deleted: boolean
  void_reason?: string
  voided_by?: string
  voided_at?: string
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  store_accounts?: StoreAccount
  profiles?: Profile
}

export interface FeeConfig {
  id: string
  transaction_type: TransactionType
  min_nominal: number
  max_nominal?: number
  fee_amount: number
  fee_percentage: number
  is_active: boolean
}

export interface DashboardStats {
  totalCash: number
  totalDigitalBalance: number
  totalBalance: number
  todayRevenue: number
  todayTransactionCount: number
  todayProfit: number
}
