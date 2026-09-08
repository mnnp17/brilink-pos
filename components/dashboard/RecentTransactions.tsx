'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah, formatDateTime } from '@/lib/utils/format'
import type { Transaction } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  setor_tunai: 'Setor Tunai',
  tarik_tunai: 'Tarik Tunai',
  ppob: 'PPOB',
  pulsa: 'Pulsa',
  transfer_internal: 'Transfer',
  cash_drop: 'Cash Drop',
}

const TYPE_COLORS: Record<string, string> = {
  setor_tunai: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  tarik_tunai: 'text-red-400 bg-red-500/10 border-red-500/20',
  ppob: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  pulsa: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  transfer_internal: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  cash_drop: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
}

export function RecentTransactions() {
  const supabase = createClient()

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, store_accounts(name, color_hex), profiles!created_by(full_name)')
        .eq('is_deleted', false)
        .neq('status', 'void')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data ?? []
    },
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 rounded-xl animate-shimmer" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-800/40 rounded-xl border border-slate-700/60">
        <p className="text-slate-500 text-sm">Belum ada transaksi tercatat</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((txn) => (
        <div
          key={txn.id}
          className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
              TYPE_COLORS[txn.type] ?? 'text-slate-400 bg-slate-800 border-slate-700'
            }`}>
              {TYPE_LABELS[txn.type] ?? txn.type}
            </span>
            <div>
              <p className="text-white text-sm font-medium">{txn.transaction_number}</p>
              <p className="text-slate-500 text-xs">
                {(txn.store_accounts as {name: string} | null)?.name ?? 'Rekening'} • {formatDateTime(txn.created_at)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-semibold rupiah text-sm">{formatRupiah(txn.nominal)}</p>
            <p className="text-emerald-400 text-xs rupiah">+{formatRupiah(txn.profit_amount)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
