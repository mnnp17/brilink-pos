import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyDeveloperAccess } from '@/lib/api/verify-developer';

export async function POST(request: Request) {
  const auth = await verifyDeveloperAccess();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { email, password, full_name, role, outlet_id, force_change_password } =
      await request.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Field wajib belum lengkap' }, { status: 400 });
    }

    const admin = createAdminClient();
    const dbRole = role === 'KASIR' ? 'KARYAWAN' : role;

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: dbRole },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    const { error: profileError } = await admin.from('profiles').insert({
      id: userId,
      email,
      full_name,
      role,
      outlet_id: outlet_id || null,
    });

    if (profileError && profileError.code !== '42P01') {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    const { error: userError } = await admin.from('users').insert({
      id: userId,
      email,
      name: full_name,
      role: dbRole,
      outlet_id: outlet_id || null,
      must_change_password: force_change_password ?? true,
    });

    if (userError && userError.code !== '42P01') {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'User created successfully', userId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
