'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Shift } from '@/lib/types'

export function useActiveShift(kasirId?: string) {
  const supabase = createClient()

  return useQuery<Shift | null>({
    queryKey: ['shift', 'active', kasirId],
    queryFn: async () => {
      if (!kasirId) return null
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('kasir_id', kasirId)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data ?? null
    },
    enabled: !!kasirId,
    staleTime: 10000,
  })
}

export function useShiftTransactions(shiftId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['transactions', 'shift', shiftId],
    queryFn: async () => {
      if (!shiftId) return []
      const { data, error } = await supabase
        .from('transactions')
        .select('*, store_accounts(name, color_hex, account_type)')
        .eq('shift_id', shiftId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
    enabled: !!shiftId,
  })
}
