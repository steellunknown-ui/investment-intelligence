-- Run this in your Supabase SQL Editor:
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS instrument TEXT DEFAULT 'UPI (Bank Account)',
  ADD COLUMN IF NOT EXISTS card_network TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS raw_sender TEXT DEFAULT NULL;

COMMENT ON COLUMN transactions.instrument IS 
  'Payment instrument: UPI (Bank Account), RuPay Credit Card on UPI, Credit Card (Swipe/POS), Credit Card (Online), Debit Card, Wallet, Net Banking, etc.';

COMMENT ON COLUMN transactions.card_network IS 
  'Card Network: RuPay, Visa, Mastercard, Amex, etc.';

COMMENT ON COLUMN transactions.raw_sender IS 
  'Original SMS sender ID / TRAI header (e.g. VK-BOBSMS, HDFCBK) or app package name';

CREATE INDEX IF NOT EXISTS idx_transactions_instrument ON transactions(instrument);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

