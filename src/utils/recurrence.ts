import { RecurrenceRule } from '../types';

export class RecurrenceUtils {
  /**
   * Calculate next occurrence dates for a recurrence rule
   */
  static getNextOccurrences(
    rule: RecurrenceRule,
    startDate: Date = new Date(),
    count: number = 10
  ): Date[] {
    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);

    // Ensure we start from a valid occurrence
    currentDate = this.getNextValidOccurrence(rule, currentDate);

    for (let i = 0; i < count; i++) {
      if (rule.end_date && currentDate > new Date(rule.end_date)) {
        break;
      }

      if (rule.occurrences_count && occurrences.length >= rule.occurrences_count) {
        break;
      }

      occurrences.push(new Date(currentDate));

      // Calculate next occurrence
      currentDate = this.getNextOccurrence(rule, currentDate);
    }

    return occurrences;
  }

  /**
   * Get the next valid occurrence date for a recurrence rule
   */
  static getNextValidOccurrence(rule: RecurrenceRule, fromDate: Date): Date {
    let date = new Date(fromDate);

    switch (rule.frequency) {
      case 'daily':
        return this.getNextDailyOccurrence(rule, date);

      case 'weekly':
        return this.getNextWeeklyOccurrence(rule, date);

      case 'monthly':
        return this.getNextMonthlyOccurrence(rule, date);

      default:
        return date;
    }
  }

  /**
   * Calculate the next occurrence after a given date
   */
  static getNextOccurrence(rule: RecurrenceRule, fromDate: Date): Date {
    let nextDate = new Date(fromDate);

    switch (rule.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + rule.interval);
        break;

      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (rule.interval * 7));
        // Adjust to the correct day of week if specified
        if (rule.days_of_week && rule.days_of_week.length > 0) {
          nextDate = this.adjustToNextDayOfWeek(nextDate, rule.days_of_week);
        }
        break;

      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + rule.interval);
        // Adjust to specific day of month if specified
        if (rule.day_of_month) {
          nextDate.setDate(rule.day_of_month);
        }
        break;
    }

    return nextDate;
  }

  private static getNextDailyOccurrence(rule: RecurrenceRule, fromDate: Date): Date {
    const date = new Date(fromDate);
    const daysToAdd = rule.interval - 1; // -1 because we're already at the current day
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }

  private static getNextWeeklyOccurrence(rule: RecurrenceRule, fromDate: Date): Date {
    const date = new Date(fromDate);

    if (rule.days_of_week && rule.days_of_week.length > 0) {
      // Find the next day of week in the list
      const currentDayOfWeek = date.getDay();
      let nextDayOfWeek = Math.min(...rule.days_of_week.filter(d => d >= currentDayOfWeek));

      if (nextDayOfWeek === currentDayOfWeek) {
        // If today is a valid day, check if it's already passed the time
        // For simplicity, assume we want the next occurrence, so add a week
        nextDayOfWeek = Math.min(...rule.days_of_week);
        date.setDate(date.getDate() + (rule.interval * 7));
      } else if (nextDayOfWeek < currentDayOfWeek) {
        // Next valid day is next week
        nextDayOfWeek = Math.min(...rule.days_of_week);
        date.setDate(date.getDate() + (rule.interval * 7));
      }

      const daysToAdd = (nextDayOfWeek - date.getDay() + 7) % 7;
      date.setDate(date.getDate() + daysToAdd);
    } else {
      // Default to same day next week(s)
      date.setDate(date.getDate() + (rule.interval * 7));
    }

    return date;
  }

  private static getNextMonthlyOccurrence(rule: RecurrenceRule, fromDate: Date): Date {
    const date = new Date(fromDate);

    if (rule.day_of_month) {
      // Set to specific day of month
      date.setMonth(date.getMonth() + rule.interval);
      date.setDate(rule.day_of_month);

      // Handle cases where the day doesn't exist in the target month (e.g., Feb 31)
      if (date.getDate() !== rule.day_of_month) {
        // Set to last day of the target month
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
      }
    } else {
      // Default to same day next month(s)
      date.setMonth(date.getMonth() + rule.interval);
    }

    return date;
  }

  private static adjustToNextDayOfWeek(date: Date, validDays: number[]): Date {
    const currentDay = date.getDay();
    const nextValidDay = validDays.find(day => day >= currentDay) || Math.min(...validDays);
    const daysToAdd = nextValidDay >= currentDay ? nextValidDay - currentDay : 7 - currentDay + nextValidDay;
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }

  /**
   * Generate human-readable description of recurrence rule
   */
  static getRecurrenceDescription(rule: RecurrenceRule): string {
    const interval = rule.interval;
    const frequency = rule.frequency;

    switch (frequency) {
      case 'daily':
        if (interval === 1) return 'Every day';
        return `Every ${interval} days`;

      case 'weekly':
        if (interval === 1) {
          if (rule.days_of_week && rule.days_of_week.length > 0) {
            const dayNames = rule.days_of_week.map(day => {
              const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              return days[day];
            });
            return `Every ${dayNames.join(', ')}`;
          }
          return 'Every week';
        }
        return `Every ${interval} weeks`;

      case 'monthly':
        if (interval === 1) {
          if (rule.day_of_month) {
            return `Monthly on day ${rule.day_of_month}`;
          }
          return 'Every month';
        }
        return `Every ${interval} months`;

      default:
        return 'Custom recurrence';
    }
  }

  /**
   * Check if a date matches a recurrence rule
   */
  static matchesRecurrence(date: Date, rule: RecurrenceRule): boolean {
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const month = date.getMonth();

    switch (rule.frequency) {
      case 'daily':
        return true; // Every day matches

      case 'weekly':
        if (rule.days_of_week && rule.days_of_week.length > 0) {
          return rule.days_of_week.includes(dayOfWeek);
        }
        return true; // Every week matches

      case 'monthly':
        if (rule.day_of_month) {
          return dayOfMonth === rule.day_of_month;
        }
        return true; // Every month matches

      default:
        return false;
    }
  }
}

export default RecurrenceUtils;