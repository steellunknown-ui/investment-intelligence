-- ============================================================================
-- INVESTMENT INTELLIGENCE - SUPABASE SCHEMA + RLS POLICIES
-- ============================================================================
-- Run this entire script in: Supabase Dashboard → SQL Editor → New Query
-- This script is idempotent - safe to run multiple times
-- ============================================================================

-- ============================================================================
-- 1. HELPER FUNCTION: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- 3. HOLDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT,
  asset_type TEXT DEFAULT 'stock',
  quantity NUMERIC NOT NULL DEFAULT 0,
  avg_buy_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS holdings_user_id_idx ON public.holdings(user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS holdings_updated_at ON public.holdings;
CREATE TRIGGER holdings_updated_at
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can insert own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can update own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can delete own holdings" ON public.holdings;

-- RLS Policies for holdings
CREATE POLICY "Users can view own holdings"
  ON public.holdings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own holdings"
  ON public.holdings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own holdings"
  ON public.holdings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own holdings"
  ON public.holdings FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 4. NOMINEES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship TEXT,
  access_level TEXT DEFAULT 'view_only',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS nominees_user_id_idx ON public.nominees(user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS nominees_updated_at ON public.nominees;
CREATE TRIGGER nominees_updated_at
  BEFORE UPDATE ON public.nominees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own nominees" ON public.nominees;
DROP POLICY IF EXISTS "Users can insert own nominees" ON public.nominees;
DROP POLICY IF EXISTS "Users can update own nominees" ON public.nominees;
DROP POLICY IF EXISTS "Users can delete own nominees" ON public.nominees;

-- RLS Policies for nominees
CREATE POLICY "Users can view own nominees"
  ON public.nominees FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own nominees"
  ON public.nominees FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own nominees"
  ON public.nominees FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own nominees"
  ON public.nominees FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 4.1 NOMINEE LIMIT TRIGGER (Max 3 per user)
-- Enforced at database level for security
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_nominee_limit()
RETURNS TRIGGER AS $$
DECLARE
  nominee_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO nominee_count
  FROM public.nominees
  WHERE user_id = NEW.user_id;
  
  IF nominee_count >= 3 THEN
    RAISE EXCEPTION 'Maximum of 3 nominees allowed per user';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_nominee_limit ON public.nominees;
CREATE TRIGGER enforce_nominee_limit
  BEFORE INSERT ON public.nominees
  FOR EACH ROW EXECUTE FUNCTION public.check_nominee_limit();

-- ============================================================================
-- 5. INACTIVITY_CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inactivity_config (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  inactivity_days INTEGER DEFAULT 15,
  enabled BOOLEAN DEFAULT TRUE,
  last_activity_at TIMESTAMPTZ,
  warning_sent_at TIMESTAMPTZ,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS inactivity_config_updated_at ON public.inactivity_config;
CREATE TRIGGER inactivity_config_updated_at
  BEFORE UPDATE ON public.inactivity_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.inactivity_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own inactivity config" ON public.inactivity_config;
DROP POLICY IF EXISTS "Users can insert own inactivity config" ON public.inactivity_config;
DROP POLICY IF EXISTS "Users can update own inactivity config" ON public.inactivity_config;

-- RLS Policies for inactivity_config (NO DELETE allowed)
CREATE POLICY "Users can view own inactivity config"
  ON public.inactivity_config FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own inactivity config"
  ON public.inactivity_config FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own inactivity config"
  ON public.inactivity_config FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: No DELETE policy = users cannot delete their inactivity config

-- ============================================================================
-- 6. ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS alerts_user_id_idx ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS alerts_created_at_idx ON public.alerts(created_at DESC);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.alerts;

-- RLS Policies for alerts
-- Users can only READ their own alerts
CREATE POLICY "Users can view own alerts"
  ON public.alerts FOR SELECT
  USING (user_id = auth.uid());

-- Users can only UPDATE is_read on their own alerts
CREATE POLICY "Users can update own alerts"
  ON public.alerts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT is blocked for normal users (service_role bypasses RLS)
-- No INSERT policy means anon/authenticated users cannot insert
-- Service role (used by backend) will bypass RLS and can insert

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.holdings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nominees TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.inactivity_config TO authenticated;
GRANT SELECT, UPDATE ON public.alerts TO authenticated;

-- ============================================================================
-- DONE! Schema and RLS policies are now in place.
-- ============================================================================
