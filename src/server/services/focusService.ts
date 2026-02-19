import { db } from "@/server/db";
import { FocusSessionSchema, FocusSession } from "@/core/planTypes";
import { AppError, ValidationError } from "@/lib/errors";

export const focusService = {
  async createSession(userId: string, sessionData: Partial<FocusSession>) {
    // Ensure user_id is set
    const payload = { ...sessionData, user_id: userId };

    const validation = FocusSessionSchema.safeParse(payload);

    if (!validation.success) {
      throw new ValidationError("Validation failed", undefined, validation.error.format());
    }

    const { data, error } = await db
      .from("focus_sessions")
      .insert(validation.data)
      .select()
      .single();

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as FocusSession;
  },

  async getSessions(userId: string) {
    const { data, error } = await db
      .from("focus_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as FocusSession[];
  },
};
