'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { StoreAccount } from '@/lib/types'

export function useAccounts() {
  const supabase = createClient()

  return useQuery<StoreAccount[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_accounts')
        .select('*')
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data ?? []
    },
    staleTime: 30000, // 30 seconds
  })
}

export function useAllAccounts() {
  const supabase = createClient()

  return useQuery<StoreAccount[]>({
    queryKey: ['accounts', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_accounts')
        .select('*')
        .eq('is_deleted', false)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}
