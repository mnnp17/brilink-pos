import { createClient } from '@/lib/supabase/server';
import { resolveUserRole } from '@/lib/utils/auth-routing';

export async function verifyDeveloperAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false as const, status: 401, error: 'Unauthorized' };
  }

  const role = await resolveUserRole(supabase, user.id);

  if (role !== 'DEVELOPER') {
    return { authorized: false as const, status: 403, error: 'Forbidden: Developer access required' };
  }

  return { authorized: true as const, user, supabase };
}
