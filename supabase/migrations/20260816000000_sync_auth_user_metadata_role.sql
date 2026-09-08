-- Sync role from public.profiles into auth.users raw_user_meta_data
-- Run in Supabase SQL Editor if migration is not applied automatically.
-- Preserves existing metadata keys (e.g. full_name) while injecting role.

UPDATE auth.users u
SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE u.id = p.id
  AND (u.raw_user_meta_data->>'role' IS DISTINCT FROM p.role);
