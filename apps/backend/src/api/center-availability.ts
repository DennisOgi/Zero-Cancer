import { zValidator } from "@hono/zod-validator";
import {
  getCenterAvailabilityQuerySchema,
  updateCenterAvailabilitySchema,
} from "@zerocancer/shared";
import type {
  TErrorResponse,
  TGetCenterAvailabilityResponse,
  TUpdateCenterAvailabilityResponse,
} from "@zerocancer/shared/types";
import { Hono } from "hono";
import {
  getCenterAvailability,
  saveCenterAvailability,
} from "../lib/center-availability";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const centerAvailabilityApp = new Hono<THonoApp>();

centerAvailabilityApp.get(
  "/",
  authMiddleware(["center", "center_staff"]),
  zValidator("query", getCenterAvailabilityQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const payload = c.get("jwtPayload");
    const centerId = payload?.id as string;
    const query = c.req.valid("query");
    try {
      const data = await getCenterAvailability(c, centerId, query);
      return c.json<TGetCenterAvailabilityResponse>({ ok: true, data });
    } catch (error) {
      console.error("Get own center availability error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to load availability" },
        500
      );
    }
  }
);

centerAvailabilityApp.put(
  "/",
  authMiddleware(["center", "center_staff"]),
  zValidator("json", updateCenterAvailabilitySchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const payload = c.get("jwtPayload");
    const canEdit =
      payload?.profile === "CENTER" || payload?.staffRole === "ADMIN";
    if (!canEdit) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Only facility admins can edit availability." },
        403
      );
    }
    const body = c.req.valid("json");
    try {
      const data = await saveCenterAvailability(
        c,
        payload!.id as string,
        body.weekly,
        body.exceptions
      );
      return c.json<TUpdateCenterAvailabilityResponse>({ ok: true, data });
    } catch (error) {
      console.error("Save center availability error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to save availability" },
        500
      );
    }
  }
);
