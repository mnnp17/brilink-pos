import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyDeveloperAccess } from '@/lib/api/verify-developer';

const MOCK_USERS = [
  { id: '1', name: 'Budi Santoso', email: 'budi.dev@brilink.com', role: 'DEVELOPER', outlet: '-', status: 'Online' },
  { id: '2', name: 'Siti Aminah', email: 'siti.owner@brilink.com', role: 'OWNER', outlet: 'Semua Outlet', status: 'Offline' },
  { id: '3', name: 'Ahmad Faisal', email: 'ahmad.kasir@brilink.com', role: 'KASIR', outlet: 'Kios Sudirman Raya', status: 'Online' },
  { id: '4', name: 'Dewi Lestari', email: 'dewi.karyawan@brilink.com', role: 'KARYAWAN', outlet: 'Toko Makmur Jaya', status: 'Offline' },
];

export async function GET() {
  const auth = await verifyDeveloperAccess();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();

  const { data: usersData } = await admin
    .from('users')
    .select('id, name, email, role, outlet_id, is_deleted')
    .eq('is_deleted', false)
    .order('name');

  if (usersData && usersData.length > 0) {
    const outletIds = [...new Set(usersData.map((u) => u.outlet_id).filter(Boolean))];
    let outletMap = new Map<string, string>();

    if (outletIds.length > 0) {
      const { data: outlets } = await admin
        .from('outlets')
        .select('id, name')
        .in('id', outletIds as string[]);
      outletMap = new Map((outlets ?? []).map((o) => [o.id, o.name]));
    }

    const users = usersData.map((u) => ({
      id: u.id,
      name: u.name || u.email,
      email: u.email,
      role: u.role,
      outlet: u.outlet_id ? (outletMap.get(u.outlet_id) ?? '-') : 'Semua Outlet',
      status: 'Offline' as const,
    }));

    return NextResponse.json({ users, source: 'database' });
  }

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, name, email, role, outlet_id')
    .order('name');

  if (profiles && profiles.length > 0) {
    const users = profiles.map((p) => ({
      id: p.id,
      name: p.name ?? p.email,
      email: p.email,
      role: p.role,
      outlet: p.outlet_id ? String(p.outlet_id) : '-',
      status: 'Offline' as const,
    }));
    return NextResponse.json({ users, source: 'database' });
  }

  return NextResponse.json({ users: MOCK_USERS, source: 'mock' });
}
