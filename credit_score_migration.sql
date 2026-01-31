-- ============================================================================
-- NET WORTH SNAPSHOTS TABLE
-- Records daily net worth for historical graph display
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  net_worth NUMERIC NOT NULL DEFAULT 0,
  bank_balance NUMERIC DEFAULT 0,
  assets_value NUMERIC DEFAULT 0,
  belongings_value NUMERIC DEFAULT 0,
  receivables_value NUMERIC DEFAULT 0,
  liabilities_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One snapshot per user per day
CREATE UNIQUE INDEX IF NOT EXISTS net_worth_snapshots_user_date_idx
  ON public.net_worth_snapshots(user_id, snapshot_date);

CREATE INDEX IF NOT EXISTS net_worth_snapshots_user_id_idx
  ON public.net_worth_snapshots(user_id);

-- Enable RLS
ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "net_worth_snapshots_crud_own" ON public.net_worth_snapshots;
CREATE POLICY "net_worth_snapshots_crud_own"
  ON public.net_worth_snapshots
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.net_worth_snapshots TO authenticated;

-- ============================================================================
-- CREDIT PROFILES TABLE
-- Stores income/employment info for credit score calculation
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.credit_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Income Information
  estimated_monthly_income NUMERIC DEFAULT 0 CHECK (estimated_monthly_income >= 0),
  income_source TEXT DEFAULT 'salary', -- salary, business, freelance, pension, other
  
  -- Employment Details
  employment_type TEXT DEFAULT 'salaried', -- salaried, self_employed, business_owner, retired, student
  employer_name TEXT,
  years_employed INTEGER DEFAULT 0 CHECK (years_employed >= 0),
  
  -- Existing Credit
  existing_credit_cards INTEGER DEFAULT 0 CHECK (existing_credit_cards >= 0),
  total_credit_limit NUMERIC DEFAULT 0 CHECK (total_credit_limit >= 0),
  credit_utilization_percent NUMERIC DEFAULT 0 CHECK (credit_utilization_percent >= 0 AND credit_utilization_percent <= 100),
  
  -- Credit History (self-reported)
  has_missed_payments BOOLEAN DEFAULT FALSE,
  missed_payments_count INTEGER DEFAULT 0,
  oldest_account_years INTEGER DEFAULT 0 CHECK (oldest_account_years >= 0),
  
  -- Calculated Score (cached)
  calculated_score INTEGER CHECK (calculated_score >= 300 AND calculated_score <= 850),
  score_calculated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS credit_profiles_user_id_idx ON public.credit_profiles(user_id);

DROP TRIGGER IF EXISTS credit_profiles_updated_at ON public.credit_profiles;
CREATE TRIGGER credit_profiles_updated_at
  BEFORE UPDATE ON public.credit_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.credit_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credit_profiles_crud_own" ON public.credit_profiles;
CREATE POLICY "credit_profiles_crud_own"
  ON public.credit_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_profiles TO authenticated;

-- ============================================================================
-- DONE - Run this in Supabase SQL Editor
-- ============================================================================
