import { createClient } from "@supabase/supabase-js";

// We use the service role key for admin tasks if needed,
// but here we might just need a client that can carry the user's session
// OR we use the admin client to safely update stats without trusting the client.
// Given the architecture in init.md mentions "server/db.ts", let's check if that exists or we create a standard client.
// For now, I'll assume we use a direct Supabase client with the service role for safe updates.

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const gamificationService = {
  async getStats(userId: string) {
    const { data, error } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // No stats found, create default
      return this.createStats(userId);
    }

    if (error) throw error;
    return data;
  },

  async createStats(userId: string) {
    const { data, error } = await supabase
      .from("user_stats")
      .insert([{ user_id: userId, xp: 0, level: 1, current_streak: 0 }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addXP(userId: string, amount: number) {
    // 1. Get current stats
    const stats = await this.getStats(userId);

    // 2. Calculate new values
    const newXP = stats.xp + amount;
    let newLevel = stats.level;

    // Simple level formula: Level = floor(sqrt(XP / 100)) + 1
    // OR simpler: Level up every 500 XP
    const nextLevelThreshold = newLevel * 500;
    if (newXP >= nextLevelThreshold) {
      newLevel++;
    }

    // 3. Update DB
    const { data, error } = await supabase
      .from("user_stats")
      .update({ xp: newXP, level: newLevel })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStreak(userId: string) {
    const stats = await this.getStats(userId);
    const today = new Date().toISOString().split("T")[0];
    const lastActivity = stats.last_activity_date;

    if (lastActivity === today) {
      return stats; // Already active today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak = stats.current_streak;

    if (lastActivity === yesterdayStr) {
      newStreak++;
    } else {
      newStreak = 1; // Reset streak if missed a day (or first day)
    }

    const { data, error } = await supabase
      .from("user_stats")
      .update({
        current_streak: newStreak,
        last_activity_date: today,
        longest_streak: Math.max(stats.longest_streak, newStreak),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
