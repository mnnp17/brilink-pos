-- ============================================================
-- BRILink POS Digital — Create Database Roles
-- Copy this SQL to Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- Create kasir role
CREATE ROLE kasir LOGIN PASSWORD 'kasir123' INHERIT;

-- Create owner role
CREATE ROLE owner LOGIN PASSWORD 'owner123' INHERIT;

-- Create developer role
CREATE ROLE developer LOGIN PASSWORD 'dev123' INHERIT;

-- Grant authenticated role to all three
GRANT authenticated TO kasir, owner, developer;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO kasir, owner, developer;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO kasir, owner, developer;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO kasir, owner, developer;

-- Grant function execution
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO kasir, owner, developer;
