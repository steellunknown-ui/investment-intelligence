-- Add joint_holders JSONB column to bank_accounts table
-- This is a SAFE migration that keeps existing joint_holder_name for backward compatibility

ALTER TABLE bank_accounts
ADD COLUMN IF NOT EXISTS joint_holders JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN bank_accounts.joint_holders IS 'Array of joint holders with name and relation: [{"name": "John Doe", "relation": "Brother"}]';

-- Keep existing joint_holder_name column (DO NOT DROP)
-- New logic will use joint_holders JSONB
-- Existing data continues to work
