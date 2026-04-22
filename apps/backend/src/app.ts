import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { getRouterName, showRoutes } from "hono/dev"; // import { serveStatic } from "@hono/node-server/serve-static";
import { logger } from "hono/logger";
import { adminApp } from "./api/admin";
import analyticsApp from "./api/analytics";
import { appointmentApp } from "./api/appointments";
import { authApp } from "./api/auth";
import { blogApp } from "./api/blog";
import { centerApp } from "./api/center";
import { donationApp } from "./api/donation";
import { notificationApp } from "./api/notification";
import { payoutsApp } from "./api/payouts";
// import receiptApp from "./api/receipts";
import { registerApp } from "./api/registration";
import { screeningTypesApp } from "./api/screening-types";
import { waitlistApp } from "./api/waitlist";
import { communityApp } from "./api/community";
import { kitApp } from "./api/kit";
import { getDB } from "./lib/db";
import { TEnvs } from "./lib/types";
import { displayEnvVars } from "./lib/utils";

// Create the main app (no basePath for root)
const app = new Hono();

// Create API app (no basePath since we'll mount it at /api/v1)
const apiApp = new Hono();

app.use(logger());

// Enable CORS for all routes
app.use("*", async (c, next) => {
  const { FRONTEND_URL, ENV_MODE } = env<TEnvs>(c);
  const origin = c.req.header("Origin");

  // In development, be more permissive with origins
  const allowedOrigins = [FRONTEND_URL];
  if (ENV_MODE !== "production") {
    allowedOrigins.push("http://localhost:3000", "http://127.0.0.1:3000");
    allowedOrigins.push("http://localhost:3001", "http://127.0.0.1:3001");
    allowedOrigins.push("http://localhost:3002", "http://127.0.0.1:3002");
  }

  const corsMiddlewareHandler = cors({
    origin: (origin) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return origin;
      }
      return FRONTEND_URL; // Fallback
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  return corsMiddlewareHandler(c, next);
});

// ========================================
// API ROUTES
// ========================================

apiApp.get("/", (c) => c.text("Hello from Hono.js + Prisma + CORS!"));
apiApp.get("/healthz", (c) => c.json({ status: "ok" }));

// Debug endpoint to test database connection
apiApp.get("/debug/db", async (c) => {
  try {
    const db = getDB(c);
    
    // Test simple query
    const userCount = await db.user.count();
    const adminCount = await db.admins.count();
    const centerCount = await db.serviceCenter.count();
    
    return c.json({
      status: "ok",
      database: "connected",
      counts: {
        users: userCount,
        admins: adminCount,
        centers: centerCount
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database test error:", error);
    return c.json({
      status: "error",
      database: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// Debug endpoint to test admin password
apiApp.get("/debug/admin", async (c) => {
  try {
    const db = getDB(c);
    const admin = await db.admins.findUnique({
      where: { email: "ttaiwo4910@gmail.com" }
    });
    
    return c.json({
      status: "ok",
      admin: admin ? {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        hasPassword: !!admin.passwordHash,
        passwordLength: admin.passwordHash?.length || 0
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin test error:", error);
    return c.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// Debug endpoint to check environment variables
apiApp.get("/debug/env", (c) => {
  const envVars = displayEnvVars(c);

  return c.json({
    status: "ok",
    environment: envVars,
    timestamp: new Date().toISOString(),
  });
});

// ROUTES
apiApp.route("/auth", authApp);
apiApp.route("/register", registerApp);
apiApp.route("/center", centerApp);
apiApp.route("/appointment", appointmentApp);
apiApp.route("/screening-types", screeningTypesApp);
apiApp.route("/waitlist", waitlistApp);
apiApp.route("/donor", donationApp);
apiApp.route("/admin", adminApp);
apiApp.route("/analytics", analyticsApp);
apiApp.route("/notifications", notificationApp);
// apiApp.route("/receipts", receiptApp);
apiApp.route("/payouts", payoutsApp);
apiApp.route("/community", communityApp);
apiApp.route("/kit", kitApp);
apiApp.route("/blog", blogApp);

// Mount API app BEFORE static file serving
app.route("/api/v1", apiApp);

// ========================================
// FALLBACK HANDLERS FOR DEV MODE
// ========================================

// Development fallback - helpful message
app.get("*", async (c) => {
  const { ENV_MODE } = env<TEnvs>(c);

  if (ENV_MODE !== "production") {
    return c.html(`
      <html>
        <head><title>Zerocancer Backend</title></head>
        <body style="font-family: Arial, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;">
          <h1>🏥 Zerocancer Backend</h1>
          <p><strong>Development Mode</strong></p>
          <p>The backend API is running. The frontend should be served separately in development.</p>
          <h2>🔗 Available Endpoints:</h2>
          <ul>
            <li><a href="/api/v1/healthz">/api/v1/healthz</a> - Health check</li>
            <li><a href="/api/v1">/api/v1</a> - API root</li>
          </ul>
          <h2>🚀 Frontend Development:</h2>
          <p>Run <code>pnpm dev</code> in the frontend directory to start the development server.</p>
          <p>The frontend will typically be available at <code>http://localhost:3000</code></p>
        </body>
      </html>
    `);
  }

  // Production fallback for unknown routes
  return c.json(
    {
      error: "Not Found",
      message: "The requested resource was not found.",
    },
    404
  );
});

export default app;
