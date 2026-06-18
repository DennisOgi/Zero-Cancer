import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";
import { getDB } from "../lib/db";
import { THonoApp } from "../lib/types";
import { createNotificationForUsers } from "../lib/utils";

const performanceApp = new Hono<THonoApp>();

// ========================================
// VALIDATION SCHEMAS
// ========================================

const setTargetSchema = z.object({
  centerId: z.string().uuid(),
  screeningTypeId: z.string().uuid().optional(),
  dailyTarget: z.number().int().min(0).optional(),
  weeklyTarget: z.number().int().min(0).optional(),
  monthlyTarget: z.number().int().min(0).optional(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
});

const updateTargetSchema = z.object({
  dailyTarget: z.number().int().min(0).optional(),
  weeklyTarget: z.number().int().min(0).optional(),
  monthlyTarget: z.number().int().min(0).optional(),
  effectiveTo: z.string().optional(),
});

const getCentersMetricsSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
  category: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR"]).optional(),
  state: z.string().optional(),
  search: z.string().optional(),
});

const getTrendsSchema = z.object({
  centerId: z.string().uuid(),
  days: z.coerce.number().min(7).max(90).default(30).optional(),
});

const createSnapshotSchema = z.object({
  centerId: z.string().uuid(),
  snapshotDate: z.string(),
  dailyTests: z.number().int().min(0).default(0),
  weeklyTests: z.number().int().min(0).default(0),
  monthlyTests: z.number().int().min(0).default(0),
});

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Calculate performance category based on target achievement
 * EXCELLENT: >= 120% of target
 * GOOD: >= 80% of target
 * FAIR: >= 50% of target
 * POOR: < 50% of target
 */
function calculatePerformanceCategory(
  actual: number,
  target: number | null | undefined
): string | null {
  if (!target || target === 0) return null;

  const percentage = (actual / target) * 100;

  if (percentage >= 120) return "EXCELLENT";
  if (percentage >= 80) return "GOOD";
  if (percentage >= 50) return "FAIR";
  return "POOR";
}

/**
 * Get current active target for a center
 */
