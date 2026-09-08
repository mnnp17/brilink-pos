'use server';

import { getSupabaseClient, getCurrentUserContext } from '@/lib/supabase/action-auth';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import type { CashflowType, AdminFeeRule } from '@/app/(dashboard)/services/types/catalog-master';

export interface ServiceCategoryRow {
  id: string;
  outlet_id: string;
  name: string;
  slug: string;
  icon_name: string;
  badge_color: string;
  sort_order: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFeeTierRow {
  id: string;
  service_id: string;
  min_amount: number;
  max_amount?: number | null;
  customer_admin_fee: number;
  bank_fee_cogs: number;
  net_profit: number;
  sort_order: number;
  created_at: string;
}

export interface ServiceRow {
  id: string;
  outlet_id: string;
  category_id: string;
  default_account_id?: string | null;
  service_code: string;
  name: string;
  fee_type: 'FLAT' | 'TIERED' | 'PERCENTAGE';
  min_tx_amount: number;
  max_tx_amount?: number | null;
  flat_customer_admin?: number | null;
  flat_bank_fee_cogs?: number | null;
  percentage_customer_admin?: number | null;
  percentage_bank_fee_cogs?: number | null;
  max_percentage_cap?: number | null;
  is_active: boolean;
  is_deleted: boolean;
  cashflow_type?: 'ADD_CASH' | 'REDUCE_CASH' | 'MUTATION_ONLY' | 'TRANSFER_FLEXIBLE' | 'TRANSFER_STORE_BALANCE' | 'TRANSFER_CUSTOMER_BALANCE' | null;
  admin_fee_rule?: 'MANDATORY_CASH' | 'MANDATORY_DEDUCTED' | 'FLEXIBLE' | null;
  admin_fee_editable?: boolean | null;
  min_admin_fee?: number | null;
  max_admin_fee?: number | null;
  requires_customer_ref?: boolean | null;
  customer_ref_label?: string | null;
  created_at: string;
  updated_at: string;
  service_categories?: Pick<ServiceCategoryRow, 'name' | 'slug' | 'badge_color'>;
  service_fee_tiers?: ServiceFeeTierRow[];
  accounts?: { id: string; name: string; account_number: string } | null;
}

export interface AccountOption {
  id: string;
  name: string;
  account_number: string;
  type: string;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function logDebug(message: string) {
  const logFile = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\e47a547a-5006-406c-9b8b-c8c07f796bf2/scratch/debug.log';
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
  } catch (e) {}
}

export async function getServiceCategories(): Promise<ActionResult<ServiceCategoryRow[]>> {
  const supabase = await getSupabaseClient();
  const { outletId, error: ctxError } = await getCurrentUserContext();
  if (!outletId) return { success: false, error: ctxError };
  const { data, error } = await supabase.from('service_categories').select('*').eq('outlet_id', outletId).eq('is_deleted', false).order('sort_order', { ascending: true });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

export async function createServiceCategory(input: { name: string; slug: string; icon_name?: string; badge_color?: string }): Promise<ActionResult<ServiceCategoryRow>> {
  logDebug(`createServiceCategory: input=${JSON.stringify(input)}`);
  const supabase = await getSupabaseClient();
  const { outletId, error: ctxError } = await getCurrentUserContext();
  logDebug(`createServiceCategory: outletId=${outletId}, ctxError=${ctxError}`);
  if (!outletId) return { success: false, error: ctxError };

  // Calculate next sort_order sequentially to prevent integer overflow
  const { data: maxCat } = await supabase
    .from('service_categories')
    .select('sort_order')
    .eq('outlet_id', outletId)
    .eq('is_deleted', false)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = maxCat ? (maxCat.sort_order + 1) : 1;

  const { data, error } = await supabase.from('service_categories').insert({ outlet_id: outletId, name: input.name.trim(), slug: input.slug.toLowerCase().trim().replace(/\s+/g, '-'), icon_name: input.icon_name ?? 'Folder', badge_color: input.badge_color ?? 'blue', sort_order: nextSortOrder }).select().single();
  logDebug(`createServiceCategory result: data=${JSON.stringify(data)}, error=${JSON.stringify(error)}`);
  if (error) return { success: false, error: error.message };
  revalidatePath('/services');
  return { success: true, data };
}

export async function updateServiceCategory(id: string, input: Partial<{ name: string; slug: string; icon_name: string; badge_color: string; is_active: boolean; sort_order: number }>): Promise<ActionResult> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('service_categories').update(input).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/services');
  return { success: true };
}

export async function deleteServiceCategory(id: string): Promise<ActionResult> {
  const supabase = await getSupabaseClient();
  const { count } = await supabase.from('services').select('id', { count: 'exact', head: true }).eq('category_id', id).eq('is_deleted', false);
  if (count && count > 0) return { success: false, error: 'Tidak dapat menghapus kategori yang masih memiliki layanan aktif.' };
  const { error } = await supabase.from('service_categories').update({ is_deleted: true }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/services');
  return { success: true };
}

export async function getServices(): Promise<ActionResult<ServiceRow[]>> {
  const supabase = await getSupabaseClient();
  const { outletId, error: ctxError } = await getCurrentUserContext();
  if (!outletId) return { success: false, error: ctxError };
  const { data, error } = await supabase.from('services').select('*, service_categories(name, slug, badge_color), accounts(id, name, account_number), service_fee_tiers(*)').eq('outlet_id', outletId).eq('is_deleted', false).order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

export async function getOutletAccounts(): Promise<ActionResult<AccountOption[]>> {
  const supabase = await getSupabaseClient();
  const { outletId, error: ctxError } = await getCurrentUserContext();
  if (!outletId) return { success: false, error: ctxError };
  const { data, error } = await supabase.from('accounts').select('id, name, account_number, type, balance, min_threshold').eq('outlet_id', outletId).eq('is_deleted', false).order('name', { ascending: true });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

export async function createService(input: {
  category_id: string; service_code: string; name: string;
  fee_type: 'FLAT' | 'TIERED' | 'PERCENTAGE'; default_account_id?: string;
  min_tx_amount?: number; max_tx_amount?: number;
  flat_customer_admin?: number; flat_bank_fee_cogs?: number;
  percentage_customer_admin?: number; percentage_bank_fee_cogs?: number; max_percentage_cap?: number;
  is_active?: boolean;
  cashflow_type?: CashflowType;
  admin_fee_rule?: AdminFeeRule;
  admin_fee_editable?: boolean;
  min_admin_fee?: number;
  max_admin_fee?: number;
  requires_customer_ref?: boolean;
  customer_ref_label?: string;
  tier_rules?: Array<{ min_amount: number; max_amount?: number; customer_admin_fee: number; bank_fee_cogs: number; sort_order?: number }>;
}): Promise<ActionResult<ServiceRow>> {
  const supabase = await getSupabaseClient();
  const { outletId, error: ctxError } = await getCurrentUserContext();
  if (!outletId) return { success: false, error: ctxError };
  const { tier_rules, ...serviceData } = input;
  const { data: service, error: svcError } = await supabase.from('services').insert({
    outlet_id: outletId,
    category_id: serviceData.category_id,
    service_code: serviceData.service_code.toUpperCase().trim(),
    name: serviceData.name.trim(),
    fee_type: serviceData.fee_type,
    is_active: serviceData.is_active !== false,
    default_account_id: serviceData.default_account_id ?? null,
    min_tx_amount: serviceData.min_tx_amount ?? 0,
    max_tx_amount: serviceData.max_tx_amount ?? null,
    flat_customer_admin: serviceData.flat_customer_admin ?? null,
    flat_bank_fee_cogs: serviceData.flat_bank_fee_cogs ?? null,
    percentage_customer_admin: serviceData.percentage_customer_admin ?? null,
    percentage_bank_fee_cogs: serviceData.percentage_bank_fee_cogs ?? null,
    max_percentage_cap: serviceData.max_percentage_cap ?? null,
    cashflow_type: serviceData.cashflow_type ?? 'MUTATION_ONLY',
    admin_fee_rule: serviceData.admin_fee_rule ?? 'FLEXIBLE',
    admin_fee_editable: serviceData.admin_fee_editable ?? false,
    min_admin_fee: serviceData.min_admin_fee ?? 0,
    max_admin_fee: serviceData.max_admin_fee ?? 50000,
    requires_customer_ref: serviceData.requires_customer_ref ?? false,
    customer_ref_label: serviceData.customer_ref_label ?? null,
  }).select().single();
  if (svcError) return { success: false, error: svcError.message };
  if (serviceData.fee_type === 'TIERED' && tier_rules && tier_rules.length > 0) {
    const { error: tierError } = await supabase.from('service_fee_tiers').insert(tier_rules.map((tier, index) => ({ service_id: service.id, min_amount: tier.min_amount, max_amount: tier.max_amount ?? null, customer_admin_fee: tier.customer_admin_fee, bank_fee_cogs: tier.bank_fee_cogs, sort_order: tier.sort_order ?? index })));
    if (tierError) return { success: false, error: 'Layanan dibuat, tapi gagal simpan tier: ' + tierError.message };
  }
  revalidatePath('/services');
  return { success: true, data: service };
}

export async function updateService(id: string, input: Partial<Omit<Parameters<typeof createService>[0], 'tier_rules'>> & { tier_rules?: Parameters<typeof createService>[0]['tier_rules'] }): Promise<ActionResult> {
  const supabase = await getSupabaseClient();
  const { tier_rules, ...serviceData } = input;
  const { error: svcError } = await supabase.from('services').update({ ...serviceData, updated_at: new Date().toISOString() }).eq('id', id);
  if (svcError) return { success: false, error: svcError.message };
  if (tier_rules !== undefined) {
    await supabase.from('service_fee_tiers').delete().eq('service_id', id);
    if (tier_rules.length > 0) await supabase.from('service_fee_tiers').insert(tier_rules.map((tier, index) => ({ service_id: id, min_amount: tier.min_amount, max_amount: tier.max_amount ?? null, customer_admin_fee: tier.customer_admin_fee, bank_fee_cogs: tier.bank_fee_cogs, sort_order: tier.sort_order ?? index })));
  }
  revalidatePath('/services');
  return { success: true };
}

export async function deleteService(id: string): Promise<ActionResult> {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('services').update({ is_deleted: true, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/services');
  return { success: true };
}
