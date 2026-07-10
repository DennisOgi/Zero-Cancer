/**
 * Apply center branding columns. Reads DATABASE_URL from env (do not print).
 * Usage: node --env-file=.dev.vars scripts/apply-center-branding.mjs
 * Or set DATABASE_URL then run this file.
 */
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

// Prefer direct connection for DDL (strip pgbouncer query if present)
const directUrl = url
  .replace(":6543/", ":5432/")
  .replace("?pgbouncer=true", "")
  .replace("&pgbouncer=true", "");

const client = new pg.Client({
  connectionString: directUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(`
    ALTER TABLE "ServiceCenter"
      ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "reportFooterText" TEXT,
      ADD COLUMN IF NOT EXISTS "brandColor" TEXT;
  `);
  const { rows } = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'ServiceCenter'
      AND column_name IN ('logoUrl', 'reportFooterText', 'brandColor')
    ORDER BY column_name;
  `);
  console.log(
    "Branding columns present:",
    rows.map((r) => r.column_name).join(", ") || "(none)",
  );
} catch (err) {
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}
