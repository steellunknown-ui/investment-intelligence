-- ============================================================================
-- PERSONAL FINANCE VAULT - SUPABASE SCHEMA V2 (BRD Modules) [OPTIMIZED]
-- ============================================================================
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Idempotent: safe to run multiple times
-- ============================================================================

-- ============================================================================
-- 0) EXTENSIONS (needed for gen_random_uuid)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1) HELPER FUNCTION: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2) EXTEND EXISTING TABLES
-- ============================================================================

-- 2.1 EXTEND public.profiles (BRD fields)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='salutation') THEN
    ALTER TABLE public.profiles ADD COLUMN salutation TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='gender') THEN
    ALTER TABLE public.profiles ADD COLUMN gender TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='date_of_birth') THEN
    ALTER TABLE public.profiles ADD COLUMN date_of_birth DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='contact_number') THEN
    ALTER TABLE public.profiles ADD COLUMN contact_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='address') THEN
    ALTER TABLE public.profiles ADD COLUMN address TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='city') THEN
    ALTER TABLE public.profiles ADD COLUMN city TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='locality') THEN
    ALTER TABLE public.profiles ADD COLUMN locality TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='state') THEN
    ALTER TABLE public.profiles ADD COLUMN state TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='pincode') THEN
    ALTER TABLE public.profiles ADD COLUMN pincode TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='country') THEN
    ALTER TABLE public.profiles ADD COLUMN country TEXT DEFAULT 'India';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='must_change_password') THEN
    ALTER TABLE public.profiles ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Trigger for profiles.updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Optional: Unique contact per user (not global unique)
-- (You can remove this if you don't want it)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_contact_unique_per_user
  ON public.profiles(id, contact_number)
  WHERE contact_number IS NOT NULL;

-- 2.2 EXTEND public.nominees (BRD fields)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='salutation') THEN
    ALTER TABLE public.nominees ADD COLUMN salutation TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='first_name') THEN
    ALTER TABLE public.nominees ADD COLUMN first_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='middle_name') THEN
    ALTER TABLE public.nominees ADD COLUMN middle_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='last_name') THEN
    ALTER TABLE public.nominees ADD COLUMN last_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='gender') THEN
    ALTER TABLE public.nominees ADD COLUMN gender TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='date_of_birth') THEN
    ALTER TABLE public.nominees ADD COLUMN date_of_birth DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='contact_number') THEN
    ALTER TABLE public.nominees ADD COLUMN contact_number TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='address') THEN
    ALTER TABLE public.nominees ADD COLUMN address TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='city') THEN
    ALTER TABLE public.nominees ADD COLUMN city TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='state') THEN
    ALTER TABLE public.nominees ADD COLUMN state TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='pincode') THEN
    ALTER TABLE public.nominees ADD COLUMN pincode TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='allow_user_access') THEN
    ALTER TABLE public.nominees ADD COLUMN allow_user_access BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='visibility_scope') THEN
    ALTER TABLE public.nominees ADD COLUMN visibility_scope TEXT DEFAULT 'restricted';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='percentage_share') THEN
    ALTER TABLE public.nominees ADD COLUMN percentage_share NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='notes') THEN
    ALTER TABLE public.nominees ADD COLUMN notes TEXT;
  END IF;
END $$;

-- nominee % share constraint (0-100)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'nominees_percentage_share_check'
  ) THEN
    ALTER TABLE public.nominees
      ADD CONSTRAINT nominees_percentage_share_check
      CHECK (percentage_share >= 0 AND percentage_share <= 100);
  END IF;
END $$;

-- prevent duplicate nominee email per user
CREATE UNIQUE INDEX IF NOT EXISTS nominees_user_email_unique_idx
  ON public.nominees(user_id, email);

