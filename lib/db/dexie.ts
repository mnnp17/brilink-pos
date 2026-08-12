import Dexie, { type EntityTable } from 'dexie'
import type { CreateTransactionInput } from '@/lib/validations/transaction.schema'

interface OfflineTransaction {
  id?: number
  payload: CreateTransactionInput
  createdAt: Date
  retryCount: number
  status: 'pending' | 'failed'
  error?: string
}

class BRILinkPOSDB extends Dexie {
  offlineTransactions!: EntityTable<OfflineTransaction, 'id'>

  constructor() {
    super('brilink-pos-db')
    this.version(1).stores({
      offlineTransactions: '++id, status, createdAt',
    })
  }
}

export const db = new BRILinkPOSDB()

export async function addOfflineTransaction(payload: CreateTransactionInput) {
  return db.offlineTransactions.add({
    payload,
    createdAt: new Date(),
    retryCount: 0,
    status: 'pending',
  })
}

export async function getPendingTransactions() {
  return db.offlineTransactions.where('status').equals('pending').toArray()
}

export async function removeOfflineTransaction(id: number) {
  return db.offlineTransactions.delete(id)
}

export async function markTransactionFailed(id: number, error: string) {
  return db.offlineTransactions.update(id, {
    status: 'failed',
    error,
    retryCount: await db.offlineTransactions.get(id).then(t => (t?.retryCount ?? 0) + 1),
  })
}
