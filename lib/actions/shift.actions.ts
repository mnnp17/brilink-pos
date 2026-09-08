'use server'

import { getSupabaseClient, getCurrentUserContext } from '@/lib/supabase/action-auth'
import { openShiftSchema, closeShiftSchema } from '@/lib/validations/transaction.schema'
import type { PreviousShiftInfo } from '@/types/shift'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function getPreviousShiftInfo(): Promise<ActionResult<PreviousShiftInfo | null>> {
  const supabase = await getSupabaseClient()
  const { userId, error: ctxError } = await getCurrentUserContext()
  if (!userId) return { success: false, error: ctxError }

  // Get the most recently closed shift for this user
  const { data, error } = await supabase
    .from('shifts')
    .select('actual_cash, closed_at, user_id')
    .eq('user_id', userId)
    .eq('status', 'CLOSED')
    .order('closed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: true, data: null }
  }

  // Get the user's name from profiles/users
  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', data.user_id)
    .maybeSingle()

  return {
    success: true,
    data: {
      closingBalance: Number(data.actual_cash || 0),
      closedByName: profile?.name ?? 'Kasir',
      closedAt: data.closed_at,
    }
  }
}

export async function openShift(opening_cash: number): Promise<ActionResult<any>> {
  const supabase = await getSupabaseClient()
  const { userId, outletId, error: ctxError } = await getCurrentUserContext()
  if (!userId || !outletId) return { success: false, error: ctxError }

  const validation = openShiftSchema.safeParse({ opening_cash })
  if (!validation.success) return { success: false, error: validation.error.issues[0]?.message }

  // Check if there's already an open shift
  const { data: existingShift } = await supabase
    .from('shifts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'OPEN')
    .maybeSingle()

  if (existingShift) return { success: false, error: 'Anda sudah memiliki shift yang sedang aktif' }

  const { data: shift, error } = await supabase
    .from('shifts')
    .insert({
      user_id: userId,
      outlet_id: outletId,
      start_cash: validation.data.opening_cash,
      expected_cash: validation.data.opening_cash,
      status: 'OPEN',
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: shift }
}

export async function closeShift(shiftId: string, closing_cash: number, notes?: string): Promise<ActionResult> {
  const supabase = await getSupabaseClient()
  const { userId, error: ctxError } = await getCurrentUserContext()
  if (!userId) return { success: false, error: ctxError }

  const validation = closeShiftSchema.safeParse({ closing_cash })
  if (!validation.success) return { success: false, error: validation.error.issues[0]?.message }

  // Get the shift to compute difference
  const { data: shift, error: shiftError } = await supabase
    .from('shifts')
    .select('expected_cash')
    .eq('id', shiftId)
    .single()

  if (shiftError || !shift) return { success: false, error: 'Shift tidak ditemukan' }

  const actualCash = validation.data.closing_cash
  const differenceCash = actualCash - Number(shift.expected_cash)

  const { error } = await supabase
    .from('shifts')
    .update({
      actual_cash: actualCash,
      difference_cash: differenceCash,
      status: 'CLOSED',
      closed_at: new Date().toISOString(),
    })
    .eq('id', shiftId)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }

  return { success: true }
}

export async function getShiftSummary(shiftId: string) {
  const supabase = await getSupabaseClient()

  const [{ data: shift }, { data: transactions }] = await Promise.all([
    supabase.from('shifts').select('*').eq('id', shiftId).single(),
    supabase
      .from('transactions')
      .select('*')
      .eq('shift_id', shiftId),
  ])

  const totalTransactions = transactions?.length ?? 0
  const totalNominal = transactions?.reduce((sum, t) => sum + Number(t.amount ?? 0), 0) ?? 0
  const totalFee = transactions?.reduce((sum, t) => sum + Number(t.admin_fee ?? 0), 0) ?? 0
  const totalCashIn = transactions
    ?.filter(t => Number(t.total_cash_change) > 0)
    .reduce((sum, t) => sum + Number(t.total_cash_change ?? 0), 0) ?? 0
  const totalCashOut = transactions
    ?.filter(t => Number(t.total_cash_change) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.total_cash_change ?? 0)), 0) ?? 0

  return {
    shift,
    totalTransactions,
    totalNominal,
    totalFee,
    totalProfit: 0,
    totalCashIn,
    totalCashOut,
    expectedCash: Number(shift?.expected_cash ?? 0),
  }
}

export async function getActiveShift(kasirId: string): Promise<ActionResult<any>> {
  const supabase = await getSupabaseClient()
  const { userId, error: ctxError } = await getCurrentUserContext()
  if (!userId) return { success: false, error: ctxError }

  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'OPEN')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function getShiftTransactions(shiftId: string): Promise<ActionResult<any[]>> {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts(id, name, account_number, type)')
    .eq('shift_id', shiftId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data ?? [] }
}

export async function getStoreAccounts(): Promise<ActionResult<any[]>> {
  const supabase = await getSupabaseClient()
  const { outletId, error: ctxError } = await getCurrentUserContext()
  if (!outletId) return { success: false, error: ctxError }

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('outlet_id', outletId)
    .eq('is_deleted', false)
    .order('name', { ascending: true })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data ?? [] }
}
