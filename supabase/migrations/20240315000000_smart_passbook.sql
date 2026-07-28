-- Migration: Universal Smart Passbook Schema
-- This script ensures the transactions table has all required columns and creates the linked_cards table.

-- 1. Transactions Table
DROP TABLE IF EXISTS transactions CASCADE;
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source text NOT NULL, -- 'sms' or 'notification' or 'auto'
  raw_text text,
  amount decimal NOT NULL,
  currency text DEFAULT 'INR',
  type text NOT NULL CHECK (type IN ('credit','debit')),
  method text DEFAULT 'unknown',
  merchant text,
  bank text,
  account_last4 text,
  upi_id text,
  balance_after decimal,
  transaction_ref text,
  transaction_date timestamptz DEFAULT now(),
  fingerprint text UNIQUE,
  is_verified boolean DEFAULT false,
  category text DEFAULT 'Others',
  notes text,
  parsed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 2. Linked Cards Table
DROP TABLE IF EXISTS linked_cards CASCADE;
CREATE TABLE linked_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bank text NOT NULL,
  last4 text,
  card_type text DEFAULT 'debit', -- 'credit', 'debit', 'upi_only'
  created_at timestamptz DEFAULT now()
);

-- 3. Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_cards" ON linked_cards
  FOR ALL USING (auth.uid() = user_id);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_fingerprint ON transactions(fingerprint);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
