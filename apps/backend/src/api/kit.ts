import { zValidator } from "@hono/zod-validator";
import { addKitsSchema, getKitsQuerySchema } from "@zerocancer/shared";
import { Hono } from "hono";
import { getDB } from "../lib/db";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const kitApp = new Hono<THonoApp>();

// GET /api/v1/kit - List kits (paginated, filtered)
kitApp.get(
  "/",
  authMiddleware(["center", "center_staff", "admin"]),
  zValidator("query", getKitsQuerySchema),
  async (c) => {
    const db = getDB(c);
    const { page = 1, pageSize = 20, status, screeningTypeId, centerId: queryCenterId, search } = c.req.valid("query");
    
    const payload = c.get("jwtPayload");
    const userRole = payload?.profile;
    const jwtCenterId = payload?.id;

    // Enforcement: centers can only see their own kits
    let targetCenterId = queryCenterId;
    if (userRole === "CENTER" || userRole === "CENTER_STAFF") {
      targetCenterId = jwtCenterId;
    }

    const where: any = {
      ...(status && { status }),
      ...(screeningTypeId && { screeningTypeId }),
      ...(targetCenterId && { centerId: targetCenterId }),
      ...(search && { serialNumber: { contains: search } }),
    };

    const [kits, total] = await Promise.all([
      db.kit.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { receivedAt: "desc" },
        include: {
          screeningType: { select: { name: true } },
          center: { select: { centerName: true } },
          appointment: { select: { id: true, status: true } },
        },
      }),
      db.kit.count({ where }),
    ]);

    return c.json({
      ok: true,
      data: {
        kits,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
);

// POST /api/v1/kit/add - Add kits to inventory (Center Admin only)
kitApp.post(
  "/add",
  authMiddleware(["center", "admin"]),
  zValidator("json", addKitsSchema),
  async (c) => {
    const db = getDB(c);
    const { centerId, screeningTypeId, serialNumbers, batchNumber } = c.req.valid("json");
    
    const payload = c.get("jwtPayload");
    if (payload?.profile === "CENTER" && payload.id !== centerId) {
      return c.json({ ok: false, error: "Unauthorized: Cannot add kits to another center" }, 403);
    }

    try {
      const kitsData = serialNumbers.map((sn) => ({
        serialNumber: sn,
        batchNumber,
        centerId,
        screeningTypeId,
        status: "AVAILABLE",
      }));

      const created = await db.kit.createMany({
        data: kitsData,
        skipDuplicates: true, // Don't crash if a serial number already exists
      });

      return c.json({
        ok: true,
        data: {
          count: created.count,
          message: `Successfully added ${created.count} kits to inventory.`,
        },
      });
    } catch (error) {
      console.error("Add kits error:", error);
      return c.json({ ok: false, error: "Failed to add kits" }, 500);
    }
  }
);

// GET /api/v1/kit/stats - Inventory stats
kitApp.get(
  "/stats",
  authMiddleware(["center", "center_staff", "admin"]),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    const centerId = payload?.profile?.startsWith("CENTER") ? payload.id : undefined;

    const stats = await db.kit.groupBy({
      by: ["status"],
      where: {
        ...(centerId && { centerId }),
      },
      _count: {
        id: true,
      },
    });

    const formattedStats = {
      AVAILABLE: 0,
      USED: 0,
      DAMAGED: 0,
      TOTAL: 0,
    };

    stats.forEach((s) => {
      // @ts-ignore
      formattedStats[s.status] = s._count.id;
      formattedStats.TOTAL += s._count.id;
    });

    return c.json({ ok: true, data: formattedStats });
  }
);

export default kitApp;
