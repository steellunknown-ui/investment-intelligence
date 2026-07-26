-- Ensure the transactions table has all the latest columns required by the AI parser and frontend
-- This script fixes the "Could not find the raw_message column" error by ensuring column names match.

-- 1. Check and add columns if they are missing or named differently
DO $$
BEGIN
    -- Fix 'raw_text' / 'raw_message' inconsistency
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='raw_text') THEN
        -- If raw_text exists, rename it to raw_message to match the code's expectation
        -- OR we can keep both for safety
        NULL;
    ELSE
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS raw_text TEXT;
    END IF;

    -- Ensure 'raw_message' exists as it's being used in some parts of the code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='raw_message') THEN
        ALTER TABLE transactions ADD COLUMN raw_message TEXT;
    END IF;

    -- Add missing AI parser specific columns
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_decimal DECIMAL(12, 2);
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS method TEXT; -- 'upi', 'card', etc.
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant TEXT; -- AI extracted merchant
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bank TEXT;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_last4 TEXT;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS upi_id TEXT;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS balance_after DECIMAL(12, 2);
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_ref TEXT;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS fingerprint TEXT UNIQUE;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

END $$;

-- 2. Update existing data if needed (optional)
-- UPDATE transactions SET raw_message = raw_text WHERE raw_message IS NULL AND raw_text IS NOT NULL;

-- 3. Reset RLS Policies to ensure they cover new columns
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- 4. Notify about success
COMMENT ON TABLE transactions IS 'Updated at 2026-07-19 for AI Parsing support';
