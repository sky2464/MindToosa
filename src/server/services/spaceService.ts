import { db } from "@/server/db";
import { Space, SpaceSchema } from "@/core/planTypes";
import { AppError, ValidationError } from "@/lib/errors";
import { z } from "zod";

const UUIDSchema = z.string().uuid("Invalid UUID format");

export const spaceService = {
  async getSpaces(userId: string) {
    const { data, error } = await db.from("spaces").select("*").eq("user_id", userId);

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Space[];
  },

  async createSpace(userId: string, name: string) {
    const spaceData = {
      name,
      user_id: userId,
      archived: false,
    };

    const validation = SpaceSchema.safeParse(spaceData);
    if (!validation.success) throw new ValidationError("Validation failed");

    const { data, error } = await db.from("spaces").insert(validation.data).select().single();

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Space;
  },

  async ensureDefaultSpace(userId: string) {
    const spaces = await this.getSpaces(userId);
    if (spaces.length > 0) return spaces[0];

    return await this.createSpace(userId, "General");
  },

  async updateSpace(userId: string, spaceId: string, updates: { name?: string }) {
    if (!UUIDSchema.safeParse(spaceId).success) throw new ValidationError("Invalid space ID");
    const { data, error } = await db
      .from("spaces")
      .update(updates)
      .eq("id", spaceId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Space;
  },

  async archiveSpace(userId: string, spaceId: string, archived: boolean = true) {
    if (!UUIDSchema.safeParse(spaceId).success) throw new ValidationError("Invalid space ID");
    const { data, error } = await db
      .from("spaces")
      .update({ archived })
      .eq("id", spaceId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw new AppError(error.message, "DB_ERROR");
    return data as Space;
  },
};
