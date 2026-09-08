'use server';

import { getSupabaseClient, getCurrentUserContext } from '@/lib/supabase/action-auth';
import { revalidatePath } from 'next/cache';

export interface ExpenseCategoryRow {
  id: string;
  outlet_id: string;
  name: string;
  code: string;
  badge_color: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
}

export interface ExpenseRow {
  id: string;
  outlet_id: string;
  category_id: string;
  actor_id: string;
  amount: number;
  description: string;
  receipt_url?: string | null;
  expense_date: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  expense_categories?: Pick<ExpenseCategoryRow, 'name' | 'code' | 'badge_color'>;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getExpenseCategories(): Promise<ActionResult<ExpenseCategoryRow[]>> {
  const supabase = await getSupabaseClient();
  const { outletId, error: ctxError } = await getCurrentUserContext();
  if (!outletId) return { success: false, error: ctxError };
  const { data, error } = await supabase.from('expense_categories').select('*').eq('outlet_id', outletId).eq('is_deleted', false).order('sort_order', { ascending: true });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

export async function createExpenseCategory(input: { name: string; code: string; badge_color?: string }): Promise<ActionResult<ExpenseCategoryRow>> {
  const supabase = await getSupabaseClient();
  const { outletId, error: ctxError } = await getCurrentUserContext();
  if (!outletId) return { success: false, error: ctxError };

  // Calculate next sort_order sequentially to prevent integer overflow
  const { data: maxCat } = await supabase
    .from('expense_categories')
    .select('sort_order')
    .eq('outlet_id', outletId)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = maxCat ? (maxCat.sort_order + 1) : 1;

  const { data, error } = await supabase.from('expense_categories').insert({
    outlet_id: outletId,
    name: input.name.trim(),
    code: input.code.toUpperCase().trim(),
    badge_color: input.badge_color ?? 'slate',
    sort_order: nextSortOrder,
  }).select().single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/expenses');
  return { success: true, data };
}

export async function updateExpenseCategory(id: string, input: Partial<{ name: string; code: string; badge_color: string; sort_order: number }>): Promise<ActionResult> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('expense_categories').update(input).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/expenses');
  return { success: true };
}

export async function deleteExpenseCategory(id: string): Promise<ActionResult> {
  const supabase = await getSupabaseClient();
  const { count } = await supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('category_id', id).eq('is_deleted', false);
  if (count && count > 0) return { success: false, error: 'Tidak dapat menghapus kategori yang masih memiliki pengeluaran aktif.' };
  const { error } = await supabase.from('expense_categories').update({ is_deleted: true }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/expenses');
  return { success: true };
}

export async function getExpenses(params?: { month?: string }): Promise<ActionResult<ExpenseRow[]>> {
  const supabase = await getSupabaseClient();
  const { outletId, error: ctxError } = await getCurrentUserContext();
  if (!outletId) return { success: false, error: ctxError };
  let query = supabase.from('expenses').select('*, expense_categories(name, code, badge_color)').eq('outlet_id', outletId).eq('is_deleted', false).order('expense_date', { ascending: false }).order('created_at', { ascending: false });
  if (params?.month) {
    const start = params.month + '-01';
    const endDate = new Date(params.month + '-01');
    endDate.setMonth(endDate.getMonth() + 1);
    const end = endDate.toISOString().slice(0, 10);
    query = query.gte('expense_date', start).lt('expense_date', end);
  }
  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

export async function createExpense(input: { category_id: string; amount: number; description: string; expense_date: string; receipt_url?: string }): Promise<ActionResult<ExpenseRow>> {
  const supabase = await getSupabaseClient();
  const { outletId, userId, error: ctxError } = await getCurrentUserContext();
  if (!outletId || !userId) return { success: false, error: ctxError };
  if (input.amount <= 0) return { success: false, error: 'Nominal harus lebih dari 0' };
  if (!input.description.trim()) return { success: false, error: 'Deskripsi harus diisi' };
  const { data, error } = await supabase.from('expenses').insert({ outlet_id: outletId, actor_id: userId, category_id: input.category_id, amount: input.amount, description: input.description.trim(), expense_date: input.expense_date, receipt_url: input.receipt_url ?? null }).select('*, expense_categories(name, code, badge_color)').single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/expenses');
  return { success: true, data };
}

export async function updateExpense(id: string, input: Partial<{ category_id: string; amount: number; description: string; expense_date: string; receipt_url: string | null }>): Promise<ActionResult> {
  const supabase = await getSupabaseClient();
  if (input.amount !== undefined && input.amount <= 0) return { success: false, error: 'Nominal harus lebih dari 0' };
  const { error } = await supabase.from('expenses').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/expenses');
  return { success: true };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('expenses').update({ is_deleted: true, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/expenses');
  return { success: true };
}
