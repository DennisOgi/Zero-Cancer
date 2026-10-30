import { zValidator } from "@hono/zod-validator";
import {
  getCenterAvailabilityQuerySchema,
  updateCenterAvailabilitySchema,
} from "@zerocancer/shared";
import type { TErrorResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "../lib/db";
import {
  getStaffAvailability,
  saveStaffAvailability,
} from "../lib/staff-availability";
import { resolveCenterStaff } from "../lib/center-context";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";
import { isClinicalStaffRole } from "@zerocancer/shared";

export const staffAvailabilityApp = new Hono<THonoApp>();

staffAvailabilityApp.use("*", authMiddleware(["center", "center_staff"]));

// GET /api/center/staff-availability — own schedule (clinical) or ?staffId= for admin
staffAvailabilityApp.get(
  "/",
  zValidator("query", getCenterAvailabilityQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const db = getDB(c);
      const context = await resolveCenterStaff(c, db);
      const query = c.req.valid("query");
      const requestedStaffId = query.staffId;
      const isAdmin =
        context.profile === "CENTER" || context.staffRole === "ADMIN";

      let staffId = context.staffId as string | undefined;
      if (requestedStaffId) {
        if (!isAdmin && requestedStaffId !== context.staffId) {
          return c.json<TErrorResponse>(
            { ok: false, error: "Not allowed to view another staff schedule." },
            403
          );
        }
        staffId = requestedStaffId;
      }

      if (!staffId) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Staff account required." },
          400
        );
      }

      // Ensure staff belongs to this center
      const member = await db.centerStaff.findFirst({
        where: { id: staffId, centerId: context.centerId },
      });
      if (!member) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Staff member not found at this facility." },
          404
        );
      }

      const data = await getStaffAvailability(c, staffId, query);
      return c.json({ ok: true, data });
    } catch (error) {
      console.error("Get staff availability error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to load staff schedule" },
        500
      );
    }
  }
);

// GET /api/center/staff-availability/team — admin: all clinical schedules
staffAvailabilityApp.get("/team", async (c) => {
  try {
    const db = getDB(c);
    const context = await resolveCenterStaff(c, db);
    const isAdmin =
      context.profile === "CENTER" || context.staffRole === "ADMIN";
    if (!isAdmin) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Only facility admins can view team schedules." },
        403
      );
    }

    const members = await db.centerStaff.findMany({
      where: {
        centerId: context.centerId,
        NOT: { status: "REMOVED" },
      },
      select: { id: true, fullName: true, email: true, role: true, status: true },
    });

    const clinical = (members || []).filter((m: any) =>
      isClinicalStaffRole(m.role)
    );

    const schedules = await Promise.all(
      clinical.map(async (m: any) => {
        const avail = await getStaffAvailability(c, m.id);
        return {
          staffId: m.id,
          fullName: m.fullName || m.email,
          email: m.email,
          role: m.role,
          status: m.status,
          hasCustomHours: avail.hasCustomHours,
          weekly: avail.weekly,
        };
      })
    );

    return c.json({ ok: true, data: { schedules } });
  } catch (error) {
    console.error("Team schedules error:", error);
    return c.json<TErrorResponse>(
      { ok: false, error: "Failed to load team schedules" },
      500
    );
  }
});

// PUT /api/center/staff-availability — save own schedule
staffAvailabilityApp.put(
  "/",
  zValidator("json", updateCenterAvailabilitySchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const db = getDB(c);
      const context = await resolveCenterStaff(c, db);
      const body = c.req.valid("json");
      const isAdmin =
        context.profile === "CENTER" || context.staffRole === "ADMIN";

      let targetStaffId = context.staffId as string | undefined;
      if (body.staffId) {
        if (!isAdmin) {
          return c.json<TErrorResponse>(
            {
              ok: false,
              error: "Only facility admins can edit another staff schedule.",
            },
            403
          );
        }
        targetStaffId = body.staffId;
      }

      if (!targetStaffId) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Staff account required to set a personal schedule.",
          },
          400
        );
      }

      if (
        targetStaffId === context.staffId &&
        !isClinicalStaffRole(context.staffRole) &&
        context.staffRole !== "ADMIN"
      ) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Only clinical staff can set a personal schedule." },
          403
        );
      }

      const member = await db.centerStaff.findFirst({
        where: { id: targetStaffId, centerId: context.centerId },
      });
      if (!member) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Staff member not found at this facility." },
          404
        );
      }
      if (!isClinicalStaffRole(member.role) && !isAdmin) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Personal schedules are for doctors and nurses.",
          },
          403
        );
      }

      const data = await saveStaffAvailability(
        c,
        targetStaffId,
        body.weekly,
        body.exceptions
      );
      return c.json({ ok: true, data });
    } catch (error) {
      console.error("Save staff availability error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to save schedule" },
        500
      );
    }
  }
);
