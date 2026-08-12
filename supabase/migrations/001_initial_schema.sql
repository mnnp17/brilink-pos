-- ============================================================
-- BRILink POS Digital — Database Schema
-- Migration 001: Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('developer', 'owner', 'kasir');
CREATE TYPE account_type AS ENUM ('bank_bri', 'edc_mobile', 'bank_lain', 'kas_laci');
CREATE TYPE transaction_type AS ENUM ('setor_tunai', 'tarik_tunai', 'ppob', 'pulsa', 'transfer_internal', 'cash_drop');
CREATE TYPE transaction_status AS ENUM ('pending', 'success', 'void', 'failed');
CREATE TYPE shift_status AS ENUM ('open', 'closed');

-- ============================================================
-- TABLE: profiles
-- Extends Supabase auth.users
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'kasir',
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: store_accounts
-- Rekening/EDC yang dikelola agen
-- ============================================================
CREATE TABLE public.store_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  account_type account_type NOT NULL,
  account_number TEXT,
  bank_name TEXT,
  initial_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  min_threshold NUMERIC(15,2) NOT NULL DEFAULT 500000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  color_hex TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT 'bank',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: shifts
-- Sesi kerja kasir
-- ============================================================
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kasir_id UUID NOT NULL REFERENCES public.profiles(id),
  kasir_name TEXT NOT NULL,
  status shift_status NOT NULL DEFAULT 'open',
  opening_cash NUMERIC(15,2) NOT NULL DEFAULT 0,
  closing_cash NUMERIC(15,2),
  system_expected_cash NUMERIC(15,2),
  cash_discrepancy NUMERIC(15,2),
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: transactions
-- Transaksi utama
-- ============================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number TEXT UNIQUE NOT NULL,
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'success',
  account_id UUID NOT NULL REFERENCES public.store_accounts(id),
  shift_id UUID REFERENCES public.shifts(id),
  -- Nominal & Finance
  nominal NUMERIC(15,2) NOT NULL,
  fee_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  modal_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  sell_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  profit_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Cash register impact
  cash_in NUMERIC(15,2) NOT NULL DEFAULT 0,
  cash_out NUMERIC(15,2) NOT NULL DEFAULT 0,
  balance_debit NUMERIC(15,2) NOT NULL DEFAULT 0,
  balance_credit NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Customer Info
  customer_name TEXT,
  customer_phone TEXT,
  customer_id_number TEXT,
  destination_account TEXT,
  notes TEXT,
  -- Metadata
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  void_reason TEXT,
  voided_by UUID REFERENCES public.profiles(id),
  voided_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: audit_logs
