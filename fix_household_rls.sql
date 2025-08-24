-- Fix the household creation RLS policy to handle automatic user ID setting

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can create households" ON households;

-- Create a new policy that allows authenticated users to create households
-- The created_by field will be set automatically by a trigger
CREATE POLICY "Users can create households" ON households
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create a trigger function to automatically set created_by
CREATE OR REPLACE FUNCTION set_household_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS set_created_by_on_household_insert ON households;
CREATE TRIGGER set_created_by_on_household_insert
    BEFORE INSERT ON households
    FOR EACH ROW
    EXECUTE FUNCTION set_household_created_by();