import { Hono } from "hono";
import { env } from "hono/adapter";
import { getDB } from "../lib/db";
import { TEnvs } from "../lib/types";
import { displayEnvVars } from "../lib/utils";

/**
 * Development-only diagnostics. Blocked entirely when ENV_MODE=production.
 */
export const debugApp = new Hono();

debugApp.use("*", async (c, next) => {
  const { ENV_MODE } = env<TEnvs>(c);
  if (ENV_MODE === "production") {
    return c.json(
      {
        error: "Not Found",
        message: "The requested resource was not found.",
      },
      404
    );
  }
  return next();
});

debugApp.get("/db", async (c) => {
  try {
    const db = getDB(c);

    const [userCount, adminCount, centerCount] = await Promise.all([
      db.user.count(),
      db.admins.count(),
      db.serviceCenter.count(),
    ]);

    return c.json({
      status: "ok",
      database: "connected",
      counts: { users: userCount, admins: adminCount, centers: centerCount },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database test error:", error);
    return c.json(
      {
        status: "error",
        database: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

debugApp.get("/env", (c) => {
  return c.json({
    status: "ok",
    environment: displayEnvVars(c),
    timestamp: new Date().toISOString(),
  });
});
