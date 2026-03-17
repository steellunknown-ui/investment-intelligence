-- Create bank_transactions table
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    description TEXT,
    reference_number VARCHAR(100),
    balance_after DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger for bank_transactions
CREATE TRIGGER update_bank_transactions_updated_at
    BEFORE UPDATE ON bank_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS Policies for bank_transactions
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank transactions"
    ON bank_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bank transactions"
    ON bank_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank transactions"
    ON bank_transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank transactions"
    ON bank_transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Optional: Add a function/trigger to auto-update the bank_account balance when a transaction is added
-- Creating a simple trigger to automatically update the bank_accounts table's balance
CREATE OR REPLACE FUNCTION update_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'credit' THEN
            UPDATE bank_accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        ELSIF NEW.type = 'debit' THEN
            UPDATE bank_accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'credit' THEN
            UPDATE bank_accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        ELSIF OLD.type = 'debit' THEN
            UPDATE bank_accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        END IF;
    -- Note: Updates to transaction amount/type would be handled separately or restricted 
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_balance_after_transaction
    AFTER INSERT OR DELETE ON bank_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_account_balance();
