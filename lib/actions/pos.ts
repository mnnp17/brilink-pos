'use server';

import fs from 'fs';
import { getSupabaseClient, getCurrentUserContext } from '@/lib/supabase/action-auth';
import { transactionSchema, batchSyncSchema } from '@/lib/validations/pos';

function logDebug(message: string) {
  const logFile = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\e47a547a-5006-406c-9b8b-c8c07f796bf2/scratch/debug.log';
  try {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
  } catch (e) {}
}

export async function processTransactionAction(inputData: unknown) {
  logDebug(`processTransactionAction: input=${JSON.stringify(inputData)}`);
  const parseResult = transactionSchema.safeParse(inputData);
  if (!parseResult.success) {
    logDebug(`processTransactionAction validation failed: ${parseResult.error.issues[0].message}`);
    return {
      success: false,
      error: parseResult.error.issues[0].message,
    };
  }

  const supabase = await getSupabaseClient();
  const { userId, outletId, error: ctxError } = await getCurrentUserContext();
  logDebug(`processTransactionAction context: userId=${userId}, outletId=${outletId}, ctxError=${ctxError}`);

  if (!userId || !outletId) {
    return {
      success: false,
      error: ctxError ?? 'Sesi kasir telah berakhir. Silakan login kembali.',
    };
  }

  const { shiftId, accountId, type, amount, adminFee, bankFee, paymentMethod, idempotencyKey } = parseResult.data;

  // Execute atomic dual-balance transaction RPC procedure in Postgres
  logDebug(`processTransactionAction RPC calling process_pos_transaction with paymentMethod=${paymentMethod}...`);
  const { data: rpcResult, error: rpcError } = await supabase.rpc('process_pos_transaction', {
    p_shift_id: shiftId,
    p_account_id: accountId,
    p_type: type,
    p_amount: amount,
    p_admin_fee: adminFee,
    p_bank_fee: bankFee ?? 0,
    p_idempotency_key: idempotencyKey,
    p_user_id: userId,
    p_outlet_id: outletId,
    p_payment_method: paymentMethod || 'CASH',
  });

  if (rpcError) {
    logDebug(`processTransactionAction RPC error: ${JSON.stringify(rpcError)}`);
    // Check if error is custom Postgres exception
    let errorMessage = rpcError.message;
    if (errorMessage.includes('SALDO_TIDAK_MENCUKUPI')) {
      errorMessage = 'Gagal: Saldo digital rekening tidak mencukupi untuk transaksi ini.';
    } else if (errorMessage.includes('SHIFT_INVALID_OR_CLOSED')) {
      errorMessage = 'Gagal: Shift kasir tidak aktif atau telah ditutup.';
    } else if (errorMessage.includes('ACCOUNT_NOT_FOUND')) {
      errorMessage = 'Gagal: Rekening/EDC pilihan tidak ditemukan atau telah dihapus.';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }

  logDebug(`processTransactionAction RPC success: result=${JSON.stringify(rpcResult)}`);
  return {
    success: true,
    data: rpcResult,
    message: 'Transaksi POS berhasil diproses.',
  };
}

export async function syncBatchAction(localTransactionsInput: unknown) {
  const parseResult = batchSyncSchema.safeParse(localTransactionsInput);
  if (!parseResult.success) {
    return {
      success: false,
      error: `Format batch sinkronisasi tidak valid: ${parseResult.error.issues[0].message}`,
      syncedIds: [],
    };
  }

  const localTransactions = parseResult.data;
  const syncedIds: string[] = [];
  const errors: Array<{ idempotencyKey: string; error: string }> = [];

  for (const tx of localTransactions) {
    const result = await processTransactionAction(tx);
    if (result.success) {
      syncedIds.push(tx.idempotencyKey);
    } else {
      errors.push({
        idempotencyKey: tx.idempotencyKey,
        error: result.error || 'Gagal sinkronisasi transaksi',
      });
    }
  }

  return {
    success: true,
    totalReceived: localTransactions.length,
    syncedCount: syncedIds.length,
    syncedIds,
    errors,
    message: `Berhasil menyinkronkan ${syncedIds.length} dari ${localTransactions.length} transaksi offline.`,
  };
}

export async function executeRebalanceAction(input: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  notes?: string;
}) {
  const supabase = await getSupabaseClient();
  const { userId, outletId, error: ctxError } = await getCurrentUserContext();

  if (!userId || !outletId) {
    return {
      success: false,
      error: ctxError ?? 'Sesi telah berakhir. Silakan login kembali.',
    };
  }

  // 1. Find the active open shift for this user (if any)
  const { data: activeShift } = await supabase
    .from('shifts')
    .select('id')
    .eq('user_id', userId)
    .eq('outlet_id', outletId)
    .eq('status', 'OPEN')
    .maybeSingle();

  const shiftId = activeShift?.id || null;

  // 2. Call the database RPC `process_rebalance`
  const { data: rpcResult, error: rpcError } = await supabase.rpc('process_rebalance', {
    p_outlet_id: outletId,
    p_actor_id: userId,
    p_shift_id: shiftId,
    p_from_account_id: input.fromAccountId,
    p_to_account_id: input.toAccountId,
    p_amount: input.amount,
    p_notes: input.notes || null,
  });

  if (rpcError) {
    let errorMessage = rpcError.message;
    if (errorMessage.includes('SALDO_TIDAK_MENCUKUPI')) {
      errorMessage = 'Gagal: Saldo rekening sumber tidak mencukupi.';
    } else if (errorMessage.includes('FROM_ACCOUNT_NOT_FOUND')) {
      errorMessage = 'Gagal: Rekening sumber tidak ditemukan.';
    } else if (errorMessage.includes('TO_ACCOUNT_NOT_FOUND')) {
      errorMessage = 'Gagal: Rekening tujuan tidak ditemukan.';
    }
    return {
      success: false,
      error: errorMessage,
    };
  }

  return {
    success: true,
    data: rpcResult,
    message: 'Rebalance berhasil diproses.',
  };
}
