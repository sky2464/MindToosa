import { db } from "@/server/db";
import { z } from "zod";
import { AppError, ValidationError } from "@/lib/errors";

export const UserSettingsSchema = z.object({
  user_id: z.string().email(),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  working_hours_start: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  working_hours_end: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  notifications_enabled: z.boolean().default(false),
  timezone: z.string().optional(),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const userService = {
  async getSettings(userId: string) {
    const { data, error } = await db
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "Row not found"
      throw new AppError(error.message, "DB_ERROR");
    }

    if (!data) {
      // Return defaults if not found, maybe create it lazily
      return {
        user_id: userId,
        theme: "system",
        working_hours_start: "09:00",
        working_hours_end: "17:00",
        notifications_enabled: false,
      } as UserSettings;
    }

    return data as UserSettings;
  },

  async updateSettings(userId: string, settings: Partial<UserSettings>) {
    // Validate inputs
    const partialSchema = UserSettingsSchema.partial().omit({ user_id: true });
    const validation = partialSchema.safeParse(settings);

    if (!validation.success) {
      throw new ValidationError("Validation failed", undefined, validation.error.format());
    }

    // Upsert
    const { data, error } = await db
      .from("user_settings")
      .upsert({
        user_id: userId,
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as UserSettings;
  },
};
