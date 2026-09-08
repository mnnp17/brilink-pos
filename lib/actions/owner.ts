'use server';

import { getSupabaseClient, getCurrentUserContext } from '@/lib/supabase/action-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createEmployeeSchema, createAccountSchema } from '@/lib/validations/owner';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createEmployeeAction(inputData: unknown) {
  const parseResult = createEmployeeSchema.safeParse(inputData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0].message,
    };
  }

  const supabase = await getSupabaseClient();
  const { userId } = await getCurrentUserContext();

  // Check current user role
  const { data: currentProfile } = await supabase
    .from('users')
    .select('role, id')
    .eq('id', userId || '')
    .single();

  if (!currentProfile || (currentProfile.role !== 'OWNER' && currentProfile.role !== 'DEVELOPER')) {
    return {
      success: false,
      error: 'Akses ditolak: Hanya Owner atau Developer yang dapat membuat akun kasir.',
    };
  }

  const { name, username, outletId, initialPassword } = parseResult.data;
  
  // Format automatic email domain for employee
  const generatedEmail = `${username.toLowerCase()}@brilink.com`;
  const adminClient = createAdminClient();

  // 1. Create auth user via admin client
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: generatedEmail,
    password: initialPassword,
    email_confirm: true,
    user_metadata: { name, role: 'KARYAWAN' },
  });

  if (authError || !authUser.user) {
    return {
      success: false,
      error: `Gagal membuat akun auth kasir: ${authError?.message}`,
    };
  }

  const employeeId = authUser.user.id;

  // 2. Insert user record into public.users
  const { error: profileError } = await adminClient.from('users').insert({
    id: employeeId,
    email: generatedEmail,
    name,
    role: 'KARYAWAN',
    owner_id: currentProfile.id,
    outlet_id: outletId,
    must_change_password: true,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(employeeId);
    return {
      success: false,
      error: `Gagal membuat profil kasir: ${profileError.message}`,
    };
  }

  return {
    success: true,
    employeeId,
    email: generatedEmail,
    message: `Akun kasir ${name} berhasil dibuat.`,
  };
}

export async function createAccountAction(inputData: unknown) {
  const parseResult = createAccountSchema.safeParse(inputData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0].message,
    };
  }

  const supabase = await getSupabaseClient();
  const { userId } = await getCurrentUserContext();

  const { data: currentProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId || '')
    .single();

  if (!currentProfile || (currentProfile.role !== 'OWNER' && currentProfile.role !== 'DEVELOPER')) {
    return {
      success: false,
      error: 'Akses ditolak: Hanya Owner atau Developer yang dapat menambah rekening/EDC.',
    };
  }

  const { outletId, name, accountNumber, initialBalance, minThreshold, type } = parseResult.data;

  const { data: newAccount, error: insertError } = await supabase
    .from('accounts')
    .insert({
      outlet_id: outletId,
      name,
      account_number: accountNumber,
      balance: initialBalance,
      min_threshold: minThreshold,
      type: type,
    })
    .select('id')
    .single();

  if (insertError || !newAccount) {
    return {
      success: false,
      error: `Gagal menambahkan rekening/EDC: ${insertError?.message}`,
    };
  }

  return {
    success: true,
    accountId: newAccount.id,
    message: `Rekening/EDC ${name} (${accountNumber}) berhasil ditambahkan.`,
  };
}

export async function getOwnerTransactions(): Promise<ActionResult<any[]>> {
  const supabase = await getSupabaseClient()
  const { outletId, error: ctxError } = await getCurrentUserContext()
  if (!outletId) return { success: false, error: ctxError }

  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts(id, name, account_number), users:user_id(id, name, role)')
    .eq('outlet_id', outletId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: data ?? [] }
}

