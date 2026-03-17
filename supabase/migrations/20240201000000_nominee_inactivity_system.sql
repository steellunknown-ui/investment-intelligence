-- ============================================================================
-- NOMINEE INACTIVITY MONITORING SYSTEM — Migration
-- ============================================================================
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Idempotent: safe to run multiple times
-- ============================================================================

-- ============================================================================
-- 1) EXTEND NOMINEES TABLE (safe — only adds missing columns)
-- ============================================================================
DO $$
BEGIN
  -- Nominee phone (MANDATORY for setting up nominee)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='nominee_phone') THEN
    ALTER TABLE public.nominees ADD COLUMN nominee_phone TEXT;
  END IF;

  -- Aadhaar hash (SHA-256, never store raw)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='aadhaar_hash') THEN
    ALTER TABLE public.nominees ADD COLUMN aadhaar_hash TEXT;
  END IF;

  -- PAN hash (SHA-256, never store raw)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='pan_hash') THEN
    ALTER TABLE public.nominees ADD COLUMN pan_hash TEXT;
  END IF;

  -- Verification method (auto-set based on what host provides)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='nominees' AND column_name='verification_method') THEN
    ALTER TABLE public.nominees ADD COLUMN verification_method TEXT DEFAULT 'phone_only';
  END IF;
END $$;

-- ============================================================================
-- 2) INACTIVITY TRACKER — Tracks login activity & reminder stages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.inactivity_tracker (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  last_login_at TIMESTAMPTZ DEFAULT NOW(),

  reminder_stage_1_sent BOOLEAN DEFAULT FALSE,
  reminder_stage_2_sent BOOLEAN DEFAULT FALSE,
  reminder_stage_3_sent BOOLEAN DEFAULT FALSE,

  nominee_triggered BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inactivity_tracker_last_login_idx
  ON public.inactivity_tracker(last_login_at);

DROP TRIGGER IF EXISTS inactivity_tracker_updated_at ON public.inactivity_tracker;
CREATE TRIGGER inactivity_tracker_updated_at
  BEFORE UPDATE ON public.inactivity_tracker
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.inactivity_tracker ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inactivity_tracker_crud_own" ON public.inactivity_tracker;
CREATE POLICY "inactivity_tracker_crud_own"
  ON public.inactivity_tracker
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 3) NOMINEE ATTEMPTS — Tracks verification attempts & blocking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.nominee_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nominee_id UUID NOT NULL REFERENCES public.nominees(id) ON DELETE CASCADE,

  attempt_count INTEGER DEFAULT 0,

  blocked BOOLEAN DEFAULT FALSE,
  blocked_until TIMESTAMPTZ,

  last_attempt_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nominee_attempts_nominee_id_idx
  ON public.nominee_attempts(nominee_id);

ALTER TABLE public.nominee_attempts ENABLE ROW LEVEL SECURITY;

-- Service-level access only (admin manages this)
DROP POLICY IF EXISTS "nominee_attempts_service_only" ON public.nominee_attempts;
CREATE POLICY "nominee_attempts_service_only"
  ON public.nominee_attempts
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 4) NOMINEE SESSIONS — Active sessions with permission scope
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.nominee_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nominee_id UUID NOT NULL REFERENCES public.nominees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  session_token TEXT NOT NULL UNIQUE,

  is_active BOOLEAN DEFAULT TRUE,

  permissions JSONB DEFAULT '{"view": ["dashboard","insurance","banking","assets","holdings","documents"], "edit": ["liabilities","receivables","belongings"], "hidden": ["nominees","settings"]}'::jsonb,

  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nominee_sessions_token_idx
  ON public.nominee_sessions(session_token);

CREATE INDEX IF NOT EXISTS nominee_sessions_nominee_id_idx
  ON public.nominee_sessions(nominee_id);

ALTER TABLE public.nominee_sessions ENABLE ROW LEVEL SECURITY;

-- Service-level access only
DROP POLICY IF EXISTS "nominee_sessions_service_only" ON public.nominee_sessions;
CREATE POLICY "nominee_sessions_service_only"
  ON public.nominee_sessions
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- 5) SYSTEM CONFIG — Key-value configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read config, only service role can write
DROP POLICY IF EXISTS "system_config_read_authenticated" ON public.system_config;
CREATE POLICY "system_config_read_authenticated"
  ON public.system_config
  FOR SELECT
  USING (true);

-- Insert default testing values (skip if already exist)
INSERT INTO public.system_config (key, value)
VALUES
  ('INACTIVITY_STAGE_1', '5'),
  ('INACTIVITY_STAGE_2', '10'),
  ('INACTIVITY_STAGE_3', '15'),
  ('INACTIVITY_STAGE_4', '20'),
  ('TIME_UNIT', 'minutes'),
  ('MAX_NOMINEE_ATTEMPTS', '3')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 6) USER INACTIVITY SETTINGS — Per-user custom timing
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_inactivity_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Total days/minutes for inactivity period (auto-divides into 4 equal stages)
  total_period INTEGER NOT NULL DEFAULT 20,

  -- Whether to use the custom setting or system default
  use_custom BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS user_inactivity_settings_updated_at ON public.user_inactivity_settings;
CREATE TRIGGER user_inactivity_settings_updated_at
  BEFORE UPDATE ON public.user_inactivity_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_inactivity_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_inactivity_settings_crud_own" ON public.user_inactivity_settings;
CREATE POLICY "user_inactivity_settings_crud_own"
  ON public.user_inactivity_settings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 7) GRANTS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inactivity_tracker TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nominee_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nominee_sessions TO authenticated;
GRANT SELECT ON public.system_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_inactivity_settings TO authenticated;

-- ============================================================================
-- DONE — Nominee Inactivity Monitoring System tables created
-- ============================================================================
