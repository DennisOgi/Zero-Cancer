import { zValidator } from "@hono/zod-validator";
import type {
  TCampaignAnalyticsResponse,
  TCenterPerformanceResponse,
  TDashboardMetricsResponse,
  TErrorResponse,
  TGeographicReportResponse,
  TTimeBasedReportResponse,
} from "@zerocancer/shared/types";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { getDB } from "../lib/db";
import { TEnvs, THonoApp } from "../lib/types";
import { z } from "zod";
import * as analyticsService from "../lib/analytics.service";

// ===================================================
// REDO THE ENTIER MODULE HERE...
// ===================================================

const analyticsApp = new Hono<THonoApp>();

// Validation schemas
const timeReportQuerySchema = z.object({
  period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const centerReportQuerySchema = z.object({
  centerId: z.string().optional(),
});

// GET /api/analytics/dashboard - Main dashboard metrics
analyticsApp.get("/dashboard", async (c) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics(getDB(c));

    return c.json<TDashboardMetricsResponse>({
      ok: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Failed to get dashboard metrics:", error);
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: "Failed to fetch dashboard metrics",
      },
      500
    );
  }
});

// GET /api/analytics/reports/time - Time-based reports
analyticsApp.get(
  "/reports/time",
  zValidator("query", timeReportQuerySchema),
  async (c) => {
    try {
      const { period, from, to } = c.req.valid("query");

      // Set default date range if not provided
      const endDate = to ? new Date(to) : new Date();
      const startDate = from
        ? new Date(from)
        : (() => {
            const date = new Date();
            switch (period) {
              case "daily":
                date.setDate(date.getDate() - 30); // Last 30 days
                break;
              case "weekly":
                date.setDate(date.getDate() - 7 * 12); // Last 12 weeks
                break;
              case "monthly":
                date.setMonth(date.getMonth() - 12); // Last 12 months
                break;
              case "yearly":
                date.setFullYear(date.getFullYear() - 5); // Last 5 years
                break;
            }
            return date;
          })();

      const report = await analyticsService.getTimeBasedReport(
        getDB(c),
        period,
        {
          from: startDate,
          to: endDate,
        }
      );

      return c.json<TTimeBasedReportResponse>({
        ok: true,
        data: {
          ...report,
          dateRange: {
            from: startDate.toISOString(),
            to: endDate.toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Failed to get time-based report:", error);
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Failed to fetch time-based report",
        },
        500
      );
    }
  }
);

// GET /api/analytics/geographic - Geographic analytics
analyticsApp.get("/geographic", async (c) => {
  try {
    const report = await analyticsService.getGeographicReport(getDB(c));

    return c.json<TGeographicReportResponse>({
      ok: true,
      data: report,
    });
  } catch (error) {
    console.error("Failed to get geographic report:", error);
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: "Failed to fetch geographic report",
      },
      500
    );
  }
});

// GET /api/analytics/centers - Center performance
analyticsApp.get(
  "/centers",
  zValidator("query", centerReportQuerySchema),
  async (c) => {
    try {
      const { centerId } = c.req.valid("query");
      const reports = await analyticsService.getCenterPerformanceReport(
        getDB(c),
        centerId
      );

      return c.json<TCenterPerformanceResponse>({
        ok: true,
        data: reports,
      });
    } catch (error) {
      console.error("Failed to get center performance report:", error);
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Failed to fetch center performance report",
        },
        500
      );
    }
  }
);

// GET /api/analytics/campaigns - Campaign analytics
analyticsApp.get("/campaigns", async (c) => {
  try {
    const analytics = await analyticsService.getCampaignAnalytics(getDB(c));

    return c.json<TCampaignAnalyticsResponse>({
      ok: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Failed to get campaign analytics:", error);
    return c.json<TErrorResponse>(
      {
        ok: false,
        error: "Failed to fetch campaign analytics",
      },
      500
    );
  }
});

export default analyticsApp;
