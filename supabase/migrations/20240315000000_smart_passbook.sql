-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- DROP existing transactions table if it exists (As per user confirmation)
DROP TABLE IF EXISTS transactions CASCADE;

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT CHECK (source IN ('sms', 'notification', 'auto')),
    raw_text TEXT,
    amount DECIMAL(15, 2),
    currency TEXT DEFAULT 'INR',
    type TEXT CHECK (type IN ('credit', 'debit')),
    method TEXT,a
    account_last4 TEXT,
    upi_id TEXT,
    balance_after DECIMAL(15, 2),
    transaction_ref TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE,
    fingerprint TEXT UNIQUE,
    is_verified BOOLEAN DEFAULT false,
    category TEXT,
    notes TEXT,
    parsed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger for transactions
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only SELECT their own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only INSERT their own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only UPDATE their own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only DELETE their own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);


-- Create linked_cards table
CREATE TABLE IF NOT EXISTS linked_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bank TEXT NOT NULL,
    last4 TEXT NOT NULL,
    card_type TEXT CHECK (card_type IN ('credit', 'debit', 'upi_only')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger for linked_cards
DROP TRIGGER IF EXISTS update_linked_cards_updated_at ON linked_cards;
CREATE TRIGGER update_linked_cards_updated_at
    BEFORE UPDATE ON linked_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for linked_cards
ALTER TABLE linked_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own linked_cards"
    ON linked_cards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own linked_cards"
    ON linked_cards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own linked_cards"
    ON linked_cards FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own linked_cards"
    ON linked_cards FOR DELETE
    USING (auth.uid() = user_id);