-- Trigger for nominees.updated_at
DROP TRIGGER IF EXISTS nominees_updated_at ON public.nominees;
CREATE TRIGGER nominees_updated_at
  BEFORE UPDATE ON public.nominees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 3) INSURANCE MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  policy_number TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  policy_name TEXT,

  sum_insured NUMERIC NOT NULL CHECK (sum_insured >= 0),
  premium_amount NUMERIC NOT NULL CHECK (premium_amount >= 0),
  premium_frequency TEXT DEFAULT 'yearly',

  start_date DATE NOT NULL,
  end_date DATE,
  maturity_date DATE,
  next_premium_due DATE,

  insured_name TEXT,
  insured_relationship TEXT DEFAULT 'self',

  policy_nominee_name TEXT,
  policy_nominee_relationship TEXT,

  status TEXT DEFAULT 'active',

  policy_document_url TEXT,
  agent_name TEXT,
  agent_contact TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS insurance_policies_user_policy_number_idx
  ON public.insurance_policies(user_id, policy_number);

CREATE INDEX IF NOT EXISTS insurance_policies_user_id_idx
  ON public.insurance_policies(user_id);

DROP TRIGGER IF EXISTS insurance_policies_updated_at ON public.insurance_policies;
CREATE TRIGGER insurance_policies_updated_at
  BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insurance_policies_crud_own" ON public.insurance_policies;
CREATE POLICY "insurance_policies_crud_own"
  ON public.insurance_policies
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Payments
CREATE TABLE IF NOT EXISTS public.insurance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.insurance_policies(id) ON DELETE CASCADE,

  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  payment_mode TEXT,
  reference_number TEXT,
  receipt_url TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS insurance_payments_user_id_idx ON public.insurance_payments(user_id);
CREATE INDEX IF NOT EXISTS insurance_payments_policy_id_idx ON public.insurance_payments(policy_id);

DROP TRIGGER IF EXISTS insurance_payments_updated_at ON public.insurance_payments;
CREATE TRIGGER insurance_payments_updated_at
  BEFORE UPDATE ON public.insurance_payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.insurance_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insurance_payments_crud_own" ON public.insurance_payments;
CREATE POLICY "insurance_payments_crud_own"
  ON public.insurance_payments
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 4) BANKING MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch_name TEXT,
  ifsc_code TEXT NOT NULL,
  account_type TEXT DEFAULT 'savings',

  account_holder_name TEXT NOT NULL,
  is_joint_account BOOLEAN DEFAULT FALSE,
  joint_holder_name TEXT,

  current_balance NUMERIC DEFAULT 0 CHECK (current_balance >= 0),
  balance_as_of DATE,

  account_nominee_name TEXT,
  account_nominee_relationship TEXT,

  status TEXT DEFAULT 'active',

  linked_mobile TEXT,
  net_banking_enabled BOOLEAN DEFAULT FALSE,

  -- safer than storing full card number
  debit_card_last4 TEXT,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS bank_accounts_user_account_unique_idx
  ON public.bank_accounts(user_id, account_number, bank_name, ifsc_code);

CREATE INDEX IF NOT EXISTS bank_accounts_user_id_idx ON public.bank_accounts(user_id);

DROP TRIGGER IF EXISTS bank_accounts_updated_at ON public.bank_accounts;
CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_accounts_crud_own" ON public.bank_accounts;
CREATE POLICY "bank_accounts_crud_own"
  ON public.bank_accounts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5) TRADING MODULE (Vault records)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trading_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  exchange TEXT NOT NULL,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  investment_type TEXT DEFAULT 'equity',

  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  average_buy_price NUMERIC NOT NULL CHECK (average_buy_price >= 0),
  current_price NUMERIC CHECK (current_price >= 0),
  current_price_updated_at TIMESTAMPTZ,

  demat_account_number TEXT,
  broker_name TEXT,

  first_purchase_date DATE,
  last_purchase_date DATE,

  invested_value NUMERIC GENERATED ALWAYS AS (quantity * average_buy_price) STORED,
  current_value NUMERIC GENERATED ALWAYS AS (quantity * COALESCE(current_price, average_buy_price)) STORED,

  status TEXT DEFAULT 'active',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS trading_investments_user_exchange_stock_idx
  ON public.trading_investments(user_id, exchange, stock_code);

CREATE INDEX IF NOT EXISTS trading_investments_user_id_idx ON public.trading_investments(user_id);

