import { createClient } from "@supabase/supabase-js";
import { env } from "@/server/env";

/**
 * Supabase Database Client (Service Role)
 *
 * IMPORTANT: This client uses the service role key, which bypasses Row Level Security (RLS).
 *
 * Security Architecture:
 * - RLS policies are defined in the database for defense-in-depth
 * - This service role client bypasses RLS for server-side operations
 * - Authorization is enforced in the service layer (goalService, taskService, etc.)
 * - Each service method MUST verify userId matches the authenticated user
 *
 * Why Service Role Key?
 * - Simplifies server-side operations (no need to pass user context to Supabase)
 * - Allows admin operations when needed
 * - Service layer provides centralized authorization logic
 *
 * Security Requirements:
 * - NEVER expose this client to the browser
 * - ALWAYS verify userId in service methods before database operations
 * - Use .eq("user_id", userId) in all queries to enforce data isolation
 */

export const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
