'use server';

import { createClient } from '@/lib/supabase/server';
import { openShiftSchema, closeShiftSchema } from '@/lib/validations/shift';

export async function openShiftAction(inputData: unknown) {
  const parseResult = openShiftSchema.safeParse(inputData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0].message,
    };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'Sesi kasir tidak valid. Silakan login kembali.',
    };
  }

  const { startCash, outletId } = parseResult.data;

  // 1. Check if user already has an OPEN shift in this outlet
  const { data: existingShift } = await supabase
    .from('shifts')
    .select('id')
    .eq('user_id', user.id)
    .eq('outlet_id', outletId)
    .eq('status', 'OPEN')
    .maybeSingle();

  if (existingShift) {
    return {
      success: false,
      error: 'Kasir masih memiliki shift aktif berstatus OPEN. Tutup shift sebelumnya terlebih dahulu.',
      shiftId: existingShift.id,
    };
  }

  // 2. Open new shift
  const { data: newShift, error: insertError } = await supabase
    .from('shifts')
    .insert({
      user_id: user.id,
      outlet_id: outletId,
      start_cash: startCash,
      expected_cash: startCash,
      status: 'OPEN',
      opened_at: new Date().toISOString(),
    })
    .select('id, start_cash, opened_at')
    .single();

  if (insertError || !newShift) {
    return {
      success: false,
      error: `Gagal membuka shift baru: ${insertError?.message}`,
    };
  }

  return {
    success: true,
    shift: newShift,
    message: 'Shift baru berhasil dibuka. Selamat bertugas!',
  };
}

export async function closeShiftAction(inputData: unknown) {
  const parseResult = closeShiftSchema.safeParse(inputData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0].message,
    };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'Sesi kasir tidak valid. Silakan login kembali.',
    };
  }

  const { shiftId, actualCash } = parseResult.data;

  // 1. Retrieve active open shift
  const { data: shift, error: shiftError } = await supabase
    .from('shifts')
    .select('id, expected_cash, status, user_id')
    .eq('id', shiftId)
    .single();

  if (shiftError || !shift) {
    return {
      success: false,
      error: 'Shift tidak ditemukan.',
    };
  }

  if (shift.status !== 'OPEN') {
    return {
      success: false,
      error: 'Shift ini sudah ditutup sebelumnya.',
    };
  }

  if (shift.user_id !== user.id) {
    return {
      success: false,
      error: 'Akses ditolak: Shift ini milik kasir lain.',
    };
  }

  // 2. Blinded Closing calculation: difference = actual_cash - expected_cash
  const expectedCash = Number(shift.expected_cash || 0);
  const differenceCash = actualCash - expectedCash;
  const closedAt = new Date().toISOString();

  // 3. Update shift to CLOSED and record Blinded Closing values
  const { error: updateShiftError } = await supabase
    .from('shifts')
    .update({
      actual_cash: actualCash,
      difference_cash: differenceCash,
      status: 'CLOSED',
      closed_at: closedAt,
    })
    .eq('id', shiftId);

  if (updateShiftError) {
    return {
      success: false,
      error: `Gagal menutup shift: ${updateShiftError.message}`,
    };
  }

  // 4. Lock all transactions linked to this shift
  await supabase
    .from('transactions')
    .update({ is_locked: true })
    .eq('shift_id', shiftId);

  return {
    success: true,
    summary: {
      shiftId,
      expectedCash,
      actualCash,
      differenceCash,
      status: 'CLOSED',
      closedAt,
    },
    message: differenceCash === 0
      ? 'Shift berhasil ditutup! Kas fisik laci pas (tidak ada selisih).'
      : differenceCash > 0
        ? `Shift ditutup. Terdapat surplus kas sebesar Rp ${differenceCash.toLocaleString('id-ID')}.`
        : `Shift ditutup. Terdapat minus kas sebesar Rp ${Math.abs(differenceCash).toLocaleString('id-ID')}.`,
  };
}
