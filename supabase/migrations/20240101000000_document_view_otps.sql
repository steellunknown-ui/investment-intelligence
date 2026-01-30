-- Create document_view_otps table for OTP verification
CREATE TABLE public.document_view_otps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    otp_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    verified_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_view_otps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own OTP records" ON public.document_view_otps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OTP records" ON public.document_view_otps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OTP records" ON public.document_view_otps
    FOR UPDATE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_document_view_otps_user_document ON public.document_view_otps(user_id, document_id);
CREATE INDEX idx_document_view_otps_expires ON public.document_view_otps(expires_at);