DROP TRIGGER IF EXISTS trading_investments_updated_at ON public.trading_investments;
CREATE TRIGGER trading_investments_updated_at
  BEFORE UPDATE ON public.trading_investments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.trading_investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trading_investments_crud_own" ON public.trading_investments;
CREATE POLICY "trading_investments_crud_own"
  ON public.trading_investments
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 6) ASSETS MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  asset_category TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  asset_name TEXT NOT NULL,

  ownership_type TEXT DEFAULT 'sole',
  owner_name TEXT,
  co_owner_names TEXT[],
  ownership_percentage NUMERIC DEFAULT 100 CHECK (ownership_percentage >= 0 AND ownership_percentage <= 100),

  purchase_value NUMERIC CHECK (purchase_value >= 0),
  purchase_date DATE,
  current_market_value NUMERIC CHECK (current_market_value >= 0),
  valuation_date DATE,

  property_address TEXT,
  property_area NUMERIC,
  property_area_unit TEXT DEFAULT 'sq_ft',
  registration_number TEXT,

  vehicle_registration TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,

  is_under_loan BOOLEAN DEFAULT FALSE,
  loan_provider TEXT,
  loan_outstanding NUMERIC CHECK (loan_outstanding >= 0),
  loan_emi NUMERIC CHECK (loan_emi >= 0),
  loan_end_date DATE,

  document_reference TEXT,

  status TEXT DEFAULT 'owned',
  location TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assets_user_id_idx ON public.assets(user_id);

DROP TRIGGER IF EXISTS assets_updated_at ON public.assets;
CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_crud_own" ON public.assets;
CREATE POLICY "assets_crud_own"
  ON public.assets
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 7) LIABILITIES MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  loan_type TEXT NOT NULL,
  loan_name TEXT,

  taken_from TEXT NOT NULL,
  lender_type TEXT DEFAULT 'bank',

  principal_amount NUMERIC NOT NULL CHECK (principal_amount >= 0),
  interest_rate NUMERIC CHECK (interest_rate >= 0),
  interest_type TEXT DEFAULT 'fixed',

  outstanding_amount NUMERIC NOT NULL CHECK (outstanding_amount >= 0),
  emi_amount NUMERIC CHECK (emi_amount >= 0),

  loan_start_date DATE,
  loan_end_date DATE,
  tenure_months INTEGER,

  emi_due_day INTEGER CHECK (emi_due_day >= 1 AND emi_due_day <= 31),
  auto_debit_account TEXT,

  is_secured BOOLEAN DEFAULT FALSE,
  collateral_type TEXT,
  collateral_details TEXT,

  status TEXT DEFAULT 'active',

  linked_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,

  account_number TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS liabilities_user_id_idx ON public.liabilities(user_id);

DROP TRIGGER IF EXISTS liabilities_updated_at ON public.liabilities;
CREATE TRIGGER liabilities_updated_at
  BEFORE UPDATE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "liabilities_crud_own" ON public.liabilities;
CREATE POLICY "liabilities_crud_own"
  ON public.liabilities
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Payments
CREATE TABLE IF NOT EXISTS public.liability_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liability_id UUID NOT NULL REFERENCES public.liabilities(id) ON DELETE CASCADE,

  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  principal_component NUMERIC CHECK (principal_component >= 0),
  interest_component NUMERIC CHECK (interest_component >= 0),

  payment_mode TEXT,
  reference_number TEXT,

  outstanding_after_payment NUMERIC CHECK (outstanding_after_payment >= 0),

  status TEXT DEFAULT 'paid',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS liability_payments_user_id_idx ON public.liability_payments(user_id);
CREATE INDEX IF NOT EXISTS liability_payments_liability_id_idx ON public.liability_payments(liability_id);

DROP TRIGGER IF EXISTS liability_payments_updated_at ON public.liability_payments;
CREATE TRIGGER liability_payments_updated_at
  BEFORE UPDATE ON public.liability_payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.liability_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "liability_payments_crud_own" ON public.liability_payments;
