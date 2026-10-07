import crypto from "node:crypto";
import fs from "node:fs";
import postgres from "postgres";

const raw = fs.readFileSync(new URL("../.dev.vars", import.meta.url), "utf8");
const env = Object.fromEntries(
  raw
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i),
        l
          .slice(i + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ];
    }),
);

const secret = env.JWT_TOKEN_SECRET;
if (!secret) {
  console.error("JWT_TOKEN_SECRET missing");
  process.exit(1);
}
const token = crypto.createHash("sha256").update(secret).digest("hex");
const url = env.DATABASE_URL;
const local =
  /localhost|127.0.0.1/.test(url) || url.includes("sslmode=disable");
const sql = postgres(url, {
  prepare: false,
  max: 1,
  connect_timeout: 15,
  ssl: local ? false : "require",
});

try {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS public._backend_gate (
      token text PRIMARY KEY
    );
    REVOKE ALL ON TABLE public._backend_gate FROM anon, authenticated, PUBLIC;
    DELETE FROM public._backend_gate;
  `);
  await sql.unsafe(
    `INSERT INTO public._backend_gate (token) VALUES ('${token.replace(/'/g, "''")}')`,
  );
  console.log("BACKEND_GATE_OK");
} catch (e) {
  console.error("BACKEND_GATE_FAIL", e.message);
  process.exit(1);
} finally {
  await sql.end({ timeout: 2 });
}
