-- ============================================================
-- BRILink POS Digital — RLS Policies
-- Migration 002: Row Level Security
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: Get current user role
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
-- Users can see their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Developer and Owner can see all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (get_user_role() IN ('developer', 'owner'));

-- Developer and Owner can insert profiles (for creating kasir accounts)
CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT WITH CHECK (get_user_role() IN ('developer', 'owner'));

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Developer and Owner can update any profile
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (get_user_role() IN ('developer', 'owner'));

-- Only developer can delete profiles
CREATE POLICY "profiles_delete_developer" ON public.profiles
  FOR DELETE USING (get_user_role() = 'developer');

-- ============================================================
-- STORE ACCOUNTS POLICIES
-- ============================================================
-- All authenticated users can view active accounts
CREATE POLICY "accounts_select_all" ON public.store_accounts
  FOR SELECT USING (auth.role() = 'authenticated' AND is_deleted = false);

-- Only Owner and Developer can manage accounts
CREATE POLICY "accounts_insert_admin" ON public.store_accounts
  FOR INSERT WITH CHECK (get_user_role() IN ('developer', 'owner'));

CREATE POLICY "accounts_update_admin" ON public.store_accounts
  FOR UPDATE USING (get_user_role() IN ('developer', 'owner'));

CREATE POLICY "accounts_delete_developer" ON public.store_accounts
  FOR DELETE USING (get_user_role() = 'developer');

-- ============================================================
-- SHIFTS POLICIES
-- ============================================================
-- All authenticated can view shifts
CREATE POLICY "shifts_select_all" ON public.shifts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Kasir can only open their own shift; Owner/Developer can open any
CREATE POLICY "shifts_insert" ON public.shifts
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    (
      (get_user_role() = 'kasir' AND kasir_id = auth.uid()) OR
      get_user_role() IN ('developer', 'owner')
    )
  );

-- Kasir can update their own shift; Owner/Developer can update any
CREATE POLICY "shifts_update" ON public.shifts
  FOR UPDATE USING (
    (get_user_role() = 'kasir' AND kasir_id = auth.uid()) OR
    get_user_role() IN ('developer', 'owner')
  );

-- ============================================================
-- TRANSACTIONS POLICIES
-- ============================================================
-- All authenticated users can view non-deleted transactions
CREATE POLICY "transactions_select_all" ON public.transactions
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    (
      is_deleted = false OR
      get_user_role() IN ('developer', 'owner')
    )
  );

-- All authenticated can create transactions
CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only Owner/Developer can void/update transactions
CREATE POLICY "transactions_update_admin" ON public.transactions
  FOR UPDATE USING (get_user_role() IN ('developer', 'owner'));

-- Only developer can hard delete
CREATE POLICY "transactions_delete_developer" ON public.transactions
  FOR DELETE USING (get_user_role() = 'developer');

-- ============================================================
-- AUDIT LOGS POLICIES (READ ONLY for owner/developer)
-- ============================================================
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (get_user_role() IN ('developer', 'owner'));

-- ============================================================
-- FEE CONFIG POLICIES
-- ============================================================
-- All authenticated can read fee config
CREATE POLICY "fee_config_select_all" ON public.fee_config
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only Owner/Developer can manage
CREATE POLICY "fee_config_manage_admin" ON public.fee_config
  FOR ALL USING (get_user_role() IN ('developer', 'owner'));

-- ============================================================
-- Grant permissions to authenticated role
-- ============================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION process_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION close_shift TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role TO authenticated;
