import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");

function loadEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}`);
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(envPath);
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set in web/.env");
}
if (!url.includes("pooler")) {
  console.warn("Warning: DATABASE_URL host does not contain 'pooler'. Use Neon pooled URL.");
}

const migrationPath = resolve(__dir, "../../api/migrations/001_emails.up.sql");
const migration = readFileSync(migrationPath, "utf8");
const statements = migration
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const sql = neon(url);
for (const stmt of statements) {
  await sql.query(stmt);
  console.log("OK:", stmt.split("\n")[0].slice(0, 60) + "...");
}
console.log("Emails migration complete.");
