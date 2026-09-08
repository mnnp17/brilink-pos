import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyDeveloperAccess } from '@/lib/api/verify-developer';

export async function GET() {
  const auth = await verifyDeveloperAccess();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();

  const [ownersResult, outletsResult] = await Promise.all([
    admin
      .from('users')
      .select('id, name, email')
      .eq('role', 'OWNER')
      .eq('is_deleted', false)
      .order('name'),
    admin
      .from('outlets')
      .select('id, name, address')
      .eq('is_deleted', false)
      .order('name'),
  ]);

  let owners = ownersResult.data ?? [];
  let outlets = outletsResult.data ?? [];

  if (owners.length === 0) {
    const { data: profileOwners } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'OWNER');
    owners = (profileOwners ?? []).map((p) => ({
      id: p.id,
      name: p.full_name ?? p.email,
      email: p.email,
    }));
  }

  if (outlets.length === 0) {
    const { data: legacyOutlets } = await admin.from('outlets').select('id, name, city, address');
    outlets = legacyOutlets ?? [];
  }

  return NextResponse.json({ owners, outlets });
}
