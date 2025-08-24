-- Enable RLS
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Households table
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Household members table
CREATE TABLE household_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(household_id, user_id)
);

-- Recurrence rules table
CREATE TABLE recurrence_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frequency VARCHAR(50) CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')) NOT NULL,
    interval INTEGER DEFAULT 1,
    days_of_week INTEGER[] DEFAULT '{}',
    day_of_month INTEGER,
    week_of_month INTEGER,
    day_of_week INTEGER,
    month_of_year INTEGER,
    end_date DATE,
    occurrences_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule_id UUID REFERENCES recurrence_rules(id) ON DELETE SET NULL,
    priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    estimated_duration INTEGER, -- in minutes
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task templates table (for recurring task templates)
CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    recurrence_rule_id UUID REFERENCES recurrence_rules(id) ON DELETE CASCADE,
    default_assignee UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    round_robin_users UUID[] DEFAULT '{}',
    assignment_strategy VARCHAR(50) CHECK (assignment_strategy IN ('single', 'round_robin', 'load_balance')) DEFAULT 'single',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task assignments table
CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    due_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, user_id, assigned_date)
);

-- Round-robin tracking table
CREATE TABLE round_robin_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES task_templates(id) ON DELETE CASCADE,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    user_ids UUID[] NOT NULL DEFAULT '{}',
    current_index INTEGER DEFAULT 0,
    last_assigned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id)
);

-- Task history table
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES task_assignments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_minutes INTEGER,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_robin_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Households policies
CREATE POLICY "Users can view households they are members of" ON households
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = households.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create households" ON households
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Household admins can update their households" ON households
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = households.id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Household members policies
CREATE POLICY "Users can view household members for households they belong to" ON household_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM household_members hm
            WHERE hm.household_id = household_members.household_id
            AND hm.user_id = auth.uid()
        )
    );

CREATE POLICY "Household admins can manage members" ON household_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = household_members.household_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Tasks policies
CREATE POLICY "Users can view tasks in their households" ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = tasks.household_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks in their households" ON tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = tasks.household_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks in their households" ON tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM household_members
            WHERE household_id = tasks.household_id
            AND user_id = auth.uid()
        )
    );

-- Task assignments policies
CREATE POLICY "Users can view assignments in their households" ON task_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN household_members hm ON t.household_id = hm.household_id
            WHERE t.id = task_assignments.task_id
            AND hm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create assignments for tasks in their households" ON task_assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN household_members hm ON t.household_id = hm.household_id
            WHERE t.id = task_assignments.task_id
            AND hm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own assignments" ON task_assignments
    FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_household_members_household_id ON household_members(household_id);
CREATE INDEX idx_household_members_user_id ON household_members(user_id);
CREATE INDEX idx_tasks_household_id ON tasks(household_id);
CREATE INDEX idx_tasks_recurrence_rule_id ON tasks(recurrence_rule_id);
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX idx_task_assignments_assigned_date ON task_assignments(assigned_date);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_user_id ON task_history(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurrence_rules_updated_at BEFORE UPDATE ON recurrence_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_assignments_updated_at BEFORE UPDATE ON task_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_round_robin_tracking_updated_at BEFORE UPDATE ON round_robin_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();