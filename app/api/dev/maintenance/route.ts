import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyDeveloperAccess } from '@/lib/api/verify-developer';

export async function GET() {
  const auth = await verifyDeveloperAccess();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .maybeSingle();

    return NextResponse.json({ maintenance: data?.value === 'true' || data?.value === true });
  } catch {
    return NextResponse.json({ maintenance: false });
  }
}

export async function POST(request: Request) {
  const auth = await verifyDeveloperAccess();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { enable } = await request.json();
    const admin = createAdminClient();

    const { error } = await admin.from('system_settings').upsert(
      {
        key: 'maintenance_mode',
        value: enable ? 'true' : 'false',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    if (error && error.code !== '42P01') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: `Maintenance mode ${enable ? 'enabled' : 'disabled'}`,
      maintenance: !!enable,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update maintenance mode';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
