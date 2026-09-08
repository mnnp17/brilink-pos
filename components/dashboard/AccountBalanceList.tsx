'use client'

import { useAllAccounts } from '@/lib/hooks/useAccounts'
import { getBalanceStatus, isBalanceLow } from '@/lib/utils/balance'
import { formatRupiah } from '@/lib/utils/format'
import type { AccountType } from '@/lib/types'

const TYPE_LABELS: Record<AccountType, string> = {
  bank_bri: 'Bank BRI',
  edc_mobile: 'EDC Mobile',
  bank_lain: 'Bank Lain',
  kas_laci: 'Kas Laci',
}

const TYPE_ICONS: Record<AccountType, string> = {
  bank_bri: '🏦',
  edc_mobile: '📱',
  bank_lain: '🏢',
  kas_laci: '💵',
}

export function AccountBalanceList() {
  const { data: accounts = [], isLoading } = useAllAccounts()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 rounded-xl animate-shimmer" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {accounts.map(account => {
        const status = getBalanceStatus(account)
        const low = isBalanceLow(account)
        const percentage = Math.min(100, (account.current_balance / Math.max(account.initial_balance, 1)) * 100)

        return (
          <div
            key={account.id}
            className={`p-4 rounded-xl border transition-all ${
              status === 'critical'
                ? 'bg-red-500/5 border-red-500/30'
                : status === 'low'
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-slate-800/60 border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    backgroundColor: `${account.color_hex}20`,
                    border: `1px solid ${account.color_hex}30`,
                  }}
                >
                  {TYPE_ICONS[account.account_type]}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{account.name}</p>
                  <p className="text-slate-500 text-xs">{TYPE_LABELS[account.account_type]}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold rupiah ${
                  status === 'critical' ? 'text-red-400' :
                  status === 'low' ? 'text-amber-400' : 'text-white'
                }`}>
                  {formatRupiah(account.current_balance)}
                </p>
                {low && (
                  <p className={`text-xs font-medium ${
                    status === 'critical' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {status === 'critical' ? '⚠️ Saldo Kritis!' : '⚠️ Saldo Rendah'}
                  </p>
                )}
              </div>
            </div>
            {/* Balance progress bar */}
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  status === 'critical' ? 'bg-red-500' :
                  status === 'low' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-slate-600 text-xs mt-1">
              Min. threshold: {formatRupiah(account.min_threshold)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
