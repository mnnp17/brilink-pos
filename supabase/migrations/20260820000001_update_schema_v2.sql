-- ============================================================
-- BRILink POS Digital — Schema Update v2
-- Migration: 20260820000001_update_schema_v2
-- Deskripsi: Penambahan fitur rebalance, services catalog, expenses,
--            kolom bank_fee, denominations shift, account type enum
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. ENUM TYPES BARU
-- ============================================================

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM (
    'CASH_DRAWER',
    'BANK_BRI',
    'EDC_TERMINAL',
    'PPOB_BALANCE'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fee_type AS ENUM ('FLAT', 'TIERED', 'PERCENTAGE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. ALTER TABEL accounts — tambah kolom type
-- ============================================================
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS type account_type NOT NULL DEFAULT 'BANK_BRI';

-- ============================================================
-- 3. ALTER TABEL shifts — tambah kolom denominations & notes
-- ============================================================
ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS denominations JSONB,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================
-- 4. ALTER TABEL transactions — tambah bank_fee, net_profit generated,
--    dan perkuat idempotency_key NOT NULL
-- ============================================================
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS bank_fee NUMERIC(15,2) NOT NULL DEFAULT 0.00;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'net_profit'
  ) THEN
    ALTER TABLE public.transactions
      ADD COLUMN net_profit NUMERIC(15,2) GENERATED ALWAYS AS (admin_fee - bank_fee) STORED;
  END IF;
END $$;

-- Set nilai default untuk baris lama yang idempotency_key-nya NULL
UPDATE public.transactions
  SET idempotency_key = 'legacy-' || id::TEXT
  WHERE idempotency_key IS NULL;

ALTER TABLE public.transactions
  ALTER COLUMN idempotency_key SET NOT NULL;

-- ============================================================
-- 5. TABEL rebalances — pemindahan saldo antar rekening
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rebalances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT UNIQUE NOT NULL,
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  from_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  to_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. ALTER account_mutations — tambah relasi ke rebalances
-- ============================================================
ALTER TABLE public.account_mutations
  ADD COLUMN IF NOT EXISTS rebalance_id UUID REFERENCES public.rebalances(id) ON DELETE SET NULL;

ALTER TABLE public.account_mutations
  DROP CONSTRAINT IF EXISTS chk_mutation_has_source;

ALTER TABLE public.account_mutations
  ADD CONSTRAINT chk_mutation_has_source
  CHECK (transaction_id IS NOT NULL OR rebalance_id IS NOT NULL);

-- ============================================================
-- 7. TABEL service_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Folder',
  badge_color TEXT NOT NULL DEFAULT 'blue',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (outlet_id, slug)
);

-- ============================================================
-- 8. TABEL services — katalog layanan dengan konfigurasi fee
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
  default_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  service_code TEXT NOT NULL,
  name TEXT NOT NULL,
  fee_type fee_type NOT NULL DEFAULT 'FLAT',
  min_tx_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  max_tx_amount NUMERIC(15,2),
  flat_customer_admin NUMERIC(15,2),
  flat_bank_fee_cogs NUMERIC(15,2),
  percentage_customer_admin NUMERIC(5,4),
  percentage_bank_fee_cogs NUMERIC(5,4),
  max_percentage_cap NUMERIC(15,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (outlet_id, service_code)
);

-- ============================================================
-- 9. TABEL service_fee_tiers — tarif bertingkat per layanan
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_fee_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  min_amount NUMERIC(15,2) NOT NULL,
  max_amount NUMERIC(15,2),
  customer_admin_fee NUMERIC(15,2) NOT NULL DEFAULT 0,
  bank_fee_cogs NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(15,2) GENERATED ALWAYS AS (customer_admin_fee - bank_fee_cogs) STORED,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. TABEL expense_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  badge_color TEXT NOT NULL DEFAULT 'slate',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (outlet_id, code)
);

-- ============================================================
-- 11. TABEL expenses — catatan pengeluaran operasional
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 12. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_rebalances_outlet ON public.rebalances(outlet_id);
CREATE INDEX IF NOT EXISTS idx_rebalances_shift ON public.rebalances(shift_id);