export async function getCashierActivityFeedAction(limitPerType = 50, startDate?: string, endDate?: string): Promise<ActionResult<any[]>> {
  const supabase = await getSupabaseClient()
  const { outletId, error: ctxError } = await getCurrentUserContext()
  if (!outletId) return { success: false, error: ctxError }

  const feed: any[] = []

  // 1. Transactions
  let txQuery = supabase
    .from('transactions')
    .select('id, shift_id, created_at, amount, admin_fee, total_cash_change, digital_change, type, user_id, account_id, accounts(id, name), users:user_id(id, name)')
    .eq('outlet_id', outletId)
    .order('created_at', { ascending: false })
    .limit(limitPerType);

  if (startDate) txQuery = txQuery.gte('created_at', startDate);
  if (endDate) txQuery = txQuery.lte('created_at', endDate);

  const { data: txs, error: txError } = await txQuery;
  if (txError) {
    console.error('getCashierActivityFeedAction txError:', txError);
  }

  txs?.forEach((tx: any) => {
    const typeLabel = tx.type === 'TARIK_TUNAI' ? 'Tarik Tunai' : tx.type === 'SETOR_TUNAI' ? 'Setor Tunai' : 'Transfer / PPOB';
    const impacts = [];
    if (tx.account_id && tx.digital_change) {
      impacts.push({
        accountId: tx.account_id,
        accountName: tx.accounts?.name || 'Rekening Digital',
        balanceBefore: 0,
        changeAmount: Number(tx.digital_change || 0),
        balanceAfter: 0,
      });
    }

    feed.push({
      id: `tx-${tx.id}`,
      timestamp: tx.created_at,
      cashierId: tx.user_id ?? '-',
      cashierName: tx.users?.name ?? 'Kasir',
      shiftId: tx.shift_id ?? '-',
      activityType: 'TRANSACTION',
      title: typeLabel.toUpperCase(),
      summary: `${typeLabel} • Rp ${Number(tx.amount ?? 0).toLocaleString('id-ID')} (Admin: Rp ${Number(tx.admin_fee ?? 0).toLocaleString('id-ID')})`,
      notes: `Total Kas: ${Number(tx.total_cash_change ?? 0) >= 0 ? '+' : ''}Rp ${Number(tx.total_cash_change ?? 0).toLocaleString('id-ID')}`,
      deviceInfo: 'Terminal POS',
      transactionId: tx.id,
      impacts: impacts,
    })
  })

  // 2. Rebalances
  let rebQuery = supabase
    .from('rebalances')
    .select('id, reference_number, created_at, amount, from_account_id, to_account_id, shift_id, actor_id, notes, accounts_from:from_account_id(name), accounts_to:to_account_id(name), users:actor_id(name)')
    .eq('outlet_id', outletId)
    .order('created_at', { ascending: false })
    .limit(limitPerType);

  if (startDate) rebQuery = rebQuery.gte('created_at', startDate);
  if (endDate) rebQuery = rebQuery.lte('created_at', endDate);

  const { data: rebs, error: rebError } = await rebQuery;
  if (rebError) {
    console.error('getCashierActivityFeedAction rebError:', rebError);
  }

  rebs?.forEach((rb: any) => {
    feed.push({
      id: `rb-${rb.id}`,
      timestamp: rb.created_at,
      cashierId: rb.actor_id ?? '-',
      cashierName: rb.users?.name ?? 'Kasir',
      shiftId: rb.shift_id ?? '-',
      activityType: 'REBALANCE',
      title: 'PINDAH SALDO',
      summary: `Rp ${Number(rb.amount ?? 0).toLocaleString('id-ID')} (${rb.accounts_from?.name ?? 'Asal'} → ${rb.accounts_to?.name ?? 'Tujuan'})`,
      notes: rb.notes || '',
      deviceInfo: rb.reference_number || '',
      impacts: [
        {
          accountId: rb.from_account_id,
          accountName: rb.accounts_from?.name ?? 'Asal',
          balanceBefore: 0,
          changeAmount: -Number(rb.amount || 0),
          balanceAfter: 0,
        },
        {
          accountId: rb.to_account_id,
          accountName: rb.accounts_to?.name ?? 'Tujuan',
          balanceBefore: 0,
          changeAmount: Number(rb.amount || 0),
          balanceAfter: 0,
        },
      ],
    })
  })

  // 3. Shifts
  let shiftQuery = supabase
    .from('shifts')
    .select('id, opened_at, closed_at, start_cash, expected_cash, actual_cash, difference_cash, status, user_id, notes, users:user_id(name)')
    .eq('outlet_id', outletId)
    .order('opened_at', { ascending: false })
    .limit(limitPerType);

  if (startDate) shiftQuery = shiftQuery.gte('opened_at', startDate);
  if (endDate) shiftQuery = shiftQuery.lte('opened_at', endDate);

  const { data: shifts, error: shiftError } = await shiftQuery;
  if (shiftError) {
    console.error('getCashierActivityFeedAction shiftError:', shiftError);
  }

  shifts?.forEach((sh: any) => {
    if (sh.opened_at) {
      feed.push({
        id: `shift-start-${sh.id}`,
        timestamp: sh.opened_at,
        cashierId: sh.user_id ?? '-',
        cashierName: sh.users?.name ?? 'Kasir',
        shiftId: sh.id,
        activityType: 'SHIFT_START',
        title: 'PEMBUKAAN SHIFT',
        summary: `Buka shift kasir • Modal awal kas: Rp ${Number(sh.start_cash ?? 0).toLocaleString('id-ID')}`,
        notes: sh.notes || '',
        deviceInfo: `Status: ${sh.status}`,
        impacts: [],
      })
    }
    if (sh.closed_at && sh.status === 'CLOSED') {
      const diff = Number(sh.difference_cash || 0);
      const diffText = diff === 0 ? '✓ Sesuai (Match)' : diff > 0 ? `+Rp ${diff.toLocaleString('id-ID')} (Surplus)` : `-Rp ${Math.abs(diff).toLocaleString('id-ID')} (Defisit)`;

      feed.push({
        id: `shift-end-${sh.id}`,
        timestamp: sh.closed_at,
        cashierId: sh.user_id ?? '-',
        cashierName: sh.users?.name ?? 'Kasir',
        shiftId: sh.id,
        activityType: 'SHIFT_END',
        title: 'PENUTUPAN SHIFT',
        summary: `Tutup shift kasir • Fisik laci: Rp ${Number(sh.actual_cash ?? 0).toLocaleString('id-ID')} (${diffText})`,
        notes: sh.notes || '',
        deviceInfo: `Status: CLOSED`,
        impacts: [],
      })
    }
  })

  // 4. Expenses
  let expQuery = supabase
    .from('expenses')
    .select('id, created_at, amount, description, actor_id, category_id, expense_categories(name), users:actor_id(name)')
    .eq('outlet_id', outletId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limitPerType);

  if (startDate) expQuery = expQuery.gte('created_at', startDate);
  if (endDate) expQuery = expQuery.lte('created_at', endDate);

  const { data: exps, error: expError } = await expQuery;
  if (expError) {
    console.error('getCashierActivityFeedAction expError:', expError);
  }

  exps?.forEach((exp: any) => {
    const catName = exp.expense_categories?.name || 'OPEX';
    feed.push({
      id: `exp-${exp.id}`,
      timestamp: exp.created_at,
      cashierId: exp.actor_id ?? '-',
      cashierName: exp.users?.name ?? 'Kasir',
      shiftId: '-',
      activityType: 'EXPENSE_ADD',
      title: 'PENGELUARAN OPEX',
      summary: `${catName}: ${exp.description ?? 'Biaya Operasional'} • Rp ${Number(exp.amount ?? 0).toLocaleString('id-ID')}`,
      notes: exp.description || '',
      deviceInfo: catName,
      expenseId: exp.id,
      impacts: [],
    })
  })

  // Sort by timestamp desc
  feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return { success: true, data: feed }
}

