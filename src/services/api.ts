import { supabase } from './supabase';
import {
  User,
  Household,
  HouseholdMember,
  Task,
  TaskTemplate,
  TaskAssignment,
  RecurrenceRule,
  RoundRobinTracking,
  CreateHouseholdForm,
  CreateTaskForm
} from '../types';

class ApiService {
  // Authentication methods
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  }

  // Household methods
  async createHousehold(form: CreateHouseholdForm): Promise<{ data: Household | null; error: any }> {
    const { user } = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('households')
      .insert({
        name: form.name,
        description: form.description,
        created_by: user.id
      })
      .select()
      .single();

    if (error) return { data: null, error };

    // Add creator as admin member
    await supabase
      .from('household_members')
      .insert({
        household_id: data.id,
        user_id: user.id,
        role: 'admin'
      });

    return { data, error: null };
  }

  async getUserHouseholds(): Promise<{ data: Household[] | null; error: any }> {
    const { user } = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('households')
      .select(`
        *,
        household_members!inner(user_id)
      `)
      .eq('household_members.user_id', user.id);

    return { data, error };
  }

  async getHouseholdMembers(householdId: string): Promise<{ data: HouseholdMember[] | null; error: any }> {
    const { data, error } = await supabase
      .from('household_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('household_id', householdId);

    return { data, error };
  }

  async joinHousehold(householdId: string, inviteCode?: string): Promise<{ data: HouseholdMember | null; error: any }> {
    const { user } = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('household_members')
      .insert({
        household_id: householdId,
        user_id: user.id,
        role: 'member'
      })
      .select()
      .single();

    return { data, error };
  }

  // Task methods
  async getHouseholdTasks(householdId: string): Promise<{ data: Task[] | null; error: any }> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        recurrence_rule:recurrence_rules(*),
        assignments:task_assignments(*, user:users(*))
      `)
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async createTask(householdId: string, form: CreateTaskForm): Promise<{ data: Task | null; error: any }> {
    const { user } = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    let recurrenceRuleId = null;

    // Create recurrence rule if task is recurring
    if (form.is_recurring) {
      const { data: rule, error: ruleError } = await supabase
        .from('recurrence_rules')
        .insert({
          frequency: form.frequency!,
          interval: form.interval!,
          days_of_week: form.days_of_week,
          day_of_month: form.day_of_month,
          end_date: form.end_date
        })
        .select()
        .single();

      if (ruleError) return { data: null, error: ruleError };
      recurrenceRuleId = rule.id;
    }

    // Create the task
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        household_id: householdId,
        title: form.title,
        description: form.description,
        is_recurring: form.is_recurring,
        recurrence_rule_id: recurrenceRuleId,
        created_by: user.id
      })
      .select()
      .single();

    if (error) return { data: null, error };

    // Create initial assignment if not recurring
    if (!form.is_recurring && form.assigned_user_id) {
      await supabase
        .from('task_assignments')
        .insert({
          task_id: data.id,
          user_id: form.assigned_user_id,
          assigned_date: new Date().toISOString().split('T')[0]
        });
    }

    return { data, error: null };
  }

  async completeTask(assignmentId: string): Promise<{ data: TaskAssignment | null; error: any }> {
    const { user } = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('task_assignments')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user.id
      })
      .eq('id', assignmentId)
      .select()
      .single();

    return { data, error };
  }

  // Task template methods
  async getHouseholdTemplates(householdId: string): Promise<{ data: TaskTemplate[] | null; error: any }> {
    const { data, error } = await supabase
      .from('task_templates')
      .select(`
        *,
        recurrence_rule:recurrence_rules(*)
      `)
      .eq('household_id', householdId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async createTaskTemplate(
    householdId: string,
    template: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ data: TaskTemplate | null; error: any }> {
    const { user } = await this.getCurrentUser();
    if (!user) return { data: null, error: 'User not authenticated' };

    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        ...template,
        household_id: householdId,
        created_by: user.id
      })
      .select()
      .single();

    return { data, error };
  }

  // Assignment methods
  async getTaskAssignments(householdId: string, date?: string): Promise<{ data: TaskAssignment[] | null; error: any }> {
    let query = supabase
      .from('task_assignments')
      .select(`
        *,
        task:tasks(*),
        user:users(*)
      `)
      .eq('tasks.household_id', householdId);

    if (date) {
      query = query.eq('assigned_date', date);
    }

    const { data, error } = await query.order('assigned_date', { ascending: true });

    return { data, error };
  }

  // Round-robin tracking methods
  async getRoundRobinTracking(templateId: string): Promise<{ data: RoundRobinTracking | null; error: any }> {
    const { data, error } = await supabase
      .from('round_robin_tracking')
      .select('*')
      .eq('template_id', templateId)
      .single();

    return { data, error };
  }

  async updateRoundRobinTracking(
    tracking: RoundRobinTracking
  ): Promise<{ data: RoundRobinTracking | null; error: any }> {
    const { data, error } = await supabase
      .from('round_robin_tracking')
      .upsert(tracking)
      .select()
      .single();

    return { data, error };
  }

  // Real-time subscriptions
  subscribeToHouseholdTasks(householdId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`household_${householdId}_tasks`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `household_id=eq.${householdId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToTaskAssignments(householdId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`household_${householdId}_assignments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_assignments',
          filter: `tasks.household_id=eq.${householdId}`
        },
        callback
      )
      .subscribe();
  }
}

export const apiService = new ApiService();
export default apiService;