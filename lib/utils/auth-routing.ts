import type { SupabaseClient, User } from '@supabase/supabase-js';

export function getRoleFromUserMetadata(user: Pick<User, 'user_metadata'>): string | null {
  const role = user.user_metadata?.role;
  if (typeof role === 'string' && role.trim()) {
    return role.toUpperCase();
  }
  return null;
}

export function getDashboardPathForRole(role: string | null | undefined): string {
  const userRole = role?.toUpperCase();

  if (userRole === 'DEVELOPER') {
    return '/developer';
  }

  if (userRole === 'KASIR' || userRole === 'KARYAWAN') {
    return '/pos';
  }

  if (userRole === 'OWNER') {
    return '/dashboard';
  }

  return '/pos';
}

export async function resolveUserRole(
  supabase: SupabaseClient,
  userId: string,
  user?: Pick<User, 'user_metadata'>
): Promise<string | null> {
  if (user) {
    const roleFromMetadata = getRoleFromUserMetadata(user);
    if (roleFromMetadata) {
      return roleFromMetadata;
    }
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (userProfile?.role) {
    return userProfile.role.toUpperCase();
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  return profile?.role?.toUpperCase() ?? null;
}
