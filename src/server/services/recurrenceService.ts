import { RRule } from "rrule";

export const recurrenceService = {
    getNextDueDate(rule: string, lastDate: Date): Date | null {
        try {
            const rrule = RRule.fromString(rule);
            // We need to set dtstart to ensuring the rule logic works from the last date
            // However, usually we just want the *next* occurrence after the last specific date.

            const nextDate = rrule.after(lastDate);
            return nextDate;
        } catch (error) {
            console.error("Failed to parse recurrence rule:", rule, error);
            return null;
        }
    },

    validateRule(rule: string): boolean {
        try {
            RRule.fromString(rule);
            return true;
        } catch {
            return false;
        }
    }
};