CREATE POLICY "liability_payments_crud_own"
  ON public.liability_payments
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 8) RECEIVABLES MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  given_to TEXT NOT NULL,
  relationship TEXT,
  contact_number TEXT,
  email TEXT,

  principal_amount NUMERIC NOT NULL CHECK (principal_amount >= 0),
  interest_rate NUMERIC DEFAULT 0 CHECK (interest_rate >= 0),
  total_receivable NUMERIC NOT NULL CHECK (total_receivable >= 0),
  amount_received NUMERIC DEFAULT 0 CHECK (amount_received >= 0),

  outstanding_amount NUMERIC GENERATED ALWAYS AS (total_receivable - amount_received) STORED,

  given_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,

  purpose TEXT,
  status TEXT DEFAULT 'pending',

  has_written_agreement BOOLEAN DEFAULT FALSE,
  agreement_reference TEXT,

  reminder_enabled BOOLEAN DEFAULT TRUE,
  last_reminder_sent_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS receivables_user_id_idx ON public.receivables(user_id);

DROP TRIGGER IF EXISTS receivables_updated_at ON public.receivables;
CREATE TRIGGER receivables_updated_at
  BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "receivables_crud_own" ON public.receivables;
CREATE POLICY "receivables_crud_own"
  ON public.receivables
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 9) BELONGINGS MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.belongings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,

  material TEXT,
  purity TEXT,
  weight_grams NUMERIC CHECK (weight_grams >= 0),

  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  purchase_value NUMERIC CHECK (purchase_value >= 0),
  purchase_date DATE,
  current_estimated_value NUMERIC CHECK (current_estimated_value >= 0),
  valuation_date DATE,

  storage_location TEXT,
  location_details TEXT,

  is_insured BOOLEAN DEFAULT FALSE,
  insurance_policy_reference TEXT,

  has_invoice BOOLEAN DEFAULT FALSE,
  has_certificate BOOLEAN DEFAULT FALSE,

  bank_locker_details TEXT,

  status TEXT DEFAULT 'in_possession',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS belongings_user_id_idx ON public.belongings(user_id);

DROP TRIGGER IF EXISTS belongings_updated_at ON public.belongings;
CREATE TRIGGER belongings_updated_at
  BEFORE UPDATE ON public.belongings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.belongings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "belongings_crud_own" ON public.belongings;
CREATE POLICY "belongings_crud_own"
  ON public.belongings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 10) DOCUMENTS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER CHECK (file_size >= 0),

  document_type TEXT,
  title TEXT,
  description TEXT,

  tags TEXT[],
  is_archived BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documents_user_id_idx ON public.documents(user_id);

DROP TRIGGER IF EXISTS documents_updated_at ON public.documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_crud_own" ON public.documents;
CREATE POLICY "documents_crud_own"
  ON public.documents
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- document_links (polymorphic)
CREATE TABLE IF NOT EXISTS public.document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,

  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  link_description TEXT,
  is_primary BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS document_links_unique_idx
  ON public.document_links(document_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS document_links_user_id_idx ON public.document_links(user_id);
CREATE INDEX IF NOT EXISTS document_links_document_id_idx ON public.document_links(document_id);
CREATE INDEX IF NOT EXISTS document_links_entity_idx ON public.document_links(entity_type, entity_id);

-- entity_type allowlist constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'document_links_entity_type_check'
  ) THEN
    ALTER TABLE public.document_links
      ADD CONSTRAINT document_links_entity_type_check
      CHECK (entity_type IN (
        'insurance_policy',
        'bank_account',
        'asset',
        'liability',
        'receivable',
        'belonging',
        'trading_investment',
        'nominee'
      ));
  END IF;
END $$;

ALTER TABLE public.document_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_links_crud_own" ON public.document_links;
CREATE POLICY "document_links_crud_own"
  ON public.document_links
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 11) GRANTS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_policies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_payments TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_investments TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.liabilities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.liability_payments TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.receivables TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.belongings TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_links TO authenticated;

-- ============================================================================
-- DONE
-- ============================================================================
