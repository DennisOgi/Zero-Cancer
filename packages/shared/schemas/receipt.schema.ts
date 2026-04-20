import { z } from "zod";

// Base receipt data structure
export const ReceiptDataSchema = z.object({
  receiptNumber: z.string(),
  transactionId: z.string(),
  type: z.enum(["DONATION", "APPOINTMENT", "PAYOUT", "REFUND"]),
  amount: z.number(),
  date: z.string().datetime(),

  // Transaction details
  paymentReference: z.string().optional(),
  paymentChannel: z.string().optional(),

  // Recipient information
  recipientName: z.string(),
  recipientEmail: z.string().email(),
  recipientPhone: z.string().optional(),

  // For donations
  campaignName: z.string().optional(),
  campaignDescription: z.string().optional(),
  taxDeductible: z.boolean().default(true),

  // For appointments
  centerName: z.string().optional(),
  centerAddress: z.string().optional(),
  appointmentDateTime: z.string().datetime().optional(), // Combined date and time
  serviceType: z.string().optional(),

  // Organization details
  organizationName: z.string().default("Zero Cancer Initiative"),
  organizationAddress: z
    .string()
    .default("123 Health Street, Medical City, State 12345"),
  organizationTaxId: z.string().default("TAX-123456789"),
  organizationEmail: z.string().email().default("contact@zerocancer.org"),
  organizationPhone: z.string().default("+1 (555) 123-4567"),
});

export const ReceiptSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  receiptNumber: z.string(),
  receiptData: ReceiptDataSchema,
  pdfPath: z.string().optional(),
  emailSentAt: z.string().datetime().optional(),
  emailRecipient: z.string().email().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateReceiptRequestSchema = z.object({
  transactionId: z.string(),
  emailRecipient: z.string().email().optional(),
  forceRegenerate: z.boolean().optional().default(false),
});

export const ResendReceiptRequestSchema = z.object({
  emailRecipient: z.string().email(),
});

export const ReceiptListQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default("1"),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .default("20"),
  type: z.enum(["DONATION", "APPOINTMENT", "PAYOUT", "REFUND"]).optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ReceiptData = z.infer<typeof ReceiptDataSchema>;
export type Receipt = z.infer<typeof ReceiptSchema>;
export type CreateReceiptRequest = z.infer<typeof CreateReceiptRequestSchema>;
export type ResendReceiptRequest = z.infer<typeof ResendReceiptRequestSchema>;
export type ReceiptListQuery = z.infer<typeof ReceiptListQuerySchema>;
