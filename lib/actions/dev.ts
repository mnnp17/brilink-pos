'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createOwnerAndOutletSchema, impersonateOwnerSchema } from '@/lib/validations/dev';

export async function createOwnerAndOutletAction(inputData: unknown) {
  const parseResult = createOwnerAndOutletSchema.safeParse(inputData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0].message,
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Ensure current user is DEVELOPER
  const { data: currentProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id || '')
    .single();

  if (currentProfile?.role !== 'DEVELOPER') {
    return {
      success: false,
      error: 'Akses ditolak: Hanya DEVELOPER yang dapat mendaftarkan Owner baru.',
    };
  }

  const { ownerEmail, ownerName, ownerPassword, outletName, outletAddress } = parseResult.data;
  const adminClient = createAdminClient();

  // 1. Create auth user for Owner via Admin Client
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
    user_metadata: { name: ownerName, role: 'OWNER' },
  });

  if (authError || !authUser.user) {
    return {
      success: false,
      error: `Gagal membuat akun auth Owner: ${authError?.message}`,
    };
  }

  const ownerId = authUser.user.id;

  // 2. Insert record into public.users (Owner)
  const { error: userInsertError } = await adminClient.from('users').insert({
    id: ownerId,
    email: ownerEmail,
    name: ownerName,
    role: 'OWNER',
    must_change_password: true,
  });

  if (userInsertError) {
    await adminClient.auth.admin.deleteUser(ownerId);
    return {
      success: false,
      error: `Gagal membuat profil Owner: ${userInsertError.message}`,
    };
  }

  // 3. Create primary Outlet for Owner
  const { data: outletData, error: outletError } = await adminClient
    .from('outlets')
    .insert({
      name: outletName,
      owner_id: ownerId,
      address: outletAddress || '',
    })
    .select('id')
    .single();

  if (outletError || !outletData) {
    await adminClient.from('users').delete().eq('id', ownerId);
    await adminClient.auth.admin.deleteUser(ownerId);
    return {
      success: false,
      error: `Gagal membuat Outlet utama: ${outletError?.message}`,
    };
  }

  // 4. Update owner's outlet_id
  await adminClient
    .from('users')
    .update({ outlet_id: outletData.id })
    .eq('id', ownerId);

  return {
    success: true,
    ownerId,
    outletId: outletData.id,
    message: 'Owner dan Outlet berhasil didaftarkan.',
  };
}

export async function impersonateOwnerAction(inputData: unknown) {
  const parseResult = impersonateOwnerSchema.safeParse(inputData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.issues[0].message,
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id || '')
    .single();

  if (currentProfile?.role !== 'DEVELOPER') {
    return {
      success: false,
      error: 'Akses ditolak: Hanya DEVELOPER yang dapat melakukan impersonasi.',
    };
  }

  const adminClient = createAdminClient();
  const { ownerId } = parseResult.data;

  // Get owner details
  const { data: ownerUser, error: ownerError } = await adminClient
    .from('users')
    .select('email, role')
    .eq('id', ownerId)
    .single();

  if (ownerError || !ownerUser || ownerUser.role !== 'OWNER') {
    return {
      success: false,
      error: 'Akun Owner tidak ditemukan atau role tidak sesuai.',
    };
  }

  // Generate magic link / impersonation access token
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: ownerUser.email,
  });

  if (linkError || !linkData.properties?.action_link) {
    return {
      success: false,
      error: `Gagal membuat token impersonasi: ${linkError?.message}`,
    };
  }

  // Record impersonation event in audit_logs
  await adminClient.from('audit_logs').insert({
    table_name: 'users',
    record_id: ownerId,
    action: 'IMPERSONATE',
    performed_by: ownerId,
    impersonated_by: user?.id,
  });

  return {
    success: true,
    impersonateUrl: linkData.properties.action_link,
    message: `Mode impersonasi untuk ${ownerUser.email} berhasil disiapkan.`,
  };
}

export async function addOutletAction(name: string, ownerId: string, address: string = '') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id || '')
    .single();

  if (currentProfile?.role !== 'DEVELOPER') {
    throw new Error('Akses ditolak: Hanya DEVELOPER yang dapat menambahkan outlet.');
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('outlets')
    .insert({
      name,
      owner_id: ownerId,
      address,
      is_deleted: false
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function editOutletAction(id: string, name: string, address: string = '') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id || '')
    .single();

  if (currentProfile?.role !== 'DEVELOPER') {
    throw new Error('Akses ditolak: Hanya DEVELOPER yang dapat mengubah outlet.');
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('outlets')
    .update({
      name,
      address,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

export async function deleteOutletAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: currentProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id || '')
    .single();

  if (currentProfile?.role !== 'DEVELOPER') {
    throw new Error('Akses ditolak: Hanya DEVELOPER yang dapat menghapus outlet.');
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('outlets')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
