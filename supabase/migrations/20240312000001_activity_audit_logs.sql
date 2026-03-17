-- ============================================================================
-- 6) ACTIVITY AUDIT LOGS - Centralized logging for security events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., 'LOGIN', 'INACTIVITY_STAGE', 'NOMINEE_VERIFY_SUCCESS', 'NOMINEE_VERIFY_FAIL'
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Host can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- System/Service Role can insert (we use service role for background logging)
-- But for front-end events, host might need to insert
CREATE POLICY "Users can insert their own logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_event ON public.audit_logs(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
