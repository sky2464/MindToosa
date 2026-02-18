import { z } from "zod";

/**
 * Environment Variable Schema
 * 
 * This schema validates all required environment variables at application startup.
 * If any required variable is missing or invalid, the application will fail fast
 * with a clear error message instead of failing at runtime.
 * 
 * Note: Some variables are optional to allow builds without all env vars.
 * Runtime validation will still occur when these features are used.
 */
const envSchema = z.object({
  // AI Provider (optional for build, required at runtime for AI features)
  AI_PROVIDER_API_KEY: z.string().min(1, "AI_PROVIDER_API_KEY is required for AI features").optional(),

  // Supabase
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // NextAuth (optional for build, required at runtime)
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters").optional(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required for authentication"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required for authentication"),

  // Optional: Auth URL (defaults to localhost in development)
  AUTH_URL: z.string().url().optional(),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
});

/**
 * Validated and type-safe environment variables
 * 
 * This object is guaranteed to contain all required environment variables
 * with the correct types. If validation fails, the application will not start.
 */
export const env = envSchema.parse({
  AI_PROVIDER_API_KEY: process.env.AI_PROVIDER_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET, // Fallback to AUTH_SECRET
  AUTH_SECRET: process.env.AUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  NODE_ENV: process.env.NODE_ENV,
});

// Type export for use in other files
export type Env = z.infer<typeof envSchema>;
