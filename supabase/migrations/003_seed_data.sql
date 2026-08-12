-- ============================================================
-- BRILink POS Digital — Seed Data (Development)
-- Migration 003: Initial seed data
-- Note: Run this AFTER creating auth users in Supabase Dashboard
-- Replace the UUIDs with actual auth.users IDs from your Supabase project
-- ============================================================

-- ============================================================
-- STORE ACCOUNTS (Rekening & EDC)
-- ============================================================
INSERT INTO public.store_accounts (name, account_type, account_number, bank_name, initial_balance, current_balance, min_threshold, color_hex, icon, sort_order)
VALUES
  ('BRI Rekening Utama', 'bank_bri', '0123456789', 'Bank BRI', 5000000, 5000000, 1000000, '#EF4444', 'building-library', 1),
  ('EDC Mobile BRILink', 'edc_mobile', 'EDC-001', 'BRI EDC', 3000000, 3000000, 500000, '#3B82F6', 'credit-card', 2),
  ('Rekening Mandiri', 'bank_lain', '1234567890', 'Bank Mandiri', 2000000, 2000000, 300000, '#F59E0B', 'banknotes', 3),
  ('Kas Laci Fisik', 'kas_laci', NULL, NULL, 1500000, 1500000, 200000, '#10B981', 'wallet', 4);

-- ============================================================
-- FEE CONFIGURATION
-- ============================================================
INSERT INTO public.fee_config (transaction_type, min_nominal, max_nominal, fee_amount)
VALUES
  -- Setor Tunai tiers
  ('setor_tunai', 0, 1000000, 2000),
  ('setor_tunai', 1000001, 5000000, 3000),
  ('setor_tunai', 5000001, 10000000, 5000),
  ('setor_tunai', 10000001, NULL, 7500),
  -- Tarik Tunai tiers
  ('tarik_tunai', 0, 500000, 2500),
  ('tarik_tunai', 500001, 2000000, 5000),
  ('tarik_tunai', 2000001, 5000000, 7500),
  ('tarik_tunai', 5000001, NULL, 10000),
  -- PPOB flat fee
  ('ppob', 0, NULL, 2500),
  -- Pulsa flat fee
  ('pulsa', 0, NULL, 1000);
