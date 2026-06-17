-- Alter net_worth_snapshots columns to TEXT for encryption
ALTER TABLE net_worth_snapshots ALTER COLUMN net_worth TYPE TEXT USING net_worth::text;
ALTER TABLE net_worth_snapshots ALTER COLUMN bank_balance TYPE TEXT USING bank_balance::text;
ALTER TABLE net_worth_snapshots ALTER COLUMN assets_value TYPE TEXT USING assets_value::text;
ALTER TABLE net_worth_snapshots ALTER COLUMN belongings_value TYPE TEXT USING belongings_value::text;
ALTER TABLE net_worth_snapshots ALTER COLUMN receivables_value TYPE TEXT USING receivables_value::text;
ALTER TABLE net_worth_snapshots ALTER COLUMN liabilities_value TYPE TEXT USING liabilities_value::text;
