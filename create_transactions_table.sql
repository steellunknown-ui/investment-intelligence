-- Create the transactions table for Smart Passbook
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    source_name TEXT NOT NULL, -- e.g., "ICICI Credit Card", "HDFC UPI"
    merchant_name TEXT NOT NULL, -- e.g., "Amazon", "Zomato"
    amount DECIMAL(12, 2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category TEXT DEFAULT 'Uncategorized', -- e.g., "Food", "Shopping", "Bills"
    payment_mode TEXT NOT NULL, -- "CREDIT", "DEBIT", "UPI"
    raw_message TEXT, -- The original SMS/Notification text for debugging
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own transactions
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert their own transactions"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own transactions
CREATE POLICY "Users can update their own transactions"
ON transactions FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own transactions
CREATE POLICY "Users can delete their own transactions"
ON transactions FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_mode ON transactions(payment_mode);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
