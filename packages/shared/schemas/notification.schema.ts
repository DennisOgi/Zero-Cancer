import { z } from "zod";

export const notificationSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.any()).optional(),
  userIds: z.array(z.string().min(1)),
});

export const notificationReadSchema = z.object({
  id: z.string().min(1),
});

export const notificationResponseSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const notificationRecipientResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  notificationId: z.string(),
  read: z.boolean(),
  readAt: z.string().nullable(),
  notification: notificationResponseSchema,
});
