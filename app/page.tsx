import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRoleFromUserMetadata, resolveUserRole, getDashboardPathForRole } from '@/lib/utils/auth-routing';

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let role = getRoleFromUserMetadata(user);

  if (!role) {
    role = await resolveUserRole(supabase, user.id, user);
  }

  const targetPath = getDashboardPathForRole(role);
  redirect(targetPath);
}