-- Log perubahan data penting
-- ============================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE, VOID
  old_data JSONB,
  new_data JSONB,
  performed_by UUID REFERENCES public.profiles(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================================
-- TABLE: fee_config
-- Konfigurasi biaya admin per jenis transaksi
-- ============================================================
CREATE TABLE public.fee_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type transaction_type NOT NULL,
  min_nominal NUMERIC(15,2) NOT NULL DEFAULT 0,
  max_nominal NUMERIC(15,2),
  fee_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  fee_percentage NUMERIC(5,4) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_transactions_shift_id ON public.transactions(shift_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_created_by ON public.transactions(created_by);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_shifts_kasir_id ON public.shifts(kasir_id);
CREATE INDEX idx_shifts_status ON public.shifts(status);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_performed_at ON public.audit_logs(performed_at DESC);

-- ============================================================
-- FUNCTION: Generate Transaction Number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_transaction_number(p_type transaction_type)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_date TEXT;
  v_seq BIGINT;
BEGIN
  v_prefix := CASE p_type
    WHEN 'setor_tunai' THEN 'ST'
    WHEN 'tarik_tunai' THEN 'TT'
    WHEN 'ppob' THEN 'PB'
    WHEN 'pulsa' THEN 'PL'
    WHEN 'transfer_internal' THEN 'TI'
    WHEN 'cash_drop' THEN 'CD'
    ELSE 'TX'
  END;
  v_date := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.transactions
  WHERE DATE(created_at) = CURRENT_DATE;
  RETURN v_prefix || v_date || LPAD(v_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Process Transaction (Atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION process_transaction(
  p_type transaction_type,
  p_account_id UUID,
  p_shift_id UUID,
  p_nominal NUMERIC,
  p_fee_amount NUMERIC,
  p_modal_price NUMERIC,
  p_sell_price NUMERIC,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_destination_account TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_account RECORD;
  v_transaction_id UUID;
  v_transaction_number TEXT;
  v_profit NUMERIC;
  v_cash_in NUMERIC := 0;
  v_cash_out NUMERIC := 0;
  v_balance_debit NUMERIC := 0;
  v_balance_credit NUMERIC := 0;
  v_new_balance NUMERIC;
BEGIN
  -- Lock account row for update
  SELECT * INTO v_account FROM public.store_accounts WHERE id = p_account_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'ACCOUNT_NOT_FOUND');
  END IF;
  
  IF NOT v_account.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'ACCOUNT_INACTIVE');
  END IF;

  -- Calculate cash & balance movements based on transaction type
  IF p_type = 'setor_tunai' THEN
    -- Customer pays cash → we receive cash + fee, debit digital balance
    v_cash_in := p_nominal + p_fee_amount;
    v_balance_debit := p_nominal;
    v_profit := p_fee_amount;
    -- Check sufficient balance
    IF v_account.current_balance < p_nominal THEN
      RETURN jsonb_build_object('success', false, 'error', 'SALDO_TIDAK_CUKUP', 'current_balance', v_account.current_balance);
    END IF;
    v_new_balance := v_account.current_balance - p_nominal;
    
  ELSIF p_type = 'tarik_tunai' THEN
    -- Customer withdraws cash → we give cash out, credit digital balance
    v_cash_out := p_nominal;
    v_cash_in := p_fee_amount;
    v_balance_credit := p_nominal;
    v_profit := p_fee_amount;
    v_new_balance := v_account.current_balance + p_nominal;
    
  ELSIF p_type IN ('ppob', 'pulsa') THEN
    -- Customer pays sell price in cash, we debit modal from balance
    v_cash_in := p_sell_price;
    v_balance_debit := p_modal_price;
    v_profit := p_sell_price - p_modal_price;
    IF v_account.current_balance < p_modal_price THEN
      RETURN jsonb_build_object('success', false, 'error', 'SALDO_TIDAK_CUKUP', 'current_balance', v_account.current_balance);
    END IF;
    v_new_balance := v_account.current_balance - p_modal_price;
    
  ELSIF p_type = 'transfer_internal' THEN
    -- Internal movement, no profit
    v_balance_debit := p_nominal;
    v_profit := 0;
    IF v_account.current_balance < p_nominal THEN
      RETURN jsonb_build_object('success', false, 'error', 'SALDO_TIDAK_CUKUP', 'current_balance', v_account.current_balance);
    END IF;
    v_new_balance := v_account.current_balance - p_nominal;
    
  ELSE
    v_profit := 0;
    v_new_balance := v_account.current_balance;
  END IF;

  -- Generate transaction number
  v_transaction_number := generate_transaction_number(p_type);

  -- Insert transaction
  INSERT INTO public.transactions (
    transaction_number, type, status, account_id, shift_id,
    nominal, fee_amount, modal_price, sell_price, profit_amount,
    cash_in, cash_out, balance_debit, balance_credit,
    customer_name, customer_phone, destination_account, notes, created_by
  ) VALUES (
    v_transaction_number, p_type, 'success', p_account_id, p_shift_id,
    p_nominal, p_fee_amount, p_modal_price, p_sell_price, v_profit,
    v_cash_in, v_cash_out, v_balance_debit, v_balance_credit,
    p_customer_name, p_customer_phone, p_destination_account, p_notes, p_created_by
  ) RETURNING id INTO v_transaction_id;

  -- Update account balance
  UPDATE public.store_accounts
  SET current_balance = v_new_balance, updated_at = now()
  WHERE id = p_account_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'transaction_number', v_transaction_number,
    'new_balance', v_new_balance,
    'profit', v_profit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Close Shift (Atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION close_shift(
  p_shift_id UUID,
  p_closing_cash NUMERIC,
  p_closed_by UUID
)
RETURNS JSONB AS $$
DECLARE
  v_shift RECORD;
  v_total_cash_in NUMERIC;
  v_total_cash_out NUMERIC;
  v_expected_cash NUMERIC;
  v_discrepancy NUMERIC;
BEGIN
  SELECT * INTO v_shift FROM public.shifts WHERE id = p_shift_id AND kasir_id = p_closed_by FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'SHIFT_NOT_FOUND');
  END IF;
  
  IF v_shift.status = 'closed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'SHIFT_ALREADY_CLOSED');
  END IF;

  -- Calculate expected cash from transactions
  SELECT 
    COALESCE(SUM(cash_in), 0),
    COALESCE(SUM(cash_out), 0)
  INTO v_total_cash_in, v_total_cash_out
  FROM public.transactions
  WHERE shift_id = p_shift_id AND status = 'success' AND is_deleted = false;

  v_expected_cash := v_shift.opening_cash + v_total_cash_in - v_total_cash_out;
  v_discrepancy := p_closing_cash - v_expected_cash;

  UPDATE public.shifts
  SET 
    status = 'closed',
    closing_cash = p_closing_cash,
    system_expected_cash = v_expected_cash,
    cash_discrepancy = v_discrepancy,
    closed_at = now()
  WHERE id = p_shift_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_cash_in', v_total_cash_in,
    'total_cash_out', v_total_cash_out,
    'expected_cash', v_expected_cash,
    'closing_cash', p_closing_cash,
    'discrepancy', v_discrepancy
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: Updated At
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_accounts_updated_at
  BEFORE UPDATE ON public.store_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: Audit Log
-- ============================================================
CREATE OR REPLACE FUNCTION audit_log_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs(table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, OLD.id, 'UPDATE', row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs(table_name, record_id, action, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::JSONB);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transactions_audit
  AFTER UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_fn();

CREATE TRIGGER trigger_accounts_audit
  AFTER UPDATE OR DELETE ON public.store_accounts
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_fn();