export async function getOwnerDashboardStats(): Promise<ActionResult<any>> {
  const supabase = await getSupabaseClient()
  const { outletId, error: ctxError } = await getCurrentUserContext()
  if (!outletId) return { success: false, error: ctxError }

  // 1. Get all transactions for outlet
  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('created_at, amount, admin_fee, bank_fee, net_profit')
    .eq('outlet_id', outletId);

  if (txError) {
    console.error('getOwnerDashboardStats txError:', txError);
    return { success: false, error: txError.message };
  }

  // 2. Get all accounts for outlet
  const { data: accs, error: accError } = await supabase
    .from('accounts')
    .select('name, balance, type, min_threshold')
    .eq('outlet_id', outletId)
    .eq('is_deleted', false);

  if (accError) {
    console.error('getOwnerDashboardStats accError:', accError);
    return { success: false, error: accError.message };
  }

  // 3. Get all shifts for low cash discrepancy counts
  const { data: shifts, error: shiftError } = await supabase
    .from('shifts')
    .select('status, difference_cash')
    .eq('outlet_id', outletId);

  if (shiftError) {
    console.error('getOwnerDashboardStats shiftError:', shiftError);
  }

  const unmatchedShiftsCount = shifts?.filter(s => s.status === 'CLOSED' && Number(s.difference_cash || 0) !== 0).length || 0;

  // Compute stats
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  
  // start of this week (Sunday)
  const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0,0,0,0)
  
  // start of this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

  let netProfitToday = 0
  let netProfitWeekly = 0
  let netProfitMonthly = 0
  let grossVolumeToday = 0
  let transactionCountToday = 0

  txs?.forEach(tx => {
    const txTime = new Date(tx.created_at).getTime()
    const profit = Number(tx.net_profit || 0)
    const amount = Number(tx.amount || 0)

    if (txTime >= startOfDay) {
      netProfitToday += profit
      grossVolumeToday += amount
      transactionCountToday += 1
    }
    if (txTime >= firstDayOfWeek) {
      netProfitWeekly += profit
    }
    if (txTime >= startOfMonth) {
      netProfitMonthly += profit
    }
  })

  let totalDigitalLiquidity = 0;
  let totalPhysicalCash = 0;
  const lowBalanceAccounts: string[] = [];

  accs?.forEach(acc => {
    const balance = Number(acc.balance || 0);
    const minThreshold = Number(acc.min_threshold || 0);
    const typeUpper = (acc.type || '').toUpperCase();

    if (typeUpper === 'CASH_DRAWER' || typeUpper === 'CASH') {
      totalPhysicalCash += balance;
    } else {
      totalDigitalLiquidity += balance;
      if (minThreshold > 0 && balance < minThreshold) {
        lowBalanceAccounts.push(`${acc.name} (Rp ${balance.toLocaleString('id-ID')})`);
      }
    }
  });

  // Check if there is an active OPEN shift for live cashier drawer cash
  const { data: openShift } = await supabase
    .from('shifts')
    .select('expected_cash')
    .eq('outlet_id', outletId)
    .eq('status', 'OPEN')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openShift) {
    totalPhysicalCash = Number(openShift.expected_cash || 0);
  }

  return {
    success: true,
    data: {
      netProfitToday,
      netProfitWeekly,
      netProfitMonthly,
      totalDigitalLiquidity,
      totalPhysicalCash,
      grossVolumeToday,
      transactionCountToday,
      alerts: {
        lowBalanceAccounts,
        unmatchedShiftsCount,
      }
    }
  }
}

