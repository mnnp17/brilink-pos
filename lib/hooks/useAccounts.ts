'use client'

import { useQuery } from '@tanstack/react-query'
import type { StoreAccount } from '@/lib/types'
import { getStoreAccounts } from '@/lib/actions/shift.actions'

export function useAccounts() {
  return useQuery<StoreAccount[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await getStoreAccounts()
      if (res.success && res.data) {
        // filter active accounts (default is active true)
        return res.data.filter((acc: any) => acc.is_active !== false) as StoreAccount[]
      }
      return []
    },
    staleTime: 30000, // 30 seconds
  })
}

export function useAllAccounts() {
  return useQuery<StoreAccount[]>({
    queryKey: ['accounts', 'all'],
    queryFn: async () => {
      const res = await getStoreAccounts()
      if (res.success && res.data) {
        return res.data as StoreAccount[]
      }
      return []
    },
  })
}
