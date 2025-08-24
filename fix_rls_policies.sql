-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view household members for households they belong to" ON household_members;
DROP POLICY IF EXISTS "Household admins can manage members" ON household_members;

-- Fixed RLS Policies for household_members

-- Allow users to view household members for households they belong to
CREATE POLICY "Users can view household members for their households" ON household_members
    FOR SELECT USING (
        household_id IN (
            SELECT household_id FROM household_members
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to insert themselves when joining a household
CREATE POLICY "Users can join households" ON household_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow household admins to manage members (excluding the circular reference)
CREATE POLICY "Household admins can manage members" ON household_members
    FOR ALL USING (
        household_id IN (
            SELECT hm.household_id
            FROM household_members hm
            WHERE hm.user_id = auth.uid()
            AND hm.role = 'admin'
        )
    );

-- Additional policy for household creators to manage their households
CREATE POLICY "Household creators can manage their households" ON household_members
    FOR ALL USING (
        household_id IN (
            SELECT id FROM households
            WHERE created_by = auth.uid()
        )
    );