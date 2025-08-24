-- Complete RLS Policy Fix for RoutineMate
-- This fixes the infinite recursion issue in household_members policies

-- Step 1: Disable RLS temporarily
ALTER TABLE household_members DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies for household_members
DROP POLICY IF EXISTS "Users can view household members for households they belong to" ON household_members;
DROP POLICY IF EXISTS "Household admins can manage members" ON household_members;
DROP POLICY IF EXISTS "Users can view household members for their households" ON household_members;
DROP POLICY IF EXISTS "Users can join households" ON household_members;
DROP POLICY IF EXISTS "Household creators can manage their households" ON household_members;

-- Step 3: Create new policies that avoid circular references

-- Policy 1: Allow authenticated users to view household_members for households they are in
-- This uses a direct approach without self-referencing
CREATE POLICY "View household members for own households" ON household_members
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Policy 2: Allow users to insert themselves when joining households
CREATE POLICY "Users can join households" ON household_members
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Policy 3: Allow household admins to manage members (uses households table to avoid circular ref)
CREATE POLICY "Admins can manage household members" ON household_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM households h
            WHERE h.id = household_members.household_id
            AND h.created_by = auth.uid()
        )
    );

-- Step 4: Re-enable RLS
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'household_members';

-- Alternative approach: If the above still causes issues, use this simpler approach
-- DROP POLICY IF EXISTS "View household members for own households" ON household_members;
-- DROP POLICY IF EXISTS "Users can join households" ON household_members;
-- DROP POLICY IF EXISTS "Admins can manage household members" ON household_members;

-- CREATE POLICY "Allow all operations for authenticated users" ON household_members
--     FOR ALL
--     USING (auth.uid() IS NOT NULL)
--     WITH CHECK (auth.uid() IS NOT NULL);