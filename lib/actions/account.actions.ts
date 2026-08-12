'use server'

import { createClient } from '@/lib/supabase/server'
import { createAccountSchema, type CreateAccountInput } from '@/lib/validations/transaction.schema'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createAccount(input: CreateAccountInput): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Tidak terautentikasi' }

  const validation = createAccountSchema.safeParse(input)
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message }

  const data = validation.data
  const { data: account, error } = await supabase
    .from('store_accounts')
    .insert({
      ...data,
      current_balance: data.initial_balance,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data: account }
}

export async function updateAccount(id: string, input: Partial<CreateAccountInput>): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('store_accounts')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('store_accounts')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
