'use server'

import { createClient } from '@/lib/supabase/server'
import { createTransactionSchema, type CreateTransactionInput } from '@/lib/validations/transaction.schema'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createTransaction(input: CreateTransactionInput): Promise<ActionResult> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Tidak terautentikasi' }
  }

  // Validate input
  const validation = createTransactionSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message ?? 'Input tidak valid' }
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
    p_created_by: user.id,
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
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('transactions')
    .update({
      status: 'void',
      void_reason: reason,
      voided_by: user.id,
      voided_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
