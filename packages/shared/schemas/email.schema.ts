import { z } from "zod";

export const sendNotificationEmailSchema = z.object({
  to: z.string().or(z.array(z.string())),
  title: z.string(),
  type: z.string(),
  message: z.string(),
  data: z.string().optional(),
});

export const sendPlainEmailSchema = z.object({
  to: z.string().or(z.array(z.string())),
  subject: z.string(),
  html: z.string().optional(),
  text: z.string().optional(),
  data: z.string().optional(),
});
