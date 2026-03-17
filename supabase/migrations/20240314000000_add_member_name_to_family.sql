-- Add member_name column to family_members for local name storage
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'member_name') THEN
        ALTER TABLE family_members ADD COLUMN member_name TEXT;
    END IF;
END $$;

-- Fix existing data: set a fallback name for records with NULL member_name
UPDATE family_members
SET member_name = 'Family Member'
WHERE member_name IS NULL;