export async function getOutletEmployees(): Promise<ActionResult<any[]>> {
  const supabase = await getSupabaseClient()
  const { outletId, error: ctxError } = await getCurrentUserContext()
  if (!outletId) return { success: false, error: ctxError }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('outlet_id', outletId)
    .eq('role', 'KARYAWAN')
    .eq('is_deleted', false)

  if (error) return { success: false, error: error.message }
  return { success: true, data: data ?? [] }
}

export async function getAccountMutationsAction(accountId: string): Promise<ActionResult<any[]>> {
  const supabase = await getSupabaseClient();
  const { outletId, error: ctxError } = await getCurrentUserContext();
  if (!outletId) return { success: false, error: ctxError };

  const { data, error } = await supabase
    .from('account_mutations')
    .select(`
      id,
      account_id,
      type,
      amount,
      balance_before,
      balance_after,
      created_at,
      transactions (
        reference_number,
        transaction_type,
        services (name),
        users (name)
      ),
      rebalances (
        reference_number,
        notes,
        actor_id
      )
    `)
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };

  // Fetch full names of actors for rebalances manually to avoid complex join issues
  const actorIds = Array.from(new Set((data || []).map((m: any) => m.rebalances?.actor_id).filter(Boolean)));
  let actorsMap: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: actors } = await supabase.from('users').select('id, name').in('id', actorIds);
    (actors || []).forEach((a: any) => {
      actorsMap[a.id] = a.name;
    });
  }

  const mapped = (data || []).map((m: any) => {
    let description = '';
    let executedBy = 'Sistem';
    let mutationType: any = 'MANUAL_ADJUSTMENT';
    
    // In database, type in mutations is either 'DEBIT' (money out) or 'KREDIT' (money in)
    const direction: 'IN' | 'OUT' = m.type === 'KREDIT' ? 'IN' : 'OUT';

    if (m.transactions) {
      const tx = m.transactions;
      const serviceName = tx.services?.name || tx.transaction_type || 'Transaksi';
      description = `${serviceName} (Ref: ${tx.reference_number})`;
      executedBy = tx.users?.name || 'Kasir';
      mutationType = 'POS_TRANSACTION';
    } else if (m.rebalances) {
      const rb = m.rebalances;
      description = rb.notes || `Rebalance internal (Ref: ${rb.reference_number})`;
      executedBy = actorsMap[rb.actor_id] || 'Owner';
      mutationType = 'INTERNAL_REBALANCE';
    } else {
      description = m.type === 'MANUAL_ADJUSTMENT' ? 'Adjustment Saldo Manual' : 'Adjustment Manual';
      mutationType = 'MANUAL_ADJUSTMENT';
    }

    return {
      id: m.id,
      accountId: m.account_id,
      mutationType,
      direction,
      amount: Number(m.amount),
      balanceBefore: Number(m.balance_before),
      balanceAfter: Number(m.balance_after),
      description,
      executedBy,
      createdAt: m.created_at,
    };
  });

  return { success: true, data: mapped };
}

