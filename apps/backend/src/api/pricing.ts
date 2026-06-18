import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";
import { getDB } from "../lib/db";
import { THonoApp } from "../lib/types";
import { createNotificationForUsers } from "../lib/utils";

const pricingApp = new Hono<THonoApp>();

// ========================================
// VALIDATION SCHEMAS
// ========================================

const updateBasePriceSchema = z.object({
  agreedPrice: z.number().min(0, "Base price must be non-negative"),
  reason: z.string().optional(),
});

const updateRetailPriceSchema = z.object({
  amount: z.number().min(0, "Retail price must be non-negative"),
  reason: z.string().optional(),
});

const getPriceHistorySchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  screeningTypeId: z.string().uuid().optional(),
  centerId: z.string().uuid().optional(),
  priceType: z.enum(["BASE_PRICE", "RETAIL_PRICE"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ========================================
// ADMIN ENDPOINTS - Base Price Management
// ========================================

// GET /api/v1/pricing/screening-types - List all screening types with base prices
pricingApp.get(
  "/screening-types",
  authMiddleware(["admin"]),
  async (c) => {
    const db = getDB(c);

    try {
      const screeningTypes = await db.screeningType.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          description: true,
          agreedPrice: true,
          screeningTypeCategoryId: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return c.json({
        ok: true,
        data: screeningTypes,
      });
    } catch (error) {
      console.error("Get screening types with prices error:", error);
      return c.json(
        { ok: false, error: "Failed to fetch screening types" },
        500
      );
    }
  }
);

// PATCH /api/v1/pricing/screening-types/:id - Update base price
pricingApp.patch(
  "/screening-types/:id",
  authMiddleware(["admin"]),
  zValidator("json", updateBasePriceSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const screeningTypeId = c.req.param("id");
    const { agreedPrice, reason } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const adminId = payload?.userId;

    try {
      // Get current screening type
      const screeningType = await db.screeningType.findUnique({
        where: { id: screeningTypeId },
        select: {
          id: true,
          name: true,
          agreedPrice: true,
          serviceCenters: {
            select: {
              centerId: true,
              amount: true,
            },
          },
        },
      });

      if (!screeningType) {
        return c.json({ ok: false, error: "Screening type not found" }, 404);
      }

      const oldPrice = screeningType.agreedPrice;

      // Check if any centers have retail prices below the new base price
      const centersWithLowPrices = screeningType.serviceCenters.filter(
        (sc) => sc.amount < agreedPrice
      );

      if (centersWithLowPrices.length > 0) {
        return c.json(
          {
            ok: false,
            error: `Cannot update base price. ${centersWithLowPrices.length} center(s) have retail prices below ₦${agreedPrice}. Please notify centers to update their retail prices first.`,
            centersAffected: centersWithLowPrices.length,
          },
          400
        );
      }

      // Update base price
      const updatedScreeningType = await db.screeningType.update({
        where: { id: screeningTypeId },
        data: { agreedPrice },
      });

      // Record price history
      await db.priceHistory.create({
        data: {
          screeningTypeId,
          priceType: "BASE_PRICE",
          oldPrice,
          newPrice: agreedPrice,
          changedBy: adminId || "admin",
          reason: reason || `Base price updated from ₦${oldPrice} to ₦${agreedPrice}`,
        },
      });

      // Notify all centers offering this screening type
      const centerIds = screeningType.serviceCenters.map((sc) => sc.centerId);
      
      if (centerIds.length > 0) {
        // Get center user IDs (we need to get ServiceCenter records to get their IDs)
        const centers = await db.serviceCenter.findMany({
          where: { id: { in: centerIds } },
          select: { id: true },
        });

        try {
          await createNotificationForUsers(c, {
            type: "PRICE_UPDATE",
            title: "Base Price Updated",
            message: `The base price for ${screeningType.name} has been updated from ₦${oldPrice} to ₦${agreedPrice}. Please review your retail pricing.`,
            userIds: centers.map((center) => center.id),
            data: {
              screeningTypeId,
              screeningTypeName: screeningType.name,
              oldPrice,
              newPrice: agreedPrice,
              priceType: "BASE_PRICE",
            },
          });
        } catch (notificationError) {
          console.error("Failed to send price update notifications:", notificationError);
          // Don't fail the request if notifications fail
        }
      }

      return c.json({
        ok: true,
        data: {
          screeningType: updatedScreeningType,
          oldPrice,
          newPrice: agreedPrice,
          centersNotified: centerIds.length,
        },
      });
    } catch (error) {
      console.error("Update base price error:", error);
      return c.json({ ok: false, error: "Failed to update base price" }, 500);
    }
  }
);

// GET /api/v1/pricing/history - Get price history with filters
pricingApp.get(
  "/history",
  authMiddleware(["admin"]),
  zValidator("query", getPriceHistorySchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const {
      page = 1,
      pageSize = 20,
      screeningTypeId,
      centerId,
      priceType,
      dateFrom,
      dateTo,
    } = c.req.valid("query");

    try {
      const where: any = {};
      if (screeningTypeId) where.screeningTypeId = screeningTypeId;
      if (centerId) where.centerId = centerId;
      if (priceType) where.priceType = priceType;

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [history, total] = await Promise.all([
        db.priceHistory.findMany({
          where,
          include: {
            screeningType: {
              select: {
                id: true,
                name: true,
              },
            },
            center: {
              select: {
                id: true,
                centerName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.priceHistory.count({ where }),
      ]);

      return c.json({
        ok: true,
        data: {
          history,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Get price history error:", error);
      return c.json({ ok: false, error: "Failed to fetch price history" }, 500);
    }
  }
);

// ========================================
// CENTER ENDPOINTS - Retail Price Management
// ========================================

// GET /api/v1/pricing/center/services - Get center's retail prices
pricingApp.get(
  "/center/services",
  authMiddleware(["center", "center_staff"]),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    const centerId = payload?.centerId;

    if (!centerId) {
      return c.json({ ok: false, error: "Center ID not found" }, 400);
    }

    try {
      const services = await db.serviceCenterScreeningType.findMany({
        where: { centerId },
        include: {
          screeningType: {
            select: {
              id: true,
              name: true,
              description: true,
              agreedPrice: true,
            },
          },
        },
        orderBy: {
          screeningType: {
            name: "asc",
          },
        },
      });

      // Calculate markup for each service
      const servicesWithMarkup = services.map((service) => ({
        ...service,
        markup: service.amount - service.screeningType.agreedPrice,
        markupPercentage:
          ((service.amount - service.screeningType.agreedPrice) /
            service.screeningType.agreedPrice) *
          100,
      }));

      return c.json({
        ok: true,
        data: servicesWithMarkup,
      });
    } catch (error) {
      console.error("Get center services error:", error);
      return c.json({ ok: false, error: "Failed to fetch services" }, 500);
    }
  }
);

// PATCH /api/v1/pricing/center/services/:id - Update retail price
pricingApp.patch(
  "/center/services/:id",
  authMiddleware(["center", "center_staff"]),
  zValidator("json", updateRetailPriceSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const serviceId = c.req.param("id");
    const { amount, reason } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const centerId = payload?.centerId;
    const userId = payload?.userId;

    if (!centerId) {
      return c.json({ ok: false, error: "Center ID not found" }, 400);
    }

    try {
      // Get current service
      const service = await db.serviceCenterScreeningType.findUnique({
        where: { id: serviceId },
        include: {
          screeningType: {
            select: {
              id: true,
              name: true,
              agreedPrice: true,
            },
          },
        },
      });

      if (!service) {
        return c.json({ ok: false, error: "Service not found" }, 404);
      }

      // Verify this service belongs to the center
      if (service.centerId !== centerId) {
        return c.json({ ok: false, error: "Unauthorized" }, 403);
      }

      // Validate retail price >= base price
      if (amount < service.screeningType.agreedPrice) {
        return c.json(
          {
            ok: false,
            error: `Retail price (₦${amount}) cannot be less than base price (₦${service.screeningType.agreedPrice})`,
            basePrice: service.screeningType.agreedPrice,
          },
          400
        );
      }

      const oldPrice = service.amount;

      // Update retail price
      const updatedService = await db.serviceCenterScreeningType.update({
        where: { id: serviceId },
        data: { amount },
      });

      // Record price history
      await db.priceHistory.create({
        data: {
          screeningTypeId: service.screeningTypeId,
          centerId,
          priceType: "RETAIL_PRICE",
          oldPrice,
          newPrice: amount,
          changedBy: userId || centerId,
          reason:
            reason ||
            `Retail price updated from ₦${oldPrice} to ₦${amount}`,
        },
      });

      return c.json({
        ok: true,
        data: {
          service: updatedService,
          oldPrice,
          newPrice: amount,
          markup: amount - service.screeningType.agreedPrice,
          markupPercentage:
            ((amount - service.screeningType.agreedPrice) /
              service.screeningType.agreedPrice) *
            100,
        },
      });
    } catch (error) {
      console.error("Update retail price error:", error);
      return c.json({ ok: false, error: "Failed to update retail price" }, 500);
    }
  }
);

// GET /api/v1/pricing/center/history - Get center's price history
pricingApp.get(
  "/center/history",
  authMiddleware(["center", "center_staff"]),
  zValidator("query", getPriceHistorySchema.partial(), (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    const centerId = payload?.centerId;
    const {
      page = 1,
      pageSize = 20,
      screeningTypeId,
      dateFrom,
      dateTo,
    } = c.req.valid("query");

    if (!centerId) {
      return c.json({ ok: false, error: "Center ID not found" }, 400);
    }

    try {
      const where: any = { centerId };
      if (screeningTypeId) where.screeningTypeId = screeningTypeId;

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo);
      }

      const [history, total] = await Promise.all([
        db.priceHistory.findMany({
          where,
          include: {
            screeningType: {
              select: {
                id: true,
                name: true,
                agreedPrice: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.priceHistory.count({ where }),
      ]);

      return c.json({
        ok: true,
        data: {
          history,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Get center price history error:", error);
      return c.json(
        { ok: false, error: "Failed to fetch price history" },
        500
      );
    }
  }
);

export default pricingApp;
