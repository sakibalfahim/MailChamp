import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon HTTP driver — safe with pooled DATABASE_URL. Unlike node-postgres,
// there is no prepare:false option; the HTTP path avoids PgBouncer prepared-statement issues.

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}
