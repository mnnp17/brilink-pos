'use server'

import { createClient } from '@/lib/supabase/server'
import { openShiftSchema, closeShiftSchema } from '@/lib/validations/transaction.schema'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function openShift(opening_cash: number): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Tidak terautentikasi' }

  const validation = openShiftSchema.safeParse({ opening_cash })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  // Check if there's already an open shift
  const { data: existingShift } = await supabase
    .from('shifts')
    .select('id')
    .eq('kasir_id', user.id)
    .eq('status', 'open')
    .single()

  if (existingShift) return { success: false, error: 'Anda sudah memiliki shift yang sedang buka' }

  // Get user profile for name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: shift, error } = await supabase
    .from('shifts')
    .insert({
      kasir_id: user.id,
      kasir_name: profile?.full_name ?? 'Unknown',
      opening_cash: validation.data.opening_cash,
      status: 'open',
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: shift }
}

export async function closeShift(shiftId: string, closing_cash: number): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Tidak terautentikasi' }

  const validation = closeShiftSchema.safeParse({ closing_cash })
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const { data: result, error } = await supabase.rpc('close_shift', {
    p_shift_id: shiftId,
    p_closing_cash: validation.data.closing_cash,
    p_closed_by: user.id,
  })

  if (error) return { success: false, error: error.message }
  if (!result?.success) return { success: false, error: result?.error ?? 'Gagal menutup shift' }

  return { success: true, data: result }
}

export async function getShiftSummary(shiftId: string) {
  const supabase = await createClient()

  const [{ data: shift }, { data: transactions }] = await Promise.all([
    supabase.from('shifts').select('*').eq('id', shiftId).single(),
    supabase
      .from('transactions')
      .select('*')
      .eq('shift_id', shiftId)
      .eq('is_deleted', false)
      .neq('status', 'void'),
  ])

  const totalTransactions = transactions?.length ?? 0
  const totalNominal = transactions?.reduce((sum, t) => sum + t.nominal, 0) ?? 0
  const totalFee = transactions?.reduce((sum, t) => sum + t.fee_amount, 0) ?? 0
  const totalProfit = transactions?.reduce((sum, t) => sum + t.profit_amount, 0) ?? 0
  const totalCashIn = transactions?.reduce((sum, t) => sum + t.cash_in, 0) ?? 0
  const totalCashOut = transactions?.reduce((sum, t) => sum + t.cash_out, 0) ?? 0

  return {
    shift,
    totalTransactions,
    totalNominal,
    totalFee,
    totalProfit,
    totalCashIn,
    totalCashOut,
    expectedCash: (shift?.opening_cash ?? 0) + totalCashIn - totalCashOut,
  }
}
