-- Create family_members table for Family Hub monitoring
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'viewer',
    relation TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(owner_id, member_user_id)
);

-- Enable RLS
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Policy: Owner can view their family members
CREATE POLICY "Users can view their family members"
ON family_members FOR SELECT
USING (owner_id = auth.uid());

-- Policy: Owner can invite members
CREATE POLICY "Users can invite family members"
ON family_members FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Policy: Owner can remove members
CREATE POLICY "Users can remove family members"
ON family_members FOR DELETE
USING (owner_id = auth.uid());

-- Create index for performance
CREATE INDEX idx_family_members_owner ON family_members(owner_id);
CREATE INDEX idx_family_members_member ON family_members(member_user_id);

-- Add comment
COMMENT ON TABLE family_members IS 'Family Hub: Allows primary user to monitor family members financial data in read-only mode';
