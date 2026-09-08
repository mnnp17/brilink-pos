'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils/format'

export function TodayStats() {
  const supabase = createClient()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'today'],
    queryFn: async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('transactions')
        .select('nominal, profit_amount, fee_amount, type')
        .eq('is_deleted', false)
        .eq('status', 'success')
        .gte('created_at', today.toISOString())

      if (error) throw error

      const totalNominal = data?.reduce((s, t) => s + Number(t.nominal), 0) ?? 0
      const totalProfit = data?.reduce((s, t) => s + Number(t.profit_amount), 0) ?? 0
      const count = data?.length ?? 0

      return { totalNominal, totalProfit, count }
    },
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl animate-shimmer" />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Transaksi Hari Ini</p>
        <p className="text-white text-2xl font-bold mt-1">{stats?.count ?? 0}</p>
        <p className="text-slate-500 text-xs mt-1">total transaksi berhasil</p>
      </div>
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Volume Transaksi</p>
        <p className="text-white text-xl font-bold mt-1 rupiah">{formatRupiah(stats?.totalNominal ?? 0)}</p>
        <p className="text-slate-500 text-xs mt-1">nominal hari ini</p>
      </div>
      <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4">
        <p className="text-emerald-400 text-xs font-medium uppercase tracking-wide">Laba Hari Ini</p>
        <p className="text-emerald-300 text-xl font-bold mt-1 rupiah">{formatRupiah(stats?.totalProfit ?? 0)}</p>
        <p className="text-emerald-600 text-xs mt-1">fee + margin PPOB</p>
      </div>
    </div>
  )
}
