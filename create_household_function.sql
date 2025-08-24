-- Create a stored procedure for creating households with proper authentication
CREATE OR REPLACE FUNCTION create_household(
    household_name VARCHAR(255),
    household_description TEXT DEFAULT NULL
)
RETURNS households AS $$
DECLARE
    new_household households;
BEGIN
    -- Insert the household with the authenticated user as creator
    INSERT INTO households (name, description, created_by)
    VALUES (household_name, household_description, auth.uid())
    RETURNING * INTO new_household;

    -- Add the creator as an admin member
    INSERT INTO household_members (household_id, user_id, role)
    VALUES (new_household.id, auth.uid(), 'admin');

    RETURN new_household;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_household(VARCHAR(255), TEXT) TO authenticated;