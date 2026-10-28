import { z } from "zod";
import {
  isKitProductId,
  kitProductMinQuantity,
} from "../constants/kit-products";

export const kitSchema = z.object({
  id: z.string().uuid().optional(),
  serialNumber: z.string().min(1, "Serial number is required").max(50),
  batchNumber: z.string().max(50).optional(),
  screeningTypeId: z.string().uuid("Invalid screening type ID"),
  centerId: z.string().uuid("Invalid center ID"),
  status: z.enum(["AVAILABLE", "USED", "DAMAGED"]).default("AVAILABLE"),
  receivedAt: z.string().optional(),
  usedAt: z.string().optional(),
});

export const getKitsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  status: z.enum(["AVAILABLE", "USED", "DAMAGED"]).optional(),
  screeningTypeId: z.string().uuid().optional(),
  centerId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const assignKitSchema = z.object({
  appointmentId: z.string().uuid(),
  kitId: z.string().uuid(),
});

export const addKitsSchema = z.object({
  centerId: z.string().uuid(),
  screeningTypeId: z.string().uuid(),
  serialNumbers: z
    .array(z.string().min(1))
    .min(1, "At least one serial number is required"),
  batchNumber: z.string().optional(),
});

const orderKitLineSchema = z.object({
  kitProduct: z.string().min(1, "Select a device or kit product"),
  quantity: z.coerce.number().int().min(1).max(10000),
});

/**
 * Facility shop checkout — product catalogue only (no screening-type picker).
 * Prices are confirmed later via Expression of Interest.
 */
export const orderKitsSchema = z
  .object({
    /** Optional; server attaches a default cervical type for inventory FK if omitted. */
    screeningTypeId: z.string().uuid().optional(),
    items: z.array(orderKitLineSchema).min(1).max(20).optional(),
    kitProduct: z.string().min(1).optional(),
    quantity: z.coerce.number().int().min(1).max(10000).optional(),
    urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
    notes: z.string().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    const lines =
      value.items?.length
        ? value.items
        : value.quantity != null
          ? [{ kitProduct: value.kitProduct || "", quantity: value.quantity }]
          : [];

    if (!lines.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one device or kit to your order",
        path: ["items"],
      });
      return;
    }

    lines.forEach((line, index) => {
      if (!isKitProductId(line.kitProduct)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Unknown device or kit product",
          path: ["items", index, "kitProduct"],
        });
        return;
      }
      const min = kitProductMinQuantity(line.kitProduct);
      if (line.quantity < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Minimum quantity for this product is ${min}`,
          path: ["items", index, "quantity"],
        });
      }
    });
  });

export const kitOrderStatuses = [
  "PENDING",
  "APPROVED",
  "SHIPPED",
  "DELIVERED",
  "REJECTED",
  "CANCELLED",
] as const;

export const getKitOrdersQuerySchema = z.object({
  status: z.enum(kitOrderStatuses).optional(),
  centerId: z.string().uuid().optional(),
});

/** Platform admin moves a facility kit order through fulfillment. */
export const updateKitOrderSchema = z.object({
  status: z.enum(["APPROVED", "SHIPPED", "DELIVERED", "REJECTED"]),
  reviewNotes: z.string().max(500).optional(),
  trackingNumber: z.string().max(100).optional(),
  batchNumber: z.string().max(50).optional(),
  /** Serials added to the facility's inventory on delivery; generated when omitted. */
  serialNumbers: z.array(z.string().trim().min(1).max(50)).max(500).optional(),
});
