import { TaskTemplate, HouseholdMember, RoundRobinTracking } from '../types';

export class AssignmentUtils {
  /**
   * Get the next assignee for a round-robin assignment
   */
  static getNextRoundRobinAssignee(
    template: TaskTemplate,
    tracking: RoundRobinTracking | null,
    householdMembers: HouseholdMember[]
  ): string | null {
    // Filter eligible members based on round-robin users list
    const eligibleMembers = householdMembers.filter(member =>
      template.round_robin_users?.includes(member.user_id) ?? false
    );

    if (eligibleMembers.length === 0) {
      return null;
    }

    // If no tracking exists, start with the first member
    if (!tracking) {
      return eligibleMembers[0].user_id;
    }

    // Find current index in the eligible members list
    const currentIndex = eligibleMembers.findIndex(
      member => member.user_id === tracking.user_ids[tracking.current_index]
    );

    if (currentIndex === -1) {
      // Current assignee not found in eligible list, start from beginning
      return eligibleMembers[0].user_id;
    }

    // Get next index (circular)
    const nextIndex = (currentIndex + 1) % eligibleMembers.length;
    return eligibleMembers[nextIndex].user_id;
  }

  /**
   * Get the next assignee for load-balanced assignment
   */
  static getNextLoadBalancedAssignee(
    template: TaskTemplate,
    householdMembers: HouseholdMember[],
    taskCounts: Record<string, number> // user_id -> task count
  ): string | null {
    const eligibleMembers = householdMembers.filter(member =>
      template.round_robin_users?.includes(member.user_id) ?? false
    );

    if (eligibleMembers.length === 0) {
      return null;
    }

    // Find member with fewest tasks
    let minTasks = Infinity;
    let selectedMember = null;

    for (const member of eligibleMembers) {
      const taskCount = taskCounts[member.user_id] || 0;
      if (taskCount < minTasks) {
        minTasks = taskCount;
        selectedMember = member;
      }
    }

    return selectedMember?.user_id || null;
  }

  /**
   * Update round-robin tracking after assignment
   */
  static updateRoundRobinTracking(
    tracking: RoundRobinTracking,
    assignedUserId: string,
    eligibleMembers: HouseholdMember[]
  ): RoundRobinTracking {
    const userIndex = eligibleMembers.findIndex(
      member => member.user_id === assignedUserId
    );

    if (userIndex === -1) {
      return tracking;
    }

    return {
      ...tracking,
      current_index: userIndex,
      last_assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Validate assignment strategy configuration
   */
  static validateAssignmentStrategy(template: TaskTemplate): { isValid: boolean; error?: string } {
    switch (template.assignment_strategy) {
      case 'single':
        if (!template.default_assignee) {
          return { isValid: false, error: 'Default assignee is required for single assignment strategy' };
        }
        break;

      case 'round_robin':
        if (!template.round_robin_users || template.round_robin_users.length === 0) {
          return { isValid: false, error: 'Round-robin users list is required for round-robin assignment strategy' };
        }
        break;

      case 'load_balance':
        if (!template.round_robin_users || template.round_robin_users.length === 0) {
          return { isValid: false, error: 'Eligible users list is required for load-balanced assignment strategy' };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * Get assignment strategy description
   */
  static getAssignmentStrategyDescription(template: TaskTemplate): string {
    switch (template.assignment_strategy) {
      case 'single':
        return 'Always assigned to the same person';
      case 'round_robin':
        return `Rotates among ${template.round_robin_users?.length || 0} members`;
      case 'load_balance':
        return `Assigned to member with fewest tasks among ${template.round_robin_users?.length || 0} members`;
      default:
        return 'Unknown assignment strategy';
    }
  }

  /**
   * Get eligible assignees for a template
   */
  static getEligibleAssignees(
    template: TaskTemplate,
    householdMembers: HouseholdMember[]
  ): HouseholdMember[] {
    if (template.assignment_strategy === 'single') {
      return householdMembers.filter(member => member.user_id === template.default_assignee);
    }

    if (template.round_robin_users && template.round_robin_users.length > 0) {
      return householdMembers.filter(member =>
        template.round_robin_users!.includes(member.user_id)
      );
    }

    return [];
  }
}

export default AssignmentUtils;