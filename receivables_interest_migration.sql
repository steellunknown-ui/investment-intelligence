-- Add interest calculation columns to receivables table
ALTER TABLE receivables 
ADD COLUMN interest_type VARCHAR(20) DEFAULT 'simple' CHECK (interest_type IN ('simple', 'compound')),
ADD COLUMN interest_start_date DATE,
ADD COLUMN interest_end_date DATE,
ADD COLUMN interest_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN last_interest_calculated_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to set interest_start_date to given_date if interest_rate exists
UPDATE receivables 
SET interest_start_date = given_date 
WHERE interest_rate IS NOT NULL AND interest_rate > 0;