async function getActiveTarget(
  db: any,
  centerId: string,
  screeningTypeId?: string
) {
  const now = new Date();

  return await db.centerTarget.findFirst({
    where: {
      centerId,
      screeningTypeId: screeningTypeId || null,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
}

/**
 * Calculate test counts for a center
 */
async function calculateTestCounts(
  db: any,
  centerId: string,
  date: Date = new Date()
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);

  const [dailyTests, weeklyTests, monthlyTests] = await Promise.all([
    db.appointment.count({
      where: {
        centerId,
        status: "COMPLETED",
        appointmentDateTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    }),
    db.appointment.count({
      where: {
        centerId,
        status: "COMPLETED",
        appointmentDateTime: {
          gte: startOfWeek,
          lte: endOfDay,
        },
      },
    }),
    db.appointment.count({
      where: {
        centerId,
        status: "COMPLETED",
        appointmentDateTime: {
          gte: startOfMonth,
          lte: endOfDay,
        },
      },
    }),
  ]);

  return { dailyTests, weeklyTests, monthlyTests };
}

// ========================================
// ADMIN ENDPOINTS
// ========================================

// GET /api/v1/performance/centers - Get all centers with performance metrics
performanceApp.get(
  "/centers",
  authMiddleware(["admin"]),
  zValidator("query", getCentersMetricsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const { page = 1, pageSize = 20, category, state, search } = c.req.valid("query");

    try {
      const where: any = {};
      if (state) where.state = state;
      if (search) {
        where.OR = [
          { centerName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      // Get centers
      const [centers, total] = await Promise.all([
        db.serviceCenter.findMany({
          where,
          select: {
            id: true,
            centerName: true,
            email: true,
            state: true,
            lga: true,
            status: true,
          },
          orderBy: { centerName: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.serviceCenter.count({ where }),
      ]);

      // Get latest snapshot for each center
      const centersWithMetrics = await Promise.all(
        centers.map(async (center) => {
          const latestSnapshot = await db.centerPerformanceSnapshot.findFirst({
            where: { centerId: center.id },
            orderBy: { snapshotDate: "desc" },
          });

          const activeTarget = await getActiveTarget(db, center.id);

          return {
            ...center,
            metrics: latestSnapshot
              ? {
                  dailyTests: latestSnapshot.dailyTests,
                  weeklyTests: latestSnapshot.weeklyTests,
                  monthlyTests: latestSnapshot.monthlyTests,
                  dailyTarget: latestSnapshot.dailyTarget,
                  weeklyTarget: latestSnapshot.weeklyTarget,
                  monthlyTarget: latestSnapshot.monthlyTarget,
                  category: latestSnapshot.category,
                  snapshotDate: latestSnapshot.snapshotDate,
                }
              : null,
            hasActiveTarget: !!activeTarget,
          };
        })
      );

      // Filter by category if specified
      let filteredCenters = centersWithMetrics;
      if (category) {
        filteredCenters = centersWithMetrics.filter(
          (c) => c.metrics?.category === category
        );
      }

      return c.json({
        ok: true,
        data: {
          centers: filteredCenters,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error("Get centers metrics error:", error);
      return c.json(
        { ok: false, error: "Failed to fetch centers metrics" },
        500
      );
    }
  }
);

// GET /api/v1/performance/centers/:id - Get single center performance details
performanceApp.get(
  "/centers/:id",
  authMiddleware(["admin"]),
  async (c) => {
    const db = getDB(c);
    const centerId = c.req.param("id");

    try {
      const center = await db.serviceCenter.findUnique({
        where: { id: centerId },
        select: {
          id: true,
          centerName: true,
          email: true,
          phone: true,
          state: true,
          lga: true,
          address: true,
          status: true,
        },
      });

      if (!center) {
        return c.json({ ok: false, error: "Center not found" }, 404);
      }

      // Get current test counts
      const testCounts = await calculateTestCounts(db, centerId);

      // Get active target
      const activeTarget = await getActiveTarget(db, centerId);

      // Calculate categories
      const dailyCategory = calculatePerformanceCategory(
        testCounts.dailyTests,
        activeTarget?.dailyTarget
      );
      const weeklyCategory = calculatePerformanceCategory(
        testCounts.weeklyTests,
        activeTarget?.weeklyTarget
      );
      const monthlyCategory = calculatePerformanceCategory(
        testCounts.monthlyTests,
        activeTarget?.monthlyTarget
      );

      // Get latest snapshot
      const latestSnapshot = await db.centerPerformanceSnapshot.findFirst({
        where: { centerId },
        orderBy: { snapshotDate: "desc" },
      });

      return c.json({
        ok: true,
        data: {
          center,
          currentMetrics: {
            dailyTests: testCounts.dailyTests,
            weeklyTests: testCounts.weeklyTests,
            monthlyTests: testCounts.monthlyTests,
            dailyTarget: activeTarget?.dailyTarget,
            weeklyTarget: activeTarget?.weeklyTarget,
            monthlyTarget: activeTarget?.monthlyTarget,
            dailyCategory,
            weeklyCategory,
            monthlyCategory,
          },
          activeTarget,
          latestSnapshot,
        },
      });
    } catch (error) {
      console.error("Get center performance error:", error);
      return c.json(
        { ok: false, error: "Failed to fetch center performance" },
        500
      );
    }
  }
);

// POST /api/v1/performance/targets - Set performance target
performanceApp.post(
  "/targets",
  authMiddleware(["admin"]),
  zValidator("json", setTargetSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const data = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const adminId = payload?.userId;

    try {
      // Validate at least one target is set
      if (!data.dailyTarget && !data.weeklyTarget && !data.monthlyTarget) {
        return c.json(
          { ok: false, error: "At least one target must be set" },
          400
        );
      }

      // Verify center exists
      const center = await db.serviceCenter.findUnique({
        where: { id: data.centerId },
        select: { id: true, centerName: true },
      });

      if (!center) {
        return c.json({ ok: false, error: "Center not found" }, 404);
      }

      // If screening type specified, verify it exists
      if (data.screeningTypeId) {
        const screeningType = await db.screeningType.findUnique({
          where: { id: data.screeningTypeId },
        });

        if (!screeningType) {
          return c.json({ ok: false, error: "Screening type not found" }, 404);
        }
      }

      // Create target
      const target = await db.centerTarget.create({
        data: {
          centerId: data.centerId,
          screeningTypeId: data.screeningTypeId,
          dailyTarget: data.dailyTarget,
          weeklyTarget: data.weeklyTarget,
          monthlyTarget: data.monthlyTarget,
          effectiveFrom: new Date(data.effectiveFrom),
          effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
          createdBy: adminId || "admin",
        },
      });

      // Notify center
      try {
        await createNotificationForUsers(c, {
          type: "TARGET_SET",
          title: "Performance Target Set",
          message: `New performance targets have been set for your center. Daily: ${data.dailyTarget || "N/A"}, Weekly: ${data.weeklyTarget || "N/A"}, Monthly: ${data.monthlyTarget || "N/A"}`,
          userIds: [data.centerId],
          data: {
            targetId: target.id,
            dailyTarget: data.dailyTarget,
            weeklyTarget: data.weeklyTarget,
            monthlyTarget: data.monthlyTarget,
          },
        });
      } catch (notificationError) {
        console.error("Failed to send target notification:", notificationError);
      }

      return c.json({
        ok: true,
        data: target,
      });
    } catch (error) {
      console.error("Set target error:", error);
      return c.json({ ok: false, error: "Failed to set target" }, 500);
    }
  }
);

// PATCH /api/v1/performance/targets/:id - Update performance target
performanceApp.patch(
  "/targets/:id",
  authMiddleware(["admin"]),
  zValidator("json", updateTargetSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const targetId = c.req.param("id");
    const data = c.req.valid("json");

    try {
      const target = await db.centerTarget.findUnique({
        where: { id: targetId },
        include: {
          center: {
            select: { id: true, centerName: true },
          },
        },
      });

      if (!target) {
        return c.json({ ok: false, error: "Target not found" }, 404);
      }

      const updatedTarget = await db.centerTarget.update({
        where: { id: targetId },
        data: {
          dailyTarget: data.dailyTarget ?? target.dailyTarget,
          weeklyTarget: data.weeklyTarget ?? target.weeklyTarget,
          monthlyTarget: data.monthlyTarget ?? target.monthlyTarget,
          effectiveTo: data.effectiveTo
            ? new Date(data.effectiveTo)
            : target.effectiveTo,
        },
      });

      // Notify center
      try {
        await createNotificationForUsers(c, {
          type: "TARGET_UPDATED",
          title: "Performance Target Updated",
          message: `Your performance targets have been updated.`,
          userIds: [target.centerId],
          data: {
            targetId: updatedTarget.id,
            dailyTarget: updatedTarget.dailyTarget,
            weeklyTarget: updatedTarget.weeklyTarget,
            monthlyTarget: updatedTarget.monthlyTarget,
          },
        });
      } catch (notificationError) {
        console.error("Failed to send target update notification:", notificationError);
      }

      return c.json({
        ok: true,
        data: updatedTarget,
      });
    } catch (error) {
      console.error("Update target error:", error);
      return c.json({ ok: false, error: "Failed to update target" }, 500);
    }
  }
);

// GET /api/v1/performance/categories - Get centers grouped by performance category
performanceApp.get(
  "/categories",
  authMiddleware(["admin"]),
  async (c) => {
    const db = getDB(c);

    try {
      // Get latest snapshots for all centers
      const snapshots = await db.centerPerformanceSnapshot.findMany({
        distinct: ["centerId"],
        orderBy: [{ centerId: "asc" }, { snapshotDate: "desc" }],
        include: {
          center: {
            select: {
              id: true,
              centerName: true,
              state: true,
              status: true,
            },
          },
        },
      });

      // Group by category
      const grouped = {
        EXCELLENT: [] as any[],
        GOOD: [] as any[],
        FAIR: [] as any[],
        POOR: [] as any[],
        NO_TARGET: [] as any[],
      };

      snapshots.forEach((snapshot) => {
        if (!snapshot.category) {
          grouped.NO_TARGET.push({
            center: snapshot.center,
            metrics: {
              dailyTests: snapshot.dailyTests,
              weeklyTests: snapshot.weeklyTests,
              monthlyTests: snapshot.monthlyTests,
            },
          });
        } else {
          grouped[snapshot.category as keyof typeof grouped].push({
            center: snapshot.center,
            metrics: {
              dailyTests: snapshot.dailyTests,
              weeklyTests: snapshot.weeklyTests,
              monthlyTests: snapshot.monthlyTests,
              dailyTarget: snapshot.dailyTarget,
              weeklyTarget: snapshot.weeklyTarget,
              monthlyTarget: snapshot.monthlyTarget,
            },
          });
        }
      });

      return c.json({
        ok: true,
        data: {
          categories: grouped,
          summary: {
            excellent: grouped.EXCELLENT.length,
            good: grouped.GOOD.length,
            fair: grouped.FAIR.length,
            poor: grouped.POOR.length,
            noTarget: grouped.NO_TARGET.length,
            total: snapshots.length,
          },
        },
      });
    } catch (error) {
      console.error("Get categories error:", error);
      return c.json({ ok: false, error: "Failed to fetch categories" }, 500);
    }
  }
);

// GET /api/v1/performance/underperforming - Get underperforming centers
performanceApp.get(
  "/underperforming",
  authMiddleware(["admin"]),
  async (c) => {
    const db = getDB(c);

    try {
      // Get latest snapshots for centers with POOR or FAIR performance
      const snapshots = await db.centerPerformanceSnapshot.findMany({
        where: {
          category: { in: ["POOR", "FAIR"] },
        },
        distinct: ["centerId"],
        orderBy: [{ centerId: "asc" }, { snapshotDate: "desc" }],
        include: {
          center: {
            select: {
              id: true,
              centerName: true,
              email: true,
              phone: true,
              state: true,
              lga: true,
              status: true,
            },
          },
        },
      });

      const underperforming = snapshots.map((snapshot) => ({
        center: snapshot.center,
        metrics: {
          dailyTests: snapshot.dailyTests,
          weeklyTests: snapshot.weeklyTests,
          monthlyTests: snapshot.monthlyTests,
          dailyTarget: snapshot.dailyTarget,
          weeklyTarget: snapshot.weeklyTarget,
          monthlyTarget: snapshot.monthlyTarget,
          category: snapshot.category,
        },
        snapshotDate: snapshot.snapshotDate,
      }));

      return c.json({
        ok: true,
        data: {
          centers: underperforming,
          total: underperforming.length,
        },
      });
    } catch (error) {
      console.error("Get underperforming centers error:", error);
      return c.json(
        { ok: false, error: "Failed to fetch underperforming centers" },
        500
      );
    }
  }
);

// GET /api/v1/performance/trends - Get performance trends for a center
performanceApp.get(
  "/trends",
  authMiddleware(["admin"]),
  zValidator("query", getTrendsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const { centerId, days = 30 } = c.req.valid("query");

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshots = await db.centerPerformanceSnapshot.findMany({
        where: {
          centerId,
          snapshotDate: { gte: startDate },
        },
        orderBy: { snapshotDate: "asc" },
      });

      return c.json({
        ok: true,
        data: {
          trends: snapshots,
          period: {
            from: startDate,
            to: new Date(),
            days,
          },
        },
      });
    } catch (error) {
      console.error("Get trends error:", error);
      return c.json({ ok: false, error: "Failed to fetch trends" }, 500);
    }
  }
);

// POST /api/v1/performance/snapshots - Create performance snapshot (for automated jobs)
performanceApp.post(
  "/snapshots",
  authMiddleware(["admin"]),
  zValidator("json", createSnapshotSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const data = c.req.valid("json");

    try {
      // Get active target
      const activeTarget = await getActiveTarget(db, data.centerId);

      // Calculate categories
      const dailyCategory = calculatePerformanceCategory(
        data.dailyTests,
        activeTarget?.dailyTarget
      );
      const weeklyCategory = calculatePerformanceCategory(
        data.weeklyTests,
        activeTarget?.weeklyTarget
      );
      const monthlyCategory = calculatePerformanceCategory(
        data.monthlyTests,
        activeTarget?.monthlyTarget
      );

      // Use the worst category as overall category
      const categories = [dailyCategory, weeklyCategory, monthlyCategory].filter(
        Boolean
      );
      const categoryPriority = { POOR: 0, FAIR: 1, GOOD: 2, EXCELLENT: 3 };
      const overallCategory = categories.length
        ? categories.reduce((worst, current) =>
            categoryPriority[worst as keyof typeof categoryPriority] <
            categoryPriority[current as keyof typeof categoryPriority]
              ? worst
              : current
          )
        : null;

      // Create or update snapshot
      const snapshot = await db.centerPerformanceSnapshot.upsert({
        where: {
          centerId_snapshotDate: {
            centerId: data.centerId,
            snapshotDate: new Date(data.snapshotDate),
          },
        },
        create: {
          centerId: data.centerId,
          snapshotDate: new Date(data.snapshotDate),
          dailyTests: data.dailyTests,
          weeklyTests: data.weeklyTests,
          monthlyTests: data.monthlyTests,
          dailyTarget: activeTarget?.dailyTarget,
          weeklyTarget: activeTarget?.weeklyTarget,
          monthlyTarget: activeTarget?.monthlyTarget,
          category: overallCategory,
        },
        update: {
          dailyTests: data.dailyTests,
          weeklyTests: data.weeklyTests,
          monthlyTests: data.monthlyTests,
          dailyTarget: activeTarget?.dailyTarget,
          weeklyTarget: activeTarget?.weeklyTarget,
          monthlyTarget: activeTarget?.monthlyTarget,
          category: overallCategory,
        },
      });

      return c.json({
        ok: true,
        data: snapshot,
      });
    } catch (error) {
      console.error("Create snapshot error:", error);
      return c.json({ ok: false, error: "Failed to create snapshot" }, 500);
    }
  }
);

// ========================================
// CENTER ENDPOINTS
// ========================================

// GET /api/v1/performance/center/metrics - Get own performance metrics
performanceApp.get(
  "/center/metrics",
  authMiddleware(["center", "center_staff"]),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    const centerId = payload?.centerId;

    if (!centerId) {
      return c.json({ ok: false, error: "Center ID not found" }, 400);
    }

    try {
      // Get current test counts
      const testCounts = await calculateTestCounts(db, centerId);

      // Get active target
      const activeTarget = await getActiveTarget(db, centerId);

      // Calculate categories
      const dailyCategory = calculatePerformanceCategory(
        testCounts.dailyTests,
        activeTarget?.dailyTarget
      );
      const weeklyCategory = calculatePerformanceCategory(
        testCounts.weeklyTests,
        activeTarget?.weeklyTarget
      );
      const monthlyCategory = calculatePerformanceCategory(
        testCounts.monthlyTests,
        activeTarget?.monthlyTarget
      );

      // Get latest snapshot
      const latestSnapshot = await db.centerPerformanceSnapshot.findFirst({
        where: { centerId },
        orderBy: { snapshotDate: "desc" },
      });

      return c.json({
        ok: true,
        data: {
          currentMetrics: {
            dailyTests: testCounts.dailyTests,
            weeklyTests: testCounts.weeklyTests,
            monthlyTests: testCounts.monthlyTests,
            dailyTarget: activeTarget?.dailyTarget,
            weeklyTarget: activeTarget?.weeklyTarget,
            monthlyTarget: activeTarget?.monthlyTarget,
            dailyCategory,
            weeklyCategory,
            monthlyCategory,
          },
          activeTarget,
          latestSnapshot,
        },
      });
    } catch (error) {
      console.error("Get center metrics error:", error);
      return c.json({ ok: false, error: "Failed to fetch metrics" }, 500);
    }
  }
);

// GET /api/v1/performance/center/targets - Get own targets
performanceApp.get(
  "/center/targets",
  authMiddleware(["center", "center_staff"]),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    const centerId = payload?.centerId;

    if (!centerId) {
      return c.json({ ok: false, error: "Center ID not found" }, 400);
    }

    try {
      const targets = await db.centerTarget.findMany({
        where: { centerId },
        orderBy: { effectiveFrom: "desc" },
      });

      return c.json({
        ok: true,
        data: targets,
      });
    } catch (error) {
      console.error("Get center targets error:", error);
      return c.json({ ok: false, error: "Failed to fetch targets" }, 500);
    }
  }
);

// GET /api/v1/performance/center/history - Get own performance history
performanceApp.get(
  "/center/history",
  authMiddleware(["center", "center_staff"]),
  zValidator("query", z.object({ days: z.coerce.number().min(7).max(90).default(30).optional() }), (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    const centerId = payload?.centerId;
    const { days = 30 } = c.req.valid("query");

    if (!centerId) {
      return c.json({ ok: false, error: "Center ID not found" }, 400);
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshots = await db.centerPerformanceSnapshot.findMany({
        where: {
          centerId,
          snapshotDate: { gte: startDate },
        },
        orderBy: { snapshotDate: "asc" },
      });

      return c.json({
        ok: true,
        data: {
          history: snapshots,
          period: {
            from: startDate,
            to: new Date(),
            days,
          },
        },
      });
    } catch (error) {
      console.error("Get center history error:", error);
      return c.json({ ok: false, error: "Failed to fetch history" }, 500);
    }
  }
);

export default performanceApp;
