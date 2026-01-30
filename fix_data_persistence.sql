-- FIX SCRIPT: Verify Tables and RLS Policies
-- This script ensures the 'holdings' table exists and has the correct policies
-- Run this in Supabase SQL Editor

-- 1. Create holdings table if it doesn't exist (It seems missing from v2 schema)
CREATE TABLE IF NOT EXISTS public.holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    name TEXT,
    asset_type TEXT DEFAULT 'stock',
    quantity NUMERIC NOT NULL,
    avg_buy_price NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index on user_id for performance
CREATE INDEX IF NOT EXISTS holdings_user_id_idx ON public.holdings(user_id);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

-- 4. DROPPING EXISTING POLICIES (to ensure we start fresh and avoid conflicts)
DROP POLICY IF EXISTS "Users can view own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can insert own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can update own holdings" ON public.holdings;
DROP POLICY IF EXISTS "Users can delete own holdings" ON public.holdings;

-- 5. RE-CREATE POLICIES (Crucial for data to be visible)

-- SELECT: Users can only see their own rows
CREATE POLICY "Users can view own holdings"
ON public.holdings FOR SELECT
USING (user_id = auth.uid());

-- INSERT: Users can only insert rows for themselves
CREATE POLICY "Users can insert own holdings"
ON public.holdings FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own rows
CREATE POLICY "Users can update own holdings"
ON public.holdings FOR UPDATE
USING (user_id = auth.uid());

-- DELETE: Users can delete their own rows
CREATE POLICY "Users can delete own holdings"
ON public.holdings FOR DELETE
USING (user_id = auth.uid());


-- 6. Verify other critical tables (Assets, Liabilities, Bank Accounts) just in case
-- Re-applying these policies is safe (idempotent if drops are used)

-- ASSETS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own assets" ON public.assets;
CREATE POLICY "Users can view own assets" ON public.assets FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own assets" ON public.assets;
CREATE POLICY "Users can insert own assets" ON public.assets FOR INSERT WITH CHECK (user_id = auth.uid());

-- LIABILITIES
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own liabilities" ON public.liabilities;
CREATE POLICY "Users can view own liabilities" ON public.liabilities FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own liabilities" ON public.liabilities;
CREATE POLICY "Users can insert own liabilities" ON public.liabilities FOR INSERT WITH CHECK (user_id = auth.uid());

-- BANK ACCOUNTS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can view own bank accounts" ON public.bank_accounts FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can insert own bank accounts" ON public.bank_accounts FOR INSERT WITH CHECK (user_id = auth.uid());

-- RECEIVABLES
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own receivables" ON public.receivables;
CREATE POLICY "Users can view own receivables" ON public.receivables FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own receivables" ON public.receivables;
CREATE POLICY "Users can insert own receivables" ON public.receivables FOR INSERT WITH CHECK (user_id = auth.uid());

-- BELONGINGS
ALTER TABLE public.belongings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own belongings" ON public.belongings;
CREATE POLICY "Users can view own belongings" ON public.belongings FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own belongings" ON public.belongings;
CREATE POLICY "Users can insert own belongings" ON public.belongings FOR INSERT WITH CHECK (user_id = auth.uid());

-- DOCUMENTS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (user_id = auth.uid());

-- NOMINEES
ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own nominees" ON public.nominees;
CREATE POLICY "Users can view own nominees" ON public.nominees FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own nominees" ON public.nominees;
CREATE POLICY "Users can insert own nominees" ON public.nominees FOR INSERT WITH CHECK (user_id = auth.uid());


-- CONFIRMATION
SELECT 'Verification Complete. RLS Policies Applied to ALL modules.' as status;
