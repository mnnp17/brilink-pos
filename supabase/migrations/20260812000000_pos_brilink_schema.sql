-- ==========================================
-- POS AGEN BRILINK: DATABASE SCHEMA & MIGRATION
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('DEVELOPER', 'OWNER', 'KARYAWAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shift_status AS ENUM ('OPEN', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('SETOR_TUNAI', 'TARIK_TUNAI', 'PPOB');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mutation_type AS ENUM ('DEBIT', 'KREDIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES

-- Outlets
CREATE TABLE IF NOT EXISTS public.outlets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL,
    address TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (Profile table linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    role user_role NOT NULL DEFAULT 'KARYAWAN',
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foreign key for outlets owner_id after users table created
DO $$ BEGIN
    ALTER TABLE public.outlets 
    ADD CONSTRAINT fk_outlets_owner 
    FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Accounts (Rekening / EDC Digital per Outlet)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    min_threshold NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shifts (Pencatatan shift kasir harian)
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    start_cash NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    actual_cash NUMERIC(15, 2) DEFAULT NULL,
    difference_cash NUMERIC(15, 2) DEFAULT NULL,
    status shift_status NOT NULL DEFAULT 'OPEN',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ DEFAULT NULL
);

-- Transactions (Pencatatan transaksi POS Dual-Balance)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    outlet_id UUID NOT NULL REFERENCES public.outlets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    admin_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_cash_change NUMERIC(15, 2) NOT NULL,
    digital_change NUMERIC(15, 2) NOT NULL,
    idempotency_key TEXT UNIQUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Account Mutations (Audit trail mutasi saldo digital debit/kredit per rekening)
CREATE TABLE IF NOT EXISTS public.account_mutations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    type mutation_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    balance_before NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs (Tabel audit keamanan & impersonasi)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    performed_by UUID,
    impersonated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_outlet ON public.users(outlet_id);
CREATE INDEX IF NOT EXISTS idx_users_owner ON public.users(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_outlet ON public.accounts(outlet_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_outlet ON public.shifts(user_id, outlet_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_shift ON public.transactions(shift_id);
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency ON public.transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_account_mutations_account ON public.account_mutations(account_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
    RETURN COALESCE(v_role, 'KARYAWAN'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user outlet_id
CREATE OR REPLACE FUNCTION public.get_current_user_outlet_id()
RETURNS UUID AS $$
DECLARE
    v_outlet_id UUID;
BEGIN
    SELECT outlet_id INTO v_outlet_id FROM public.users WHERE id = auth.uid();
    RETURN v_outlet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user owner_id
CREATE OR REPLACE FUNCTION public.get_current_user_owner_id()
RETURNS UUID AS $$
DECLARE
    v_owner_id UUID;
BEGIN
    SELECT COALESCE(owner_id, id) INTO v_owner_id FROM public.users WHERE id = auth.uid();
    RETURN v_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: USERS
CREATE POLICY users_developer_all ON public.users FOR ALL
    USING (public.get_current_user_role() = 'DEVELOPER');

CREATE POLICY users_owner_select ON public.users FOR SELECT
    USING (public.get_current_user_role() = 'OWNER' AND (id = auth.uid() OR owner_id = auth.uid()));

CREATE POLICY users_owner_insert ON public.users FOR INSERT
    WITH CHECK (public.get_current_user_role() = 'OWNER' AND owner_id = auth.uid());

CREATE POLICY users_owner_update ON public.users FOR UPDATE
    USING (public.get_current_user_role() = 'OWNER' AND owner_id = auth.uid());

CREATE POLICY users_karyawan_select ON public.users FOR SELECT
    USING (id = auth.uid());

-- RLS: OUTLETS
CREATE POLICY outlets_developer_all ON public.outlets FOR ALL
    USING (public.get_current_user_role() = 'DEVELOPER');

CREATE POLICY outlets_owner_all ON public.outlets FOR ALL
    USING (public.get_current_user_role() = 'OWNER' AND owner_id = auth.uid());

CREATE POLICY outlets_karyawan_select ON public.outlets FOR SELECT
    USING (id = public.get_current_user_outlet_id());

-- RLS: ACCOUNTS
CREATE POLICY accounts_developer_all ON public.accounts FOR ALL
    USING (public.get_current_user_role() = 'DEVELOPER');

CREATE POLICY accounts_owner_all ON public.accounts FOR ALL
    USING (
        public.get_current_user_role() = 'OWNER' 
        AND outlet_id IN (SELECT id FROM public.outlets WHERE owner_id = auth.uid())
    );

CREATE POLICY accounts_karyawan_select ON public.accounts FOR SELECT
    USING (outlet_id = public.get_current_user_outlet_id());

-- RLS: SHIFTS
CREATE POLICY shifts_developer_all ON public.shifts FOR ALL
    USING (public.get_current_user_role() = 'DEVELOPER');

CREATE POLICY shifts_owner_all ON public.shifts FOR ALL
    USING (
        public.get_current_user_role() = 'OWNER' 
        AND outlet_id IN (SELECT id FROM public.outlets WHERE owner_id = auth.uid())
    );

CREATE POLICY shifts_karyawan_select ON public.shifts FOR SELECT
    USING (outlet_id = public.get_current_user_outlet_id());

CREATE POLICY shifts_karyawan_insert ON public.shifts FOR INSERT
    WITH CHECK (user_id = auth.uid() AND outlet_id = public.get_current_user_outlet_id());

CREATE POLICY shifts_karyawan_update ON public.shifts FOR UPDATE
    USING (user_id = auth.uid() AND status = 'OPEN');

-- RLS: TRANSACTIONS
CREATE POLICY transactions_developer_all ON public.transactions FOR ALL
    USING (public.get_current_user_role() = 'DEVELOPER');

CREATE POLICY transactions_owner_all ON public.transactions FOR ALL
    USING (
        public.get_current_user_role() = 'OWNER' 
        AND outlet_id IN (SELECT id FROM public.outlets WHERE owner_id = auth.uid())
    );

CREATE POLICY transactions_karyawan_select ON public.transactions FOR SELECT
    USING (outlet_id = public.get_current_user_outlet_id());

CREATE POLICY transactions_karyawan_insert ON public.transactions FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND outlet_id = public.get_current_user_outlet_id()
    );

-- RLS: ACCOUNT_MUTATIONS
CREATE POLICY mutations_developer_all ON public.account_mutations FOR ALL
    USING (public.get_current_user_role() = 'DEVELOPER');

CREATE POLICY mutations_owner_all ON public.account_mutations FOR ALL
    USING (
        public.get_current_user_role() = 'OWNER' 
        AND account_id IN (
            SELECT a.id FROM public.accounts a 
            JOIN public.outlets o ON a.outlet_id = o.id 
            WHERE o.owner_id = auth.uid()
        )
    );

CREATE POLICY mutations_karyawan_select ON public.account_mutations FOR SELECT
    USING (
        account_id IN (
            SELECT id FROM public.accounts WHERE outlet_id = public.get_current_user_outlet_id()
        )
    );

-- RLS: AUDIT_LOGS
CREATE POLICY audit_developer_all ON public.audit_logs FOR ALL
    USING (public.get_current_user_role() = 'DEVELOPER');

CREATE POLICY audit_owner_select ON public.audit_logs FOR SELECT
    USING (public.get_current_user_role() = 'OWNER');

-- 5. ATOMIC DUAL-BALANCE TRANSACTION STORED PROCEDURE (RPC)

CREATE OR REPLACE FUNCTION public.process_pos_transaction(
    p_shift_id UUID,
    p_account_id UUID,
    p_type transaction_type,
    p_amount NUMERIC,
    p_admin_fee NUMERIC,
    p_idempotency_key TEXT,
    p_user_id UUID,
    p_outlet_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_shift RECORD;
    v_account RECORD;
    v_digital_change NUMERIC(15,2);
    v_cash_change NUMERIC(15,2);
    v_balance_before NUMERIC(15,2);
    v_balance_after NUMERIC(15,2);
    v_mutation_type mutation_type;
    v_transaction_id UUID;
    v_existing_tx RECORD;
    v_result JSONB;
BEGIN
    -- 1. Check idempotency key
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
        SELECT * INTO v_existing_tx FROM public.transactions WHERE idempotency_key = p_idempotency_key;
        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'status', 'IDEMPOTENT_SKIPPED',
                'transaction_id', v_existing_tx.id
            );
        END IF;
    END IF;

    -- 2. Validate shift
    SELECT * INTO v_shift FROM public.shifts 
    WHERE id = p_shift_id AND status = 'OPEN' AND outlet_id = p_outlet_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SHIFT_INVALID_OR_CLOSED: Shift tidak aktif atau telah ditutup.';
    END IF;

    -- 3. Lock account row and check balance
    SELECT * INTO v_account FROM public.accounts 
    WHERE id = p_account_id AND outlet_id = p_outlet_id AND is_deleted = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ACCOUNT_NOT_FOUND: Rekening/EDC tidak ditemukan.';
    END IF;

    v_balance_before := v_account.balance;

    -- 4. Dual-balance calculations
    IF p_type IN ('SETOR_TUNAI', 'PPOB') THEN
        -- Kasir terima cash dari customer, saldo digital dipotong
        IF v_account.balance < p_amount THEN
            RAISE EXCEPTION 'SALDO_TIDAK_MENCUKUPI: Saldo digital rekening (%) kurang dari nominal transaksi (%).', 
                v_account.balance, p_amount;
        END IF;
        v_digital_change := -p_amount;
        v_cash_change := p_amount + p_admin_fee;
        v_mutation_type := 'DEBIT';
    ELSIF p_type = 'TARIK_TUNAI' THEN
        -- Kasir berikan cash ke customer, saldo digital bertambah dari bank
        v_digital_change := p_amount;
        v_cash_change := -(p_amount - p_admin_fee);
        v_mutation_type := 'KREDIT';
    ELSE
        RAISE EXCEPTION 'INVALID_TRANSACTION_TYPE: Jenis transaksi tidak valid.';
    END IF;

    v_balance_after := v_balance_before + v_digital_change;

    -- 5. Update account balance
    UPDATE public.accounts 
    SET balance = v_balance_after, updated_at = NOW()
    WHERE id = p_account_id;

    -- 6. Update shift expected cash
    UPDATE public.shifts 
    SET expected_cash = expected_cash + v_cash_change
    WHERE id = p_shift_id;

    -- 7. Insert transaction row
    INSERT INTO public.transactions (
        shift_id, account_id, outlet_id, user_id,
        type, amount, admin_fee, total_cash_change, digital_change, idempotency_key
    ) VALUES (
        p_shift_id, p_account_id, p_outlet_id, p_user_id,
        p_type, p_amount, p_admin_fee, v_cash_change, v_digital_change, p_idempotency_key
    ) RETURNING id INTO v_transaction_id;

    -- 8. Insert account mutation row
    INSERT INTO public.account_mutations (
        account_id, transaction_id, type, amount, balance_before, balance_after
    ) VALUES (
        p_account_id, v_transaction_id, v_mutation_type, ABS(v_digital_change), v_balance_before, v_balance_after
    );

    v_result := jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'digital_change', v_digital_change,
        'cash_change', v_cash_change,
        'new_account_balance', v_balance_after
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. AUDIT LOG TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.audit_log_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, performed_by)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb, v_user_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, performed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, v_user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, performed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb, v_user_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_users_trigger ON public.users;
CREATE TRIGGER audit_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_func();

DROP TRIGGER IF EXISTS audit_accounts_trigger ON public.accounts;
CREATE TRIGGER audit_accounts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_func();

DROP TRIGGER IF EXISTS audit_outlets_trigger ON public.outlets;
CREATE TRIGGER audit_outlets_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.outlets
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_func();
