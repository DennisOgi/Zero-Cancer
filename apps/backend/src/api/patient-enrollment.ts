import { zValidator } from "@hono/zod-validator";
import { respondEnrollmentRequestSchema } from "@zerocancer/shared/schemas/enrollment.schema";
import type { TErrorResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import {
  approveCenterEnrollmentRequest,
  expireStaleEnrollmentRequests,
  formatEnrollmentRequestForApi,
  isEnrollmentRequestExpired,
  markEnrollmentRequestNotificationsRead,
} from "../lib/center-enrollment-utils";
import { getDB } from "../lib/db";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const patientEnrollmentApp = new Hono<THonoApp>();

patientEnrollmentApp.use("*", authMiddleware(["patient"]));

// GET /api/patient/enrollment-requests
patientEnrollmentApp.get("/", async (c) => {
  try {
    const db = getDB(c);
    const patientId = c.get("jwtPayload")?.id as string;
    const status = c.req.query("status") || "PENDING";

    try {
      await expireStaleEnrollmentRequests(c, { patientId });
    } catch (expireError) {
      console.error("Failed to expire stale enrollment requests:", expireError);
    }

    const requests = await db.centerEnrollmentRequest.findMany({
      where: { patientId, status },
      orderBy: { requestedAt: "desc" },
      include: {
        center: {
          select: {
            id: true,
            centerName: true,
            address: true,
            state: true,
            lga: true,
          },
        },
        screeningType: {
          select: { id: true, name: true },
        },
      },
    });

    return c.json({
      ok: true,
      data: {
        requests: requests.map((request) =>
          formatEnrollmentRequestForApi(request)
        ),
      },
    });
  } catch (error) {
    console.error("List enrollment requests error:", error);
    return c.json<TErrorResponse>(
      { ok: false, error: "Failed to load enrollment requests" },
      500
    );
  }
});

// POST /api/patient/enrollment-requests/:id/respond
patientEnrollmentApp.post(
  "/:id/respond",
  zValidator("json", respondEnrollmentRequestSchema),
  async (c) => {
    try {
      const db = getDB(c);
      const patientId = c.get("jwtPayload")?.id as string;
      const requestId = c.req.param("id");
      const { action } = c.req.valid("json");

      await expireStaleEnrollmentRequests(c, { patientId });

      const request = await db.centerEnrollmentRequest.findFirst({
        where: { id: requestId, patientId, status: "PENDING" },
      });

      if (!request) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Enrollment request not found or already handled" },
          404
        );
      }

      if (isEnrollmentRequestExpired(new Date(String(request.requestedAt)))) {
        await db.centerEnrollmentRequest.update({
          where: { id: requestId },
          data: { status: "EXPIRED", respondedAt: new Date() },
        });
        return c.json<TErrorResponse>(
          { ok: false, error: "This enrollment request has expired" },
          410
        );
      }

      if (action === "reject") {
        const updated = await db.centerEnrollmentRequest.update({
          where: { id: requestId, status: "PENDING" },
          data: { status: "REJECTED", respondedAt: new Date() },
        });

        if (!updated) {
          return c.json<TErrorResponse>(
            {
              ok: false,
              error: "Enrollment request not found or already handled",
            },
            404
          );
        }

        try {
          await markEnrollmentRequestNotificationsRead(c, patientId, requestId);
        } catch (error) {
          console.error(
            "Failed to clear enrollment request notifications after reject:",
            error
          );
        }

        return c.json({
          ok: true,
          message: "Enrollment request declined",
          data: { status: "REJECTED" },
        });
      }

      const approval = await approveCenterEnrollmentRequest(
        c,
        requestId,
        patientId
      );

      if ("error" in approval && approval.error) {
        return c.json<TErrorResponse>({ ok: false, error: approval.error }, 400);
      }

      return c.json({
        ok: true,
        message: "Enrollment request approved",
        data: {
          status: "APPROVED",
          waitlist: approval.enrollment?.waitlist,
          waitlistCreated: approval.enrollment?.created ?? false,
        },
      });
    } catch (error) {
      console.error("Respond to enrollment request error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to respond to enrollment request" },
        500
      );
    }
  }
);
