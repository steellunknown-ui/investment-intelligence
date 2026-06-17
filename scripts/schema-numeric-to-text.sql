-- 0. Drop CHECK constraints on these columns first (since encrypted strings can't be >= 0)
DO $$ 
DECLARE 
    r record;
BEGIN
    FOR r IN (
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'CHECK'
          AND ccu.column_name IN (
            'current_balance', 'current_market_value', 'principal_amount', 
            'outstanding_amount', 'emi_amount', 'amount', 'interest_amount', 
            'total_receivable', 'amount_received', 'sum_insured', 
            'premium_amount', 'quantity', 'avg_buy_price', 
            'purchase_value', 'current_estimated_value', 'weight_grams'
          )
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- 1. banking_accounts
ALTER TABLE bank_accounts ALTER COLUMN current_balance TYPE TEXT USING current_balance::text;

-- 2. assets
ALTER TABLE assets ALTER COLUMN current_market_value TYPE TEXT USING current_market_value::text;

-- 3. liabilities
ALTER TABLE liabilities ALTER COLUMN principal_amount TYPE TEXT USING principal_amount::text;
ALTER TABLE liabilities ALTER COLUMN outstanding_amount TYPE TEXT USING outstanding_amount::text;
ALTER TABLE liabilities ALTER COLUMN emi_amount TYPE TEXT USING emi_amount::text;

-- 4. liability_payments
ALTER TABLE liability_payments ALTER COLUMN amount TYPE TEXT USING amount::text;

-- 5. receivables
-- First, drop the generated column so we can alter its base columns
ALTER TABLE receivables DROP COLUMN outstanding_amount;

ALTER TABLE receivables ALTER COLUMN principal_amount TYPE TEXT USING principal_amount::text;
ALTER TABLE receivables ALTER COLUMN interest_amount TYPE TEXT USING interest_amount::text;
ALTER TABLE receivables ALTER COLUMN total_receivable TYPE TEXT USING total_receivable::text;
ALTER TABLE receivables ALTER COLUMN amount_received TYPE TEXT USING amount_received::text;

-- Add it back as a regular TEXT column
ALTER TABLE receivables ADD COLUMN outstanding_amount TEXT;

-- 6. insurance_policies
ALTER TABLE insurance_policies ALTER COLUMN sum_insured TYPE TEXT USING sum_insured::text;
ALTER TABLE insurance_policies ALTER COLUMN premium_amount TYPE TEXT USING premium_amount::text;

-- 7. holdings
ALTER TABLE holdings ALTER COLUMN quantity TYPE TEXT USING quantity::text;
ALTER TABLE holdings ALTER COLUMN avg_buy_price TYPE TEXT USING avg_buy_price::text;

-- 8. belongings
ALTER TABLE belongings ALTER COLUMN quantity TYPE TEXT USING quantity::text;
ALTER TABLE belongings ALTER COLUMN purchase_value TYPE TEXT USING purchase_value::text;
ALTER TABLE belongings ALTER COLUMN current_estimated_value TYPE TEXT USING current_estimated_value::text;
ALTER TABLE belongings ALTER COLUMN weight_grams TYPE TEXT USING weight_grams::text;