export async function adjustAccountBalanceAction(input: {
  accountId: string;
  actualBalance: number;
  reasonCategory: string;
  notes: string;
  discrepancy: number;
}) {
  const supabase = await getSupabaseClient();
  const { userId, outletId, error: ctxError } = await getCurrentUserContext();
  if (!userId || !outletId) {
    return { success: false, error: ctxError ?? 'Sesi telah berakhir. Silakan login kembali.' };
  }

  // 1. Get current balance for audit mutation
  const { data: acc, error: findError } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', input.accountId)
    .single();

  if (findError || !acc) {
    return { success: false, error: 'Akun tidak ditemukan.' };
  }

  const balanceBefore = Number(acc.balance);
  const balanceAfter = input.actualBalance;

  // 2. Perform transaction to update balance and insert mutation
  const { error: updateError } = await supabase
    .from('accounts')
    .update({ balance: balanceAfter, updated_at: new Date().toISOString() })
    .eq('id', input.accountId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // 3. Insert mutation log
  const direction = input.discrepancy >= 0 ? 'KREDIT' : 'DEBIT';
  const { error: mutError } = await supabase
    .from('account_mutations')
    .insert({
      account_id: input.accountId,
      type: direction,
      amount: Math.abs(input.discrepancy),
      balance_before: balanceBefore,
      balance_after: balanceAfter,
    });

  return { success: true, message: 'Adjustment saldo berhasil disimpan.' };
}

export async function resetEmployeePasswordAction(employeeId: string, newPin: string): Promise<ActionResult<void>> {
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(employeeId, {
    password: newPin,
  });

  if (error) {
    return { success: false, error: `Gagal memperbarui PIN kasir: ${error.message}` };
  }

  return { success: true };
}

export async function toggleEmployeeActivationAction(employeeId: string, isActive: boolean): Promise<ActionResult<void>> {
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('users')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', employeeId);

  if (error) {
    return { success: false, error: `Gagal mengubah status kasir: ${error.message}` };
  }

  // Also update auth user status: ban if not active
  await adminClient.auth.admin.updateUserById(employeeId, {
    ban_duration: isActive ? 'none' : '24h',
  });

  return { success: true };
}

export async function deleteEmployeeAction(employeeId: string): Promise<ActionResult<void>> {
  const adminClient = createAdminClient();
  
  // Set is_deleted = true in users table
  const { error } = await adminClient
    .from('users')
    .update({ is_deleted: true, is_active: false, updated_at: new Date().toISOString() })
    .eq('id', employeeId);

  if (error) {
    return { success: false, error: `Gagal menghapus kasir dari database: ${error.message}` };
  }

  // Delete from Supabase Auth
  await adminClient.auth.admin.deleteUser(employeeId);

  return { success: true };
}
