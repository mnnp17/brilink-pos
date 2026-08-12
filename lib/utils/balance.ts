import type { StoreAccount } from '@/lib/types'

export function calculateTotalDigitalBalance(accounts: StoreAccount[]): number {
  return accounts
    .filter(a => a.is_active && !a.is_deleted && a.account_type !== 'kas_laci')
    .reduce((sum, a) => sum + a.current_balance, 0)
}

export function calculateCashBalance(accounts: StoreAccount[]): number {
  const cashAccount = accounts.find(a => a.account_type === 'kas_laci' && a.is_active)
  return cashAccount?.current_balance ?? 0
}

export function isBalanceLow(account: StoreAccount): boolean {
  return account.current_balance <= account.min_threshold
}

export function getBalanceStatus(account: StoreAccount): 'ok' | 'low' | 'critical' {
  if (account.current_balance <= account.min_threshold * 0.5) return 'critical'
  if (account.current_balance <= account.min_threshold) return 'low'
  return 'ok'
}

export function calculateProfit(
  type: string,
  feeAmount: number,
  modalPrice: number,
  sellPrice: number
): number {
  if (type === 'ppob' || type === 'pulsa') {
    return sellPrice - modalPrice
  }
  return feeAmount
}
