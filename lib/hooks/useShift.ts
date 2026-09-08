'use client'

import { useQuery } from '@tanstack/react-query'
import type { Shift } from '@/lib/types'
import { getShiftSummary, getActiveShift, getShiftTransactions } from '@/lib/actions/shift.actions'

export function useActiveShift(kasirId?: string) {
  return useQuery<Shift | null>({
    queryKey: ['shift', 'active', kasirId],
    queryFn: async () => {
      if (!kasirId) return null
      const res = await getActiveShift(kasirId)
      if (res.success && res.data) {
        return res.data
      }
      return null
    },
    enabled: !!kasirId,
    staleTime: 10000,
  })
}

export function useShiftTransactions(shiftId?: string) {
  return useQuery({
    queryKey: ['transactions', 'shift', shiftId],
    queryFn: async () => {
      if (!shiftId) return []
      const res = await getShiftTransactions(shiftId)
      if (res.success && res.data) {
        return res.data
      }
      return []
    },
    enabled: !!shiftId,
  })
}

export function useShiftSummary(shiftId?: string) {
  return useQuery({
    queryKey: ['shift', 'summary', shiftId],
    queryFn: async () => {
      if (!shiftId) return null
      return getShiftSummary(shiftId)
    },
    enabled: !!shiftId,
  })
}

