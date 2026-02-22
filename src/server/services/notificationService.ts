import { db } from "@/server/db";
import { z } from "zod";
import { AppError } from "@/lib/errors";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  type: "info" | "success" | "warning" | "error" | "reminder";
  read: boolean;
  link?: string;
  created_at: string;
}

export const notificationService = {
  async getUnread(userId: string) {
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Notification[];
  },

  async markAsRead(userId: string, notificationId: string) {
    const { error } = await db
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw new AppError(error.message, "DB_ERROR");
  },

  async markAllAsRead(userId: string) {
    const { error } = await db
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw new AppError(error.message, "DB_ERROR");
  },

  async create(
    userId: string,
    notification: Omit<Notification, "id" | "user_id" | "read" | "created_at">
  ) {
    // Check user preferences first?
    // Ideally we inject userService here, but cyclic deps might be an issue.
    // We'll trust the caller to check preferences if needed, or check db directly.

    // For now, just insert.
    const { data, error } = await db
      .from("notifications")
      .insert({
        user_id: userId,
        ...notification,
        read: false,
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Notification;
  },
};