DROP INDEX IF EXISTS idx_account_mutations_account;
CREATE INDEX IF NOT EXISTS idx_account_mutations_account
  ON public.account_mutations(account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_services_outlet ON public.services(outlet_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_service_fee_tiers_service
  ON public.service_fee_tiers(service_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_expenses_outlet
  ON public.expenses(outlet_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_outlet
  ON public.expense_categories(outlet_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_outlet
  ON public.service_categories(outlet_id);

-- ============================================================
-- 13. TRIGGERS updated_at UNTUK TABEL BARU
-- ============================================================
DROP TRIGGER IF EXISTS trg_service_categories_updated_at ON public.service_categories;
CREATE TRIGGER trg_service_categories_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON public.expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 14. UPDATE RPC process_pos_transaction — tambah p_bank_fee
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_pos_transaction(
  p_idempotency_key TEXT,
  p_shift_id UUID,
  p_account_id UUID,
  p_outlet_id UUID,
  p_user_id UUID,
  p_type transaction_type,
  p_amount NUMERIC(15,2),
  p_admin_fee NUMERIC(15,2),
  p_bank_fee NUMERIC(15,2) DEFAULT 0.00
)
RETURNS JSONB AS $$
DECLARE
  v_transaction_id UUID;
  v_total_cash_change NUMERIC(15,2);
  v_digital_change NUMERIC(15,2);
  v_balance_before NUMERIC(15,2);
  v_balance_after NUMERIC(15,2);
  v_mutation_type mutation_type;
  v_shift_status shift_status;
BEGIN
  -- 1. Idempotency check
  IF EXISTS (SELECT 1 FROM public.transactions WHERE idempotency_key = p_idempotency_key) THEN
    SELECT id INTO v_transaction_id FROM public.transactions WHERE idempotency_key = p_idempotency_key;
    RETURN jsonb_build_object(
      'success', true,
      'status', 'IDEMPOTENT_SKIPPED',
      'transaction_id', v_transaction_id
    );
  END IF;

  -- 2. Validasi shift OPEN
  SELECT status INTO v_shift_status FROM public.shifts
    WHERE id = p_shift_id AND outlet_id = p_outlet_id AND user_id = p_user_id;

  IF v_shift_status IS NULL OR v_shift_status != 'OPEN' THEN
    RAISE EXCEPTION 'SHIFT_INVALID_OR_CLOSED: Shift tidak aktif atau telah ditutup.';
  END IF;

  -- 3. Lock rekening & cek saldo
  SELECT balance INTO v_balance_before FROM public.accounts
    WHERE id = p_account_id AND outlet_id = p_outlet_id AND is_deleted = FALSE
    FOR UPDATE;

  IF v_balance_before IS NULL THEN
    RAISE EXCEPTION 'ACCOUNT_NOT_FOUND: Rekening/EDC tidak ditemukan.';
  END IF;

  -- 4. Kalkulasi dual-balance
  IF p_type IN ('SETOR_TUNAI', 'PPOB') THEN
    IF v_balance_before < p_amount THEN
      RAISE EXCEPTION 'SALDO_TIDAK_MENCUKUPI: Saldo digital rekening (%) kurang dari nominal transaksi (%).',
        v_balance_before, p_amount;
    END IF;
    v_digital_change := -p_amount;
    v_total_cash_change := p_amount + p_admin_fee;
    v_mutation_type := 'DEBIT';
  ELSIF p_type = 'TARIK_TUNAI' THEN
    v_digital_change := p_amount;
    v_total_cash_change := -(p_amount - p_admin_fee);
    v_mutation_type := 'KREDIT';
  ELSE
    RAISE EXCEPTION 'INVALID_TRANSACTION_TYPE: Jenis transaksi tidak valid.';
  END IF;

  v_balance_after := v_balance_before + v_digital_change;

  -- 5. Update saldo rekening
  UPDATE public.accounts
    SET balance = v_balance_after, updated_at = NOW()
    WHERE id = p_account_id;

  -- 6. Update estimasi kas fisik shift
  UPDATE public.shifts
    SET expected_cash = expected_cash + v_total_cash_change
    WHERE id = p_shift_id;

  -- 7. Insert transaksi
  INSERT INTO public.transactions (
    shift_id, account_id, outlet_id, user_id,
    type, amount, admin_fee, bank_fee,
    total_cash_change, digital_change, idempotency_key
  ) VALUES (
    p_shift_id, p_account_id, p_outlet_id, p_user_id,
    p_type, p_amount, p_admin_fee, p_bank_fee,
    v_total_cash_change, v_digital_change, p_idempotency_key
  ) RETURNING id INTO v_transaction_id;

  -- 8. Insert mutasi rekening
  INSERT INTO public.account_mutations (
    account_id, transaction_id, type, amount, balance_before, balance_after
  ) VALUES (
    p_account_id, v_transaction_id, v_mutation_type,
    ABS(v_digital_change), v_balance_before, v_balance_after
  );

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'digital_change', v_digital_change,
    'cash_change', v_total_cash_change,
    'new_account_balance', v_balance_after,
    'net_profit', p_admin_fee - p_bank_fee
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 15. RPC process_rebalance
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_rebalance(
  p_outlet_id UUID,
  p_actor_id UUID,
  p_shift_id UUID,
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount NUMERIC(15,2),
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_rebalance_id UUID;
  v_ref_number TEXT;
  v_from_balance_before NUMERIC(15,2);
  v_to_balance_before NUMERIC(15,2);
  v_from_balance_after NUMERIC(15,2);
  v_to_balance_after NUMERIC(15,2);
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: Jumlah rebalance harus lebih dari 0.';
  END IF;

  -- Lock kedua rekening (ordered by ID untuk hindari deadlock)
  IF p_from_account_id < p_to_account_id THEN
    SELECT balance INTO v_from_balance_before FROM public.accounts
      WHERE id = p_from_account_id AND outlet_id = p_outlet_id AND is_deleted = FALSE FOR UPDATE;
    SELECT balance INTO v_to_balance_before FROM public.accounts
      WHERE id = p_to_account_id AND outlet_id = p_outlet_id AND is_deleted = FALSE FOR UPDATE;
  ELSE
    SELECT balance INTO v_to_balance_before FROM public.accounts
      WHERE id = p_to_account_id AND outlet_id = p_outlet_id AND is_deleted = FALSE FOR UPDATE;
    SELECT balance INTO v_from_balance_before FROM public.accounts
      WHERE id = p_from_account_id AND outlet_id = p_outlet_id AND is_deleted = FALSE FOR UPDATE;
  END IF;

  IF v_from_balance_before IS NULL THEN
    RAISE EXCEPTION 'FROM_ACCOUNT_NOT_FOUND: Rekening sumber tidak ditemukan.';
  END IF;
  IF v_to_balance_before IS NULL THEN
    RAISE EXCEPTION 'TO_ACCOUNT_NOT_FOUND: Rekening tujuan tidak ditemukan.';
  END IF;
  IF v_from_balance_before < p_amount THEN
    RAISE EXCEPTION 'SALDO_TIDAK_MENCUKUPI: Saldo rekening sumber tidak mencukupi.';
  END IF;

  v_from_balance_after := v_from_balance_before - p_amount;
  v_to_balance_after := v_to_balance_before + p_amount;

  UPDATE public.accounts SET balance = v_from_balance_after, updated_at = NOW()
    WHERE id = p_from_account_id;
  UPDATE public.accounts SET balance = v_to_balance_after, updated_at = NOW()
    WHERE id = p_to_account_id;

  v_ref_number := 'RB' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(
    (SELECT COUNT(*) + 1 FROM public.rebalances WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 4, '0'
  );

  INSERT INTO public.rebalances (
    reference_number, outlet_id, shift_id, actor_id,
    from_account_id, to_account_id, amount, notes
  ) VALUES (
    v_ref_number, p_outlet_id, p_shift_id, p_actor_id,
    p_from_account_id, p_to_account_id, p_amount, p_notes
  ) RETURNING id INTO v_rebalance_id;

  INSERT INTO public.account_mutations (
    account_id, rebalance_id, type, amount, balance_before, balance_after
  ) VALUES (
    p_from_account_id, v_rebalance_id, 'DEBIT', p_amount, v_from_balance_before, v_from_balance_after
  );

  INSERT INTO public.account_mutations (
    account_id, rebalance_id, type, amount, balance_before, balance_after
  ) VALUES (
    p_to_account_id, v_rebalance_id, 'KREDIT', p_amount, v_to_balance_before, v_to_balance_after
  );

  RETURN jsonb_build_object(
    'success', true,
    'rebalance_id', v_rebalance_id,
    'reference_number', v_ref_number,
    'from_new_balance', v_from_balance_after,
    'to_new_balance', v_to_balance_after
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 16. ROW LEVEL SECURITY — TABEL BARU
-- ============================================================
ALTER TABLE public.rebalances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_fee_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- REBALANCES
CREATE POLICY rebalances_developer_all ON public.rebalances FOR ALL
  USING (public.get_current_user_role() = 'DEVELOPER');
CREATE POLICY rebalances_owner_all ON public.rebalances FOR ALL
  USING (public.get_current_user_role() = 'OWNER'
    AND outlet_id IN (SELECT id FROM public.outlets WHERE owner_id = auth.uid()));
CREATE POLICY rebalances_karyawan_select ON public.rebalances FOR SELECT
  USING (outlet_id = public.get_current_user_outlet_id());
CREATE POLICY rebalances_karyawan_insert ON public.rebalances FOR INSERT
  WITH CHECK (outlet_id = public.get_current_user_outlet_id());

-- SERVICE CATEGORIES
CREATE POLICY svc_cats_developer_all ON public.service_categories FOR ALL
  USING (public.get_current_user_role() = 'DEVELOPER');
CREATE POLICY svc_cats_owner_all ON public.service_categories FOR ALL
  USING (public.get_current_user_role() = 'OWNER'
    AND outlet_id IN (SELECT id FROM public.outlets WHERE owner_id = auth.uid()));
CREATE POLICY svc_cats_karyawan_select ON public.service_categories FOR SELECT
  USING (outlet_id = public.get_current_user_outlet_id());

-- SERVICES
CREATE POLICY services_developer_all ON public.services FOR ALL
  USING (public.get_current_user_role() = 'DEVELOPER');
CREATE POLICY services_owner_all ON public.services FOR ALL
  USING (public.get_current_user_role() = 'OWNER'
    AND outlet_id IN (SELECT id FROM public.outlets WHERE owner_id = auth.uid()));
CREATE POLICY services_karyawan_select ON public.services FOR SELECT
  USING (outlet_id = public.get_current_user_outlet_id() AND is_deleted = FALSE);

-- SERVICE FEE TIERS
CREATE POLICY svc_tiers_developer_all ON public.service_fee_tiers FOR ALL
  USING (public.get_current_user_role() = 'DEVELOPER');
CREATE POLICY svc_tiers_owner_all ON public.service_fee_tiers FOR ALL
  USING (public.get_current_user_role() = 'OWNER'
    AND service_id IN (SELECT s.id FROM public.services s
      JOIN public.outlets o ON s.outlet_id = o.id WHERE o.owner_id = auth.uid()));
CREATE POLICY svc_tiers_karyawan_select ON public.service_fee_tiers FOR SELECT
  USING (service_id IN (
    SELECT id FROM public.services WHERE outlet_id = public.get_current_user_outlet_id()));

-- EXPENSE CATEGORIES
CREATE POLICY exp_cats_developer_all ON public.expense_categories FOR ALL
  USING (public.get_current_user_role() = 'DEVELOPER');
CREATE POLICY exp_cats_owner_all ON public.expense_categories FOR ALL
  USING (public.get_current_user_role() = 'OWNER'
    AND outlet_id IN (SELECT id FROM public.outlets WHERE owner_id = auth.uid()));
CREATE POLICY exp_cats_karyawan_select ON public.expense_categories FOR SELECT
  USING (outlet_id = public.get_current_user_outlet_id());

-- EXPENSES
CREATE POLICY expenses_developer_all ON public.expenses FOR ALL
  USING (public.get_current_user_role() = 'DEVELOPER');
CREATE POLICY expenses_owner_all ON public.expenses FOR ALL
  USING (public.get_current_user_role() = 'OWNER'
    AND outlet_id IN (SELECT id FROM public.outlets WHERE owner_id = auth.uid()));
CREATE POLICY expenses_karyawan_select ON public.expenses FOR SELECT
  USING (outlet_id = public.get_current_user_outlet_id());

-- ============================================================
-- SELESAI — Schema v2 berhasil diaplikasikan
-- ============================================================
