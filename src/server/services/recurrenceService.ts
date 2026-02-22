import { RRule } from "rrule";

export const recurrenceService = {
  validateRule(rule: string): boolean {
    try {
      RRule.fromString(rule);
      return true;
    } catch {
      return false;
    }
  },

  getNextDueDate(rule: string, lastDate: Date): Date | null {
    try {
      // Parse the rule string into options
      const parsedOptions = RRule.parseString(rule);

      // Force dtstart to be the last occurrence so calculations start from there
      // We explicitly construct a new object to ensure dtstart is used
      const options = {
        ...parsedOptions,
        dtstart: lastDate,
      };

      const rrule = new RRule(options);

      // Get the next occurrence after the last one
      const nextDate = rrule.after(lastDate);
      return nextDate;
    } catch (error) {
      console.error("Failed to parse recurrence rule:", rule, error);
      return null;
    }
  },
};
