import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyDeveloperAccess } from '@/lib/api/verify-developer';

export async function POST(request: Request) {
  const auth = await verifyDeveloperAccess();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { name, city, mid_tid, owner_id, phone, address, initial_cash, initial_digital } =
      await request.json();

    if (!name || !owner_id) {
      return NextResponse.json({ error: 'Nama outlet dan owner wajib diisi' }, { status: 400 });
    }

    const admin = createAdminClient();
    const fullAddress = [address, city ? `, ${city}` : '', mid_tid ? ` | MID: ${mid_tid}` : '', phone ? ` | WA: ${phone}` : '']
      .filter(Boolean)
      .join('');

    const { data: outletData, error: outletError } = await admin
      .from('outlets')
      .insert({
        name,
        city: city ?? null,
        mid_tid: mid_tid ?? null,
        owner_id,
        phone: phone ?? null,
        address: fullAddress || address || '',
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (outletError) {
      const { data: fallbackOutlet, error: fallbackError } = await admin
        .from('outlets')
        .insert({
          name,
          owner_id,
          address: fullAddress || address || '',
        })
        .select()
        .single();

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 400 });
      }

      const outletId = fallbackOutlet.id;
      const cash = Number(initial_cash) || 0;
      const digital = Number(initial_digital) || 0;

      if (cash > 0) {
        await admin.from('accounts').insert({
          outlet_id: outletId,
          name: 'Tunai Laci',
          account_number: `CASH-${outletId.slice(0, 8)}`,
          balance: cash,
        });
      }

      if (digital > 0) {
        await admin.from('accounts').insert({
          outlet_id: outletId,
          name: 'Rekening Digital',
          account_number: `DIG-${outletId.slice(0, 8)}`,
          balance: digital,
        });
      }

      return NextResponse.json({ message: 'Outlet created successfully', outlet: fallbackOutlet });
    }

    const outletId = outletData.id;

    const { error: balanceError } = await admin.from('outlet_balances').insert({
      outlet_id: outletId,
      cash_balance: Number(initial_cash) || 0,
      digital_balance: Number(initial_digital) || 0,
    });

    if (balanceError && balanceError.code !== '42P01') {
      return NextResponse.json({ error: balanceError.message }, { status: 400 });
    }

    if (balanceError?.code === '42P01') {
      const cash = Number(initial_cash) || 0;
      const digital = Number(initial_digital) || 0;

      if (cash > 0) {
        await admin.from('accounts').insert({
          outlet_id: outletId,
          name: 'Tunai Laci',
          account_number: `CASH-${outletId.slice(0, 8)}`,
          balance: cash,
        });
      }

      if (digital > 0) {
        await admin.from('accounts').insert({
          outlet_id: outletId,
          name: 'Rekening Digital',
          account_number: `DIG-${outletId.slice(0, 8)}`,
          balance: digital,
        });
      }
    }

    return NextResponse.json({ message: 'Outlet created successfully', outlet: outletData });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
