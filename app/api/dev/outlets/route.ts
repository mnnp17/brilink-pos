import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyDeveloperAccess } from '@/lib/api/verify-developer';

const MOCK_OUTLETS = [
  { id: '1', name: 'Kios Sudirman Raya', city: 'Jakarta Pusat', mid: 'MID-100293', status: 'ACTIVE', cash: 12500000, digital: 45000000 },
  { id: '2', name: 'Toko Makmur Jaya', city: 'Bandung', mid: 'MID-100294', status: 'ACTIVE', cash: 8420000, digital: 12000000 },
  { id: '3', name: 'Warung Bu Tejo', city: 'Surabaya', mid: 'MID-100295', status: 'ERROR', cash: 3150000, digital: 8000000 },
  { id: '4', name: 'Minimarket Lestari', city: 'Semarang', mid: 'MID-100296', status: 'ACTIVE', cash: 15800000, digital: 32000000 },
];

function parseOutletMeta(address?: string | null) {
  if (!address) return { city: '-', mid: '-', phone: '-' };
  const cityMatch = address.match(/,\s*([^|]+)/);
  const midMatch = address.match(/MID:\s*([^|]+)/);
  return {
    city: cityMatch?.[1]?.trim() ?? '-',
    mid: midMatch?.[1]?.trim() ?? '-',
    phone: address.match(/WA:\s*([^|]+)/)?.[1]?.trim() ?? '-',
  };
}

export async function GET() {
  const auth = await verifyDeveloperAccess();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();

  const { data: legacyOutlets } = await admin
    .from('outlets')
    .select('id, name, city, mid_tid, status, address')
    .order('name');

  if (legacyOutlets && legacyOutlets.length > 0 && 'city' in legacyOutlets[0]) {
    const outletIds = legacyOutlets.map((o) => o.id);
    const { data: balances } = await admin
      .from('outlet_balances')
      .select('outlet_id, cash_balance, digital_balance')
      .in('outlet_id', outletIds);

    const balanceMap = new Map(
      (balances ?? []).map((b) => [b.outlet_id, b])
    );

    const outlets = legacyOutlets.map((o) => ({
      id: o.id,
      name: o.name,
      city: o.city ?? '-',
      mid: o.mid_tid ?? '-',
      status: o.status ?? 'ACTIVE',
      cash: Number(balanceMap.get(o.id)?.cash_balance ?? 0),
      digital: Number(balanceMap.get(o.id)?.digital_balance ?? 0),
    }));

    return NextResponse.json({ outlets, source: 'database' });
  }

  const { data: outletsData } = await admin
    .from('outlets')
    .select('id, name, address, is_deleted')
    .eq('is_deleted', false)
    .order('name');

  if (outletsData && outletsData.length > 0) {
    const outletIds = outletsData.map((o) => o.id);
    const { data: accounts } = await admin
      .from('accounts')
      .select('outlet_id, name, balance')
      .in('outlet_id', outletIds)
      .eq('is_deleted', false);

    const outlets = outletsData.map((o) => {
      const outletAccounts = (accounts ?? []).filter((a) => a.outlet_id === o.id);
      const cashAccount = outletAccounts.find((a) =>
        a.name.toLowerCase().includes('tunai')
      );
      const digitalAccount = outletAccounts.find((a) =>
        a.name.toLowerCase().includes('digital') || a.name.toLowerCase().includes('rekening')
      );
      const meta = parseOutletMeta(o.address);

      return {
        id: o.id,
        name: o.name,
        city: meta.city,
        mid: meta.mid,
        status: 'ACTIVE',
        cash: Number(cashAccount?.balance ?? 0),
        digital: Number(digitalAccount?.balance ?? 0),
      };
    });

    return NextResponse.json({ outlets, source: 'database' });
  }

  return NextResponse.json({ outlets: MOCK_OUTLETS, source: 'mock' });
}
