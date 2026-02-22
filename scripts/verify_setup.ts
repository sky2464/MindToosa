import { db } from "../src/server/db";

async function verify() {
  console.log("Verifying setup...");

  // Check connection
  const { data: now, error: connError } = await db.rpc("uuid_generate_v4"); // Just a test query, or select now() if possible.
  // Actually rpc might not exist if extension not enabled, but uuid_generate_v4 is used in schema.

  if (connError && connError.code !== "PGRST202") {
    // Function not found is fine, connection is what matters
    // Try simple select
    const { error } = await db.from("tasks").select("id").limit(1);
    if (error) {
      console.error("❌ Database connection failed:", error.message);
      process.exit(1);
    }
  }
  console.log("✅ Database connected.");

  // Check tables
  const tables = ["tasks", "user_settings", "notifications", "task_dependencies"];
  for (const table of tables) {
    const { error } = await db.from(table).select("id").limit(0);
    if (error) {
      console.error(`❌ Table '${table}' missing or inaccessible:`, error.message);
    } else {
      console.log(`✅ Table '${table}' exists.`);
    }
  }

  // Check columns in tasks
  const { error: colError } = await db.from("tasks").select("recurrence_rule").limit(0);
  if (colError) {
    console.error(
      "❌ Column 'recurrence_rule' missing in 'tasks'. Migration 0009 might have failed."
    );
  } else {
    console.log("✅ Column 'recurrence_rule' exists.");
  }

  process.exit(0);
}

verify();
