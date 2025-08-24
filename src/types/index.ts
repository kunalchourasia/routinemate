// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Household types
export interface Household {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Household member types
export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user?: User;
}

// Task types
export interface Task {
  id: string;
  household_id: string;
  title: string;
  description?: string;
  is_recurring: boolean;
  recurrence_rule_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Recurrence rule types
export interface RecurrenceRule {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // e.g., every 2 weeks
  days_of_week?: number[]; // 0-6, Sunday = 0
  day_of_month?: number; // 1-31
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// Task assignment types
export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  assigned_date: string;
  due_date?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  task?: Task;
  user?: User;
}

// Round-robin assignment types
export interface RoundRobinAssignment {
  id: string;
  task_id: string;
  user_ids: string[]; // Array of user IDs in rotation
  current_index: number; // Current position in rotation
  created_at: string;
  updated_at: string;
}

// Task completion history
export interface TaskHistory {
  id: string;
  task_id: string;
  assignment_id: string;
  user_id: string;
  completed_at: string;
  notes?: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Household: { householdId: string };
  TaskDetails: { taskId: string };
  CreateTask: { householdId: string };
  HouseholdMembers: { householdId: string };
};

// Form types
export interface CreateTaskForm {
  title: string;
  description?: string;
  is_recurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  interval?: number;
  days_of_week?: number[];
  day_of_month?: number;
  end_date?: string;
  assignment_type: 'single' | 'round_robin';
  assigned_user_id?: string;
  round_robin_users?: string[];
}

export interface CreateHouseholdForm {
  name: string;
  description?: string;
}