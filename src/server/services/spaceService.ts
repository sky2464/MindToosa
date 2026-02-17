import { db } from "@/server/db";
import { Space, SpaceSchema } from "@/core/planTypes";

export const spaceService = {
    async getSpaces(userId: string) {
        const { data, error } = await db
            .from("spaces")
            .select("*")
            .eq("user_id", userId);

        if (error) throw new Error(error.message);
        return data as Space[];
    },

    async createSpace(userId: string, name: string) {
        const spaceData = {
            name,
            user_id: userId,
            archived: false
        };

        const validation = SpaceSchema.safeParse(spaceData);
        if (!validation.success) throw new Error("Validation failed");

        const { data, error } = await db
            .from("spaces")
            .insert(validation.data)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data as Space;
    },

    async ensureDefaultSpace(userId: string) {
        const spaces = await this.getSpaces(userId);
        if (spaces.length > 0) return spaces[0];

        return await this.createSpace(userId, "General");
    }
};
