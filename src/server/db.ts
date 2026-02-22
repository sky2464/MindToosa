import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Lazy-initialized Supabase Database Client (Service Role)
 *
 * This module provides two exports:
 * - `getDb()` to explicitly obtain the initialized client
 * - `db` which is a proxy that forwards calls to the real client
 *
 * Both avoid importing validated `env` at module-import time so that builds
 * and static analysis don't trigger runtime-only environment validation.
 */

let cachedDb: SupabaseClient | null = null;

function initDb(): SupabaseClient {
	const supabaseUrl = process.env.SUPABASE_URL;
	const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		throw new Error(
			"SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the runtime environment"
		);
	}

	cachedDb = createClient(supabaseUrl, supabaseKey);
	return cachedDb;
}

export function getDb(): SupabaseClient {
	return cachedDb ?? initDb();
}

// Backwards-compatible proxy so existing imports `import { db } from '@/server/db'`
// continue to work without changing call sites. The proxy forwards property
// access and method calls to the lazily-initialized client.
const dbProxy = new Proxy({} as SupabaseClient, {
	get(_, prop: string | symbol) {
		const target = getDb();
		// @ts-ignore - forward to real client
		const val = (target as any)[prop];
		if (typeof val === "function") return val.bind(target);
		return val;
	},
	set(_, prop: string | symbol, value) {
		const target = getDb();
		// @ts-ignore
		target[prop as any] = value;
		return true;
	},
});

export const db = dbProxy as SupabaseClient;
