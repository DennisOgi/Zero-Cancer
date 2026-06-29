import type { Context, Next } from "hono";

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 15;
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientKey(c: Context) {
  return (
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

export async function uploadRateLimit(c: Context, next: Next) {
  const key = getClientKey(c);
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= LIMIT) {
    return c.json(
      {
        ok: false,
        error: "Too many upload attempts. Please try again later.",
      },
      429
    );
  }

  entry.count += 1;
  return next();
}
