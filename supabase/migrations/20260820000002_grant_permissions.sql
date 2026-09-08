-- ====================================================================
-- BRILink POS Digital — Grant Schema & Table Privileges for Supabase API
-- Copy this SQL to Supabase Dashboard > SQL Editor > Run
-- ====================================================================

-- 1. Grant usage on schema public to standard Supabase API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO kasir, owner, developer;

-- 2. Grant permissions on ALL existing tables, sequences, and functions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kasir, owner, developer;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kasir, owner, developer;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO kasir, owner, developer;

-- 3. Configure default privileges so any FUTURE tables automatically get these grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO kasir, owner, developer;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO kasir, owner, developer;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO kasir, owner, developer;
