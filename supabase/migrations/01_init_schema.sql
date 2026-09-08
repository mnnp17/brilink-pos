-- 1. Aktifkan Ekstensi Enkripsi
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Bersihkan Sisa Data Auth Lama (Jika Ada)
DELETE FROM auth.identities WHERE identity_data->>'email' = 'dev@brilink.com';
DELETE FROM auth.users WHERE email = 'dev@brilink.com';

-- 3. Buat Tabel public.profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('DEVELOPER', 'OWNER', 'KASIR')) DEFAULT 'KASIR',
  outlet_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Profiles Access" ON public.profiles;
CREATE POLICY "Public Profiles Access" ON public.profiles FOR ALL USING (true);

-- 5. Buat Function & Trigger Otomatisasi Profil saat User Terdaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kasir Outlet'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'KASIR')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Seeding Akun Developer Utama (dev@brilink.com / admin123)
DO $$
DECLARE
  dev_uid UUID := gen_random_uuid();
  dev_email TEXT := 'dev@brilink.com';
  dev_password TEXT := 'admin123';
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    aud,
    confirmation_token
  ) VALUES (
    dev_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    dev_email,
    crypt(dev_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"DEVELOPER","full_name":"Developer BRILink"}'::jsonb,
    NOW(),
    NOW(),
    'authenticated',
    ''
  );

  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    dev_uid::text,
    dev_uid,
    format('{"sub":"%s","email":"%s"}', dev_uid::text, dev_email)::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );
END $$;