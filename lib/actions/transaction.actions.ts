'use server'

import { getSupabaseClient, getCurrentUserContext } from '@/lib/supabase/action-auth'
import { createTransactionSchema, type CreateTransactionInput } from '@/lib/validations/transaction.schema'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createTransaction(input: CreateTransactionInput): Promise<ActionResult> {
  const supabase = await getSupabaseClient()
  const { userId, error: ctxError } = await getCurrentUserContext()
  if (!userId) {
    return { success: false, error: ctxError }
  }

  // Validate input
  const validation = createTransactionSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0]?.message ?? 'Input tidak valid' }
  }

  const data = validation.data

  // Call atomic PostgreSQL function
  const { data: result, error } = await supabase.rpc('process_transaction', {
    p_type: data.type,
    p_account_id: data.account_id,
    p_shift_id: data.shift_id ?? null,
    p_nominal: data.nominal,
    p_fee_amount: data.fee_amount,
    p_modal_price: data.modal_price,
    p_sell_price: data.sell_price,
    p_customer_name: data.customer_name ?? null,
    p_customer_phone: data.customer_phone ?? null,
    p_destination_account: data.destination_account ?? null,
    p_notes: data.notes ?? null,
    p_created_by: userId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  if (!result?.success) {
    const errorMap: Record<string, string> = {
      'SALDO_TIDAK_CUKUP': `Saldo tidak mencukupi. Saldo tersedia: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(result?.current_balance ?? 0)}`,
      'ACCOUNT_NOT_FOUND': 'Rekening tidak ditemukan',
      'ACCOUNT_INACTIVE': 'Rekening tidak aktif',
    }
    return { success: false, error: errorMap[result?.error] ?? result?.error ?? 'Transaksi gagal' }
  }

  return { success: true, data: result }
}

export async function voidTransaction(transactionId: string, reason: string): Promise<ActionResult> {
  const supabase = await getSupabaseClient()
  const { userId, error: ctxError } = await getCurrentUserContext()
  if (!userId) return { success: false, error: ctxError }

  const { error } = await supabase
    .from('transactions')
    .update({
      status: 'void',
      void_reason: reason,
      voided_by: userId,
      voided_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

import fs from 'fs'

function logDebug(message: string) {
  const logFile = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\e47a547a-5006-406c-9b8b-c8c07f796bf2/scratch/debug.log';
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
  } catch (e) {}
}

export async function getTransactionHistory(): Promise<ActionResult<any[]>> {
  logDebug('getTransactionHistory: called');
  const supabase = await getSupabaseClient()
  const { userId, error: ctxError } = await getCurrentUserContext()
  logDebug(`getTransactionHistory context: userId=${userId}, ctxError=${ctxError}`);
  if (!userId) return { success: false, error: ctxError }

  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts(id, name, account_number, type)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    logDebug(`getTransactionHistory DB error: ${error.message}`);
    return { success: false, error: error.message }
  }
  logDebug(`getTransactionHistory DB success: count=${data?.length ?? 0}`);
  return { success: true, data: data ?? [] }
}
