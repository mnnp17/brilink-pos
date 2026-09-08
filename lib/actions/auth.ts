'use server';

import { createClient } from '@/lib/supabase/server';
import { loginSchema, changePasswordSchema } from '@/lib/validations/auth';

export async function loginAction(formData: FormData | Record<string, unknown>) {
  const rawData = formData instanceof FormData 
    ? Object.fromEntries(formData.entries())
    : formData;

  const parseResult = loginSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0].message,
    };
  }

  const { email, password } = parseResult.data;
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || 'Login gagal. Email atau password salah.',
    };
  }

  // Fetch user profile from public.users
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, role, owner_id, outlet_id, must_change_password')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      error: 'Profil pengguna tidak ditemukan di database.',
    };
  }

  return {
    success: true,
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      ownerId: profile.owner_id,
      outletId: profile.outlet_id,
      mustChangePassword: profile.must_change_password,
    },
  };
}

export async function changePasswordAction(newPasswordInput: string) {
  const parseResult = changePasswordSchema.safeParse({
    newPassword: newPasswordInput,
    confirmPassword: newPasswordInput,
  });

  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0].message,
    };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: 'Sesi pengguna tidak valid. Silakan login kembali.',
    };
  }

  // Update password in Supabase Auth
  const { error: updateAuthError } = await supabase.auth.updateUser({
    password: parseResult.data.newPassword,
  });

  if (updateAuthError) {
    return {
      success: false,
      error: updateAuthError.message,
    };
  }

  // Update must_change_password flag in public.users
  const { error: updateProfileError } = await supabase
    .from('users')
    .update({
      must_change_password: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateProfileError) {
    return {
      success: false,
      error: 'Password diperbarui, namun gagal memperbarui status profil.',
    };
  }

  return {
    success: true,
    message: 'Password berhasil diperbarui.',
  };
}
