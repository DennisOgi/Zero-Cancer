import { TActors } from "@zerocancer/shared";
import { env } from "hono/adapter";
import { createMiddleware } from "hono/factory";
import { jwt } from "hono/jwt";
import { isRefreshTokenPayload } from "../lib/auth-ttl";
import { TEnvs, THonoApp } from "src/lib/types";

// export const authMiddleware = (actor?: TActors) =>
//   createMiddleware((c, next) => {
//     const { JWT_TOKEN_SECRET } = env<{TEnvs}>(c);

//     const jwtMiddleware = jwt({
//       secret: JWT_TOKEN_SECRET,
//     });

//     return jwtMiddleware(c, next);
//   });

export const authMiddleware = (
  actor?: (TActors | "center_staff" | "admin")[]
) =>
  createMiddleware<THonoApp>(async (c, next) => {
    const { JWT_TOKEN_SECRET } = env<TEnvs>(c);

    const jwtMiddleware = jwt({
      secret: JWT_TOKEN_SECRET,
    });

    // Run JWT middleware first
    await jwtMiddleware(c, async () => {});

    // Refresh tokens may only be exchanged at /auth/refresh, never used as access tokens.
    const payload = c.get("jwtPayload");
    if (isRefreshTokenPayload(payload)) {
      return c.json({ ok: false, message: "Unauthorized" }, 401);
    }

    // If no actor restriction, continue
    if (!actor) return next();

    // Check profile in payload
    const profile = payload?.profile?.toLowerCase();
    const allowed = actor.map((a) => a.toLowerCase());
    if (!profile || !allowed.includes(profile)) {
      return c.json({ ok: false, message: "Forbidden: actor mismatch" }, 403);
    }

    // If actor matches, continue
    return next();
  });
