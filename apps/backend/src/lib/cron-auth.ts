import type { Context } from "hono";
import { env } from "hono/adapter";
import type { TEnvs } from "./types";

/**
 * Validates cron/automation requests via x-api-key header.
 * In production, CRON_API_KEY must be configured and must match.
 */
export function authorizeCronRequest(c: Context): Response | null {
  const { CRON_API_KEY, ENV_MODE } = env<TEnvs>(c);
  const apiKey = c.req.header("x-api-key");

  if (ENV_MODE === "production") {
    if (!CRON_API_KEY) {
      console.error("[CRON] CRON_API_KEY is not configured in production");
      return c.json(
        { ok: false, error: "Cron endpoints are not configured" },
        503
      );
    }
    if (apiKey !== CRON_API_KEY) {
      return c.json({ ok: false, error: "Unauthorized" }, 401);
    }
    return null;
  }

  if (CRON_API_KEY && apiKey !== CRON_API_KEY) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }

  return null;
}
