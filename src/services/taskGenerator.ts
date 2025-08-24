import { TaskTemplate, RecurrenceRule, RoundRobinTracking, HouseholdMember } from '../types';
import { RecurrenceUtils } from '../utils/recurrence';
import { AssignmentUtils } from '../utils/assignment';
import { apiService } from './api';

export class TaskGenerator {
  /**
   * Generate tasks from all active templates in a household
   */
  static async generateTasksForHousehold(householdId: string, daysAhead: number = 7): Promise<void> {
    try {
      // Get all active templates
      const { data: templates, error: templatesError } = await apiService.getHouseholdTemplates(householdId);
      if (templatesError || !templates) {
        console.error('Failed to fetch templates:', templatesError);
        return;
      }

      // Get household members for assignment
      const { data: members, error: membersError } = await apiService.getHouseholdMembers(householdId);
      if (membersError || !members) {
        console.error('Failed to fetch household members:', membersError);
        return;
      }

      // Generate tasks for each template
      for (const template of templates) {
        await this.generateTasksFromTemplate(template, members, daysAhead);
      }
    } catch (error) {
      console.error('Error generating tasks for household:', error);
    }
  }

  /**
   * Generate tasks from a specific template
   */
  static async generateTasksFromTemplate(
    template: TaskTemplate,
    members: HouseholdMember[],
    daysAhead: number = 7
  ): Promise<void> {
    try {
      if (!template.recurrence_rule) {
        console.error('Template missing recurrence rule:', template.id);
        return;
      }

      const rule = template.recurrence_rule as RecurrenceRule;

      // Get upcoming dates for this recurrence rule
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + daysAhead);

      const upcomingDates = RecurrenceUtils.getNextOccurrences(rule, startDate, daysAhead);

      // Filter dates that are within our generation window
      const validDates = upcomingDates.filter(date => date <= endDate);

      // Get existing assignments for this template to avoid duplicates
      const existingAssignments = await this.getExistingAssignments(template.id, startDate, endDate);

      for (const date of validDates) {
        const dateStr = date.toISOString().split('T')[0];

        // Skip if assignment already exists for this date
        if (existingAssignments.has(dateStr)) {
          continue;
        }

        // Determine assignee based on strategy
        const assigneeId = await this.determineAssignee(template, members, date);

        if (assigneeId) {
          // Create task assignment
          await this.createTaskFromTemplate(template, assigneeId, date);
        }
      }
    } catch (error) {
      console.error(`Error generating tasks from template ${template.id}:`, error);
    }
  }

  /**
   * Get existing assignments for a template within a date range
   */
  private static async getExistingAssignments(
    templateId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Set<string>> {
    // This would need to be implemented based on your database structure
    // For now, return empty set
    return new Set();
  }

  /**
   * Determine the assignee for a task based on the template's assignment strategy
   */
  private static async determineAssignee(
    template: TaskTemplate,
    members: HouseholdMember[],
    date: Date
  ): Promise<string | null> {
    switch (template.assignment_strategy) {
      case 'single':
        return template.default_assignee || null;

      case 'round_robin':
        return await this.getRoundRobinAssignee(template, members);

      case 'load_balance':
        return await this.getLoadBalancedAssignee(template, members);

      default:
        return null;
    }
  }

  /**
   * Get the next assignee using round-robin strategy
   */
  private static async getRoundRobinAssignee(
    template: TaskTemplate,
    members: HouseholdMember[]
  ): Promise<string | null> {
    try {
      // Get current round-robin tracking
      const { data: tracking } = await apiService.getRoundRobinTracking(template.id);

      const assigneeId = AssignmentUtils.getNextRoundRobinAssignee(template, tracking, members);

      if (assigneeId && tracking) {
        // Update tracking
        const updatedTracking = AssignmentUtils.updateRoundRobinTracking(
          tracking,
          assigneeId,
          members
        );

        await apiService.updateRoundRobinTracking(updatedTracking);
      }

      return assigneeId;
    } catch (error) {
      console.error('Error getting round-robin assignee:', error);
      return null;
    }
  }

  /**
   * Get the next assignee using load-balanced strategy
   */
  private static async getLoadBalancedAssignee(
    template: TaskTemplate,
    members: HouseholdMember[]
  ): Promise<string | null> {
    try {
      // Get task counts for each member (simplified - you might want to cache this)
      const taskCounts: Record<string, number> = {};

      // This is a simplified implementation - in practice you'd want to query
      // actual task counts from the database
      for (const member of members) {
        if (template.round_robin_users?.includes(member.user_id)) {
          taskCounts[member.user_id] = Math.floor(Math.random() * 5); // Mock data
        }
      }

      return AssignmentUtils.getNextLoadBalancedAssignee(template, members, taskCounts);
    } catch (error) {
      console.error('Error getting load-balanced assignee:', error);
      return null;
    }
  }

  /**
   * Create a task assignment from a template
   */
  private static async createTaskFromTemplate(
    template: TaskTemplate,
    assigneeId: string,
    date: Date
  ): Promise<void> {
    try {
      // First, create or find the corresponding task
      // This is simplified - in practice you might want to create actual Task records
      // and then create TaskAssignment records

      // For now, we'll create the assignment directly
      // This assumes your database structure supports this approach

      console.log(`Creating task from template ${template.id} for ${assigneeId} on ${date.toISOString()}`);
    } catch (error) {
      console.error('Error creating task from template:', error);
    }
  }

  /**
   * Clean up old completed tasks (optional maintenance function)
   */
  static async cleanupOldTasks(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // This would delete old completed tasks
      // Implementation depends on your specific cleanup requirements
      console.log(`Cleaning up tasks older than ${cutoffDate.toISOString()}`);
    } catch (error) {
      console.error('Error cleaning up old tasks:', error);
    }
  }

  /**
   * Generate tasks for a specific date (useful for manual generation)
   */
  static async generateTasksForDate(householdId: string, date: Date): Promise<void> {
    const { data: templates } = await apiService.getHouseholdTemplates(householdId);
    if (!templates) return;

    const { data: members } = await apiService.getHouseholdMembers(householdId);
    if (!members) return;

    for (const template of templates) {
      if (this.shouldGenerateForDate(template, date)) {
        await this.generateTasksFromTemplate(template, members, 1);
      }
    }
  }

  /**
   * Check if a template should generate tasks for a specific date
   */
  private static shouldGenerateForDate(template: TaskTemplate, date: Date): boolean {
    if (!template.recurrence_rule) return false;

    const rule = template.recurrence_rule as RecurrenceRule;
    return RecurrenceUtils.matchesRecurrence(date, rule);
  }
}

export default TaskGenerator;