'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TransactionItem, TransactionFilters, DateRangeFilter, ServiceCategory, ShiftReconciliationSummary, AccountSource } from '@/lib/types/transaction'
import { getTransactionHistory } from '@/lib/actions/transaction.actions'
import { getStoreAccounts } from '@/lib/actions/shift.actions'

function isWithinDateRange(isoDate: string, range: DateRangeFilter): boolean {
  const date = new Date(isoDate)
  const now = new Date()

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const today = startOfDay(now)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7)

  if (range === 'TODAY') return date >= today
  if (range === 'YESTERDAY') return date >= yesterday && date < today
  if (range === 'LAST_7_DAYS') return date >= sevenDaysAgo
  return true
}

function matchesSearch(tx: TransactionItem, query: string): boolean {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return (
    tx.receiptNumber.toLowerCase().includes(q) ||
    tx.targetAccount.toLowerCase().includes(q) ||
    (tx.customerName?.toLowerCase().includes(q) ?? false) ||
    tx.sourceAccount.accountNumber.toLowerCase().includes(q)
  )
}

const DEFAULT_FILTERS: TransactionFilters = {
  searchQuery: '',
  accountId: '',
  dateRange: 'TODAY',
  serviceCategory: 'ALL',
}

export function useTransactionHistory() {
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.searchQuery])

  const setFilter = useCallback(<K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // Fetch real accounts from database
  const { data: dbAccounts = [] } = useQuery<AccountSource[]>({
    queryKey: ['store-accounts-history'],
    queryFn: async () => {
      const res = await getStoreAccounts()
      if (res.success && res.data) {
        return res.data.map(acc => ({
          id: acc.id,
          accountName: acc.name,
          accountNumber: acc.account_number
        }))
      }
      return []
    }
  })

  // Fetch real transactions from database
  const { data: dbTransactions = [], isLoading } = useQuery<TransactionItem[]>({
    queryKey: ['transactions-history'],
    queryFn: async () => {
      const res = await getTransactionHistory()
      if (res.success && res.data) {
        return res.data.map(tx => {
          let category: ServiceCategory = 'TRANSFER';
          if (tx.type === 'TARIK_TUNAI') category = 'TARIK_TUNAI';
          else if (tx.type === 'SETOR_TUNAI') category = 'SETOR_TUNAI';
          else if (tx.type === 'TRANSFER') category = 'TRANSFER';
          else if (tx.type === 'PPOB') category = 'PPOB';
          else if (tx.type === 'PULSA') category = 'PULSA';

          const sourceAccount = tx.accounts ? {
            id: tx.accounts.id,
            accountName: tx.accounts.name,
            accountNumber: tx.accounts.account_number,
          } : {
            id: tx.account_id,
            accountName: 'Rekening Utama',
            accountNumber: 'Unknown',
          };

          return {
            id: tx.id,
            createdAt: tx.created_at,
            sourceAccount,
            serviceName: tx.type === 'TARIK_TUNAI' ? 'Tarik Tunai EDC' : tx.type === 'SETOR_TUNAI' ? 'Setor Tunai' : 'Transfer Bank',
            serviceCategory: category,
            targetAccount: tx.destination_account || tx.customer_phone || '-',
            customerName: tx.customer_name || undefined,
            digitalAmount: Number(tx.digital_change || 0),
            cashAmount: Number(tx.total_cash_change || 0),
            status: (tx.status || 'SUCCESS').toUpperCase() as any,
            receiptNumber: tx.idempotency_key || `TXN-${tx.id.slice(0, 8)}`,
            notes: tx.notes || undefined,
          }
        })
      }
      return []
    }
  })

  const filteredTransactions = useMemo<TransactionItem[]>(() => {
    return dbTransactions.filter((tx) => {
      if (!isWithinDateRange(tx.createdAt, filters.dateRange)) return false
      if (filters.accountId && tx.sourceAccount.id !== filters.accountId) return false
      if (filters.serviceCategory !== 'ALL' && tx.serviceCategory !== filters.serviceCategory) return false
      if (!matchesSearch(tx, debouncedSearch)) return false
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [dbTransactions, filters.dateRange, filters.accountId, filters.serviceCategory, debouncedSearch])

  const reconciliation = useMemo(() => {
    const accountMap = new Map<string, ShiftReconciliationSummary>()

    // Initialize from all active accounts
    dbAccounts.forEach((acc) => {
      accountMap.set(acc.id, {
        accountId: acc.id,
        accountName: acc.accountName,
        accountNumber: acc.accountNumber,
        digitalBalanceChange: 0,
        cashLaciChange: 0,
        transactionCount: 0,
        isMatched: true,
      })
    })

    // Accumulate from SUCCESS transactions only
    filteredTransactions
      .filter((t) => t.status === 'SUCCESS')
      .forEach((t) => {
        let rec = accountMap.get(t.sourceAccount.id)
        if (!rec) {
          rec = {
            accountId: t.sourceAccount.id,
            accountName: t.sourceAccount.accountName,
            accountNumber: t.sourceAccount.accountNumber,
            digitalBalanceChange: 0,
            cashLaciChange: 0,
            transactionCount: 0,
            isMatched: true,
          }
          accountMap.set(t.sourceAccount.id, rec)
        }
        rec.digitalBalanceChange += t.digitalAmount
        rec.cashLaciChange += t.cashAmount
        rec.transactionCount += 1
        
        const netDiff = Math.abs(rec.digitalBalanceChange + rec.cashLaciChange)
        rec.isMatched = netDiff < 50000
      })

    return Array.from(accountMap.values()).filter((r) => r.transactionCount > 0)
  }, [dbAccounts, filteredTransactions])

  const isAllMatched = useMemo(() => {
    return reconciliation.every((r) => r.isMatched)
  }, [reconciliation])

  return {
    filters,
    setFilter,
    resetFilters,
    filteredTransactions,
    reconciliation,
    isAllMatched,
    accounts: dbAccounts,
    isLoading,
  }
}
