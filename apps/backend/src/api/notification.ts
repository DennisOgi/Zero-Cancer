import { zValidator } from "@hono/zod-validator";
import {
  // notificationRecipientResponseSchema,
  // notificationResponseSchema,
  notificationSchema,
} from "@zerocancer/shared";
import type {
  TCreateNotificationResponse,
  TErrorResponse,
  TGetNotificationsResponse,
  TMarkNotificationReadResponse,
} from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "../lib/db";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const notificationApp = new Hono<THonoApp>();

notificationApp.use(authMiddleware());

// GET /api/notifications - get notifications for current user
notificationApp.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  if (!payload)
    return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
  const userId = payload.id!;
  const db = getDB(c);
  const notifications = await db.notificationRecipient.findMany({
    where: { userId },
    include: { notification: true },
    orderBy: { notification: { createdAt: "desc" } },
    take: 50,
  });
  // Strictly shape each notification recipient and nested notification
  const safeNotifications = notifications.map((n) => {
    // Ensure data is an object or null
    let safeData: Record<string, any> | null = null;
    if (
      n.notification.data &&
      typeof n.notification.data === "object" &&
      !Array.isArray(n.notification.data)
    ) {
      safeData = n.notification.data;
    }
    return {
      id: n.id,
      userId: n.userId,
      notificationId: n.notificationId,
      read: n.read,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      notification: {
        id: n.notification.id,
        type: n.notification.type,
        title: n.notification.title,
        message: n.notification.message,
        data: safeData,
        createdAt: n.notification.createdAt.toISOString(),
        updatedAt: n.notification.createdAt.toISOString(), // fallback if updatedAt not present
      },
    };
  });
  return c.json<TGetNotificationsResponse>({
    ok: true,
    data: safeNotifications,
  });
});

// POST /api/notifications/:id/read - mark notification as read
notificationApp.post("/:id/read", async (c) => {
  const payload = c.get("jwtPayload");
  if (!payload)
    return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
  const userId = payload.id!;
  const id = c.req.param("id");
  const db = getDB(c);
  await db.notificationRecipient.updateMany({
    where: { id, userId },
    data: { read: true, readAt: new Date() },
  });
  return c.json<TMarkNotificationReadResponse>({
    ok: true,
    data: { id, read: true, readAt: new Date().toISOString() },
  });
});

// POST /api/notifications - create notification (admin or system use)
notificationApp.post(
  "/",
  zValidator("json", notificationSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    // TODO: Add admin check if needed
    const db = getDB(c);
    const { type, title, message, data, userIds } = c.req.valid("json");
    // Create notification
    const notification = await db.notification.create({
      data: {
        type: type!,
        title: title!,
        message: message!,
        data: data!,
        recipients: {
          create: userIds!.map((userId: string) => ({ userId: userId! })),
        },
      },
    });
    // Strictly shape the notification object
    let safeData: Record<string, any> | null = null;
    if (
      notification.data &&
      typeof notification.data === "object" &&
      !Array.isArray(notification.data)
    ) {
      safeData = notification.data;
    }
    const safeNotification = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: safeData,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.createdAt.toISOString(), // fallback if updatedAt not present
    };
    return c.json<TCreateNotificationResponse>({
      ok: true,
      data: safeNotification,
    });
  }
);
