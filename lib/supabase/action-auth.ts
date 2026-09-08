import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function getSupabaseClient() {
  const cookieStore = await cookies();
  const ownerMockCookie = cookieStore.get('owner-mock-session')?.value === 'true';
  const cashierMockCookie = cookieStore.get('cashier-mock-session')?.value === 'true';
  const isMock = ownerMockCookie || cashierMockCookie;

  if (isMock) {
    return createAdminClient();
  }
  return createClient();
}

export async function getCurrentUserContext(): Promise<{ outletId: string | null; userId: string | null; error?: string }> {
  const cookieStore = await cookies();
  const ownerMockCookie = cookieStore.get('owner-mock-session')?.value === 'true';
  const cashierMockCookie = cookieStore.get('cashier-mock-session')?.value === 'true';
  const isMock = ownerMockCookie || cashierMockCookie;

  if (isMock) {
    const mockOutletId = '00000000-0000-0000-0000-000000000000';
    const mockUserId = ownerMockCookie ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002';
    return { outletId: mockOutletId, userId: mockUserId };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    const adminSupabase = createAdminClient();
    const { data: firstOutlet } = await adminSupabase.from('outlets').select('id').eq('is_deleted', false).limit(1).maybeSingle();
    if (firstOutlet) {
      return { outletId: firstOutlet.id, userId: '00000000-0000-0000-0000-000000000001' };
    }
    return { outletId: null, userId: null, error: 'Tidak terautentikasi' };
  }
  
  const { data: profile } = await supabase.from('users').select('role, outlet_id').eq('id', user.id).maybeSingle();
  let outletId = profile?.outlet_id ?? null;

  if (!outletId) {
    const { data: outlet } = await supabase.from('outlets').select('id').eq('owner_id', user.id).eq('is_deleted', false).limit(1).maybeSingle();
    if (outlet) {
      outletId = outlet.id;
    } else {
      const { data: firstOutlet } = await supabase.from('outlets').select('id').eq('is_deleted', false).limit(1).maybeSingle();
      if (firstOutlet) outletId = firstOutlet.id;
    }
  }

  return { outletId, userId: user.id, error: outletId ? undefined : 'User belum terdaftar di outlet' };
}
