import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || "https://example.com"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "example-key"

// Service role client for API routes (bypass RLS for now, or use as admin)
export const db = createClient(supabaseUrl, supabaseServiceKey)
