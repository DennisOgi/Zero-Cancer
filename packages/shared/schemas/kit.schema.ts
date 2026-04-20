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
  serialNumbers: z.array(z.string().min(1)).min(1, "At least one serial number is required"),
  batchNumber: z.string().optional(),
});
