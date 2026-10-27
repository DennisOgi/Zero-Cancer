import { z } from "zod";

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
  quantity: z.coerce.number().int().min(1).max(500),
});

/** Facility request to purchase / restock devices & kits (multi-item checkout). */
export const orderKitsSchema = z
  .object({
    screeningTypeId: z.string().uuid("Select a screening type"),
    /** Preferred: one or more products in a single checkout. */
    items: z.array(orderKitLineSchema).min(1).max(10).optional(),
    /** Legacy single-line fields (still accepted). */
    kitProduct: z.string().min(1).optional(),
    quantity: z.coerce.number().int().min(1).max(500).optional(),
    urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
    notes: z.string().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.items?.length) return;
    if (value.quantity == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one device or kit to your order",
        path: ["items"],
      });
    }
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
