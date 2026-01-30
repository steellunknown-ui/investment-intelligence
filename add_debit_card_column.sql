-- Migration: Add debit_card_number to bank_accounts
-- Description: Fixes PGRST204 error where column was missing

ALTER TABLE bank_accounts 
ADD COLUMN IF NOT EXISTS debit_card_number TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bank_accounts' AND column_name = 'debit_card_number';
