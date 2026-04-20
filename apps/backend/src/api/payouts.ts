import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { THonoApp } from "../lib/types";
import { z } from "zod";
import { CryptoUtils } from "../lib/crypto.utils";
import { getDB } from "../lib/db";
import { PayoutService } from "../lib/payout.service";
import { PaystackService } from "../lib/paystack.service";
import { authMiddleware } from "../middleware/auth.middleware";

// =========
// TO BE FIXED AND UPDATED
// =========

const payoutsApp = new Hono<THonoApp>();

// Initialize services
const getPayoutService = (c: any) => {
  const { PAYSTACK_SECRET_KEY } = env<{ PAYSTACK_SECRET_KEY: string }>(
    c,
    "node"
  );
  const paystackService = new PaystackService(PAYSTACK_SECRET_KEY);
  return new PayoutService(getDB(c), paystackService);
};

// GET /api/payouts/center-balances - Get all center balances (Admin only)
payoutsApp.get("/center-balances", authMiddleware(["admin"]), async (c) => {
  try {
    const payoutService = getPayoutService(c);
    const balances = await payoutService.getAllCenterBalances();

    return c.json({
      ok: true,
      data: balances,
    });
  } catch (error) {
    console.error("Get center balances error:", error);
    return c.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get center balances",
      },
      500
    );
  }
});

// GET /api/payouts/center/:centerId/balance - Get specific center balance
payoutsApp.get(
  "/center/:centerId/balance",
  authMiddleware(["admin", "center_staff"]),
  async (c) => {
    try {
      const centerId = c.req.param("centerId");
      if (!centerId) {
        return c.json({ ok: false, error: "Center ID is required" }, 400);
      }

      const payoutService = getPayoutService(c);
      const balance = await payoutService.getCenterBalance(centerId);

      return c.json({
        ok: true,
        data: balance,
      });
    } catch (error) {
      console.error("Get center balance error:", error);
      return c.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to get center balance",
        },
        500
      );
    }
  }
);

// POST /api/payouts/manual - Create manual payout (Admin only)
const createManualPayoutSchema = z.object({
  centerId: z.string().min(1, "Center ID is required"),
  amount: z.number().positive("Amount must be positive"),
  transactionIds: z
    .array(z.string())
    .min(1, "At least one transaction required"),
  reason: z.string().optional(),
});

payoutsApp.post(
  "/manual",
  authMiddleware(["admin"]),
  zValidator("json", createManualPayoutSchema),
  async (c) => {
    try {
      const payoutService = getPayoutService(c);
      const payload = c.get("jwtPayload");
      const data = c.req.valid("json");

      const payout = await payoutService.createManualPayout({
        ...data,
        initiatedBy: payload?.id || "admin",
      });

      return c.json({
        ok: true,
        data: payout,
        message: "Manual payout created successfully",
      });
    } catch (error) {
      console.error("Create manual payout error:", error);
      return c.json(
        {
          ok: false,
          error:
            error instanceof Error ? error.message : "Failed to create payout",
        },
        400
      );
    }
  }
);

// POST /api/payouts/:payoutId/process - Process specific payout (Admin only)
payoutsApp.post("/:payoutId/process", authMiddleware(["admin"]), async (c) => {
  try {
    const payoutId = c.req.param("payoutId");
    if (!payoutId) {
      return c.json({ ok: false, error: "Payout ID is required" }, 400);
    }

    const payoutService = getPayoutService(c);
    const result = await payoutService.processPayout(payoutId);

    return c.json({
      ok: true,
      data: result,
      message: "Payout processed successfully",
    });
  } catch (error) {
    console.error("Process payout error:", error);
    return c.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to process payout",
      },
      400
    );
  }
});

// POST /api/payouts/:payoutId/retry - Retry failed payout (Admin only)
payoutsApp.post("/:payoutId/retry", authMiddleware(["admin"]), async (c) => {
  try {
    const payoutId = c.req.param("payoutId");
    if (!payoutId) {
      return c.json({ ok: false, error: "Payout ID is required" }, 400);
    }

    const payoutService = getPayoutService(c);
    const result = await payoutService.retryPayout(payoutId);

    return c.json({
      ok: true,
      data: result,
      message: "Payout retry initiated successfully",
    });
  } catch (error) {
    console.error("Retry payout error:", error);
    return c.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to retry payout",
      },
      400
    );
  }
});

// GET /api/payouts - List payouts with filters (Admin)
const listPayoutsSchema = z.object({
  page: z.string().transform(Number).optional().default("1"),
  limit: z.string().transform(Number).optional().default("20"),
  centerId: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  batchReference: z.string().optional(),
});

payoutsApp.get(
  "/",
  authMiddleware(["admin"]),
  zValidator("query", listPayoutsSchema),
  async (c) => {
    try {
      const filters = c.req.valid("query");
      const payoutService = getPayoutService(c);

      const result = await payoutService.getPayouts(filters);
      return c.json({
        ok: true,
        data: result,
      });
    } catch (error) {
      console.error("List payouts error:", error);
      return c.json(
        {
          ok: false,
          error:
            error instanceof Error ? error.message : "Failed to get payouts",
        },
        500
      );
    }
  }
);

// GET /api/payouts/center/:centerId - Get center-specific payouts (Center staff)
const listCenterPayoutsSchema = z.object({
  page: z.string().transform(Number).optional().default("1"),
  limit: z.string().transform(Number).optional().default("20"),
  status: z.string().optional(),
});

payoutsApp.get(
  "/center/:centerId",
  authMiddleware(["admin", "center_staff"]),
  zValidator("query", listCenterPayoutsSchema),
  async (c) => {
    try {
      const centerId = c.req.param("centerId");
      const filters = c.req.valid("query");
      const payload = c.get("jwtPayload");
      const payoutService = getPayoutService(c);

      // Authorization check - center staff can only access their own center's payouts
      if (payload?.profile?.toLowerCase() === "center_staff") {
        // For center staff, we need to verify they can access this center
        // TODO: Add center staff verification logic based on your auth system
        // This might involve checking if the user is associated with the center
      }

      const result = await payoutService.getCenterPayouts(centerId, filters);
      return c.json({
        ok: true,
        data: result,
      });
    } catch (error) {
      console.error("List center payouts error:", error);
      return c.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to get center payouts",
        },
        500
      );
    }
  }
);

// GET /api/payouts/center/:centerId/transactions - Get center transaction/receipt history
const listCenterTransactionsSchema = z.object({
  page: z.string().transform(Number).optional().default("1"),
  limit: z.string().transform(Number).optional().default("20"),
  status: z.string().optional(),
  startDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  endDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
});

payoutsApp.get(
  "/center/:centerId/transactions",
  authMiddleware(["admin", "center_staff"]),
  zValidator("query", listCenterTransactionsSchema),
  async (c) => {
    try {
      const centerId = c.req.param("centerId");
      const filters = c.req.valid("query");
      const payload = c.get("jwtPayload");
      const payoutService = getPayoutService(c);

      // Authorization check - center staff can only access their own center's transactions
      if (payload?.profile?.toLowerCase() === "center_staff") {
        // TODO: Add center staff verification logic based on your auth system
        // This might involve checking if the user is associated with the center
      }

      const result = await payoutService.getCenterTransactionHistory(
        centerId,
        filters
      );
      return c.json({
        ok: true,
        data: result,
      });
    } catch (error) {
      console.error("List center transactions error:", error);
      return c.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to get center transactions",
        },
        500
      );
    }
  }
);

// POST /api/payouts/monthly-batch - AUTOMATED MONTHLY PAYOUTS (for cron job)
payoutsApp.post("/monthly-batch", async (c) => {
  try {
    // Optional: Add API key authentication for cron job
    const apiKey = c.req.header("x-api-key");
    const { CRON_API_KEY } = env<{ CRON_API_KEY?: string }>(c);

    if (CRON_API_KEY && apiKey !== CRON_API_KEY) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const payoutService = getPayoutService(c);

    const results = await payoutService.processMonthlyPayouts();

    console.log("Monthly payouts processed:", results);

    return c.json({
      ok: true,
      message: "Monthly payouts processed successfully",
      data: results,
    });
  } catch (error) {
    console.error("Monthly payouts error:", error);
    return c.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process monthly payouts",
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

// POST /api/payouts/webhook/paystack - Paystack transfer webhook
payoutsApp.post("/webhook/paystack", async (c) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header("x-paystack-signature");
    const { PAYSTACK_SECRET_KEY } = env<{ PAYSTACK_SECRET_KEY: string }>(
      c,
      "node"
    );

    // Verify webhook signature
    if (
      !signature ||
      !CryptoUtils.verifyWebhookSignature(body, signature, PAYSTACK_SECRET_KEY)
    ) {
      console.warn("Invalid webhook signature");
      return c.text("Invalid signature", 403);
    }

    const event = JSON.parse(body);
    console.log("Paystack webhook event:", event.event, event.data?.reference);

    if (event.event === "transfer.success") {
      // Update payout status to SUCCESS
      const updated = await getDB(c).payout.updateMany({
        where: { transferReference: event.data.reference },
        data: {
          status: "SUCCESS",
          completedAt: new Date(),
        },
      });

      console.log(
        `Updated ${updated.count} payouts to SUCCESS for reference: ${event.data.reference}`
      );
    } else if (event.event === "transfer.failed") {
      // Update payout status to FAILED
      const updated = await getDB(c).payout.updateMany({
        where: { transferReference: event.data.reference },
        data: {
          status: "FAILED",
          failureReason:
            event.data.failure_reason || "Transfer failed via webhook",
        },
      });

      console.log(
        `Updated ${updated.count} payouts to FAILED for reference: ${event.data.reference}`
      );
    } else if (event.event === "transfer.reversed") {
      // Handle transfer reversal
      const updated = await getDB(c).payout.updateMany({
        where: { transferReference: event.data.reference },
        data: {
          status: "FAILED",
          failureReason: "Transfer was reversed",
        },
      });

      console.log(
        `Updated ${updated.count} payouts to FAILED (reversed) for reference: ${event.data.reference}`
      );
    }

    return c.text("OK");
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return c.text("Error processing webhook", 500);
  }
});

// GET /api/payouts/banks - Get Nigerian banks for recipient creation
payoutsApp.get(
  "/banks",
  authMiddleware(["admin", "center_staff"]),
  async (c) => {
    try {
      const { PAYSTACK_SECRET_KEY } = env<{ PAYSTACK_SECRET_KEY: string }>(
        c,
        "node"
      );
      const paystackService = new PaystackService(PAYSTACK_SECRET_KEY);

      const banks = await paystackService.getBanks();
      return c.json({
        ok: true,
        data: banks,
      });
    } catch (error) {
      console.error("Get banks error:", error);
      return c.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Failed to get banks",
        },
        500
      );
    }
  }
);

// POST /api/payouts/verify-account - Verify bank account details
const verifyAccountSchema = z.object({
  accountNumber: z.string().length(10, "Account number must be 10 digits"),
  bankCode: z.string().min(1, "Bank code is required"),
});

payoutsApp.post(
  "/verify-account",
  authMiddleware(["admin", "center_staff"]),
  zValidator("json", verifyAccountSchema),
  async (c) => {
    try {
      const { accountNumber, bankCode } = c.req.valid("json");
      const { PAYSTACK_SECRET_KEY } = env<{ PAYSTACK_SECRET_KEY: string }>(
        c,
        "node"
      );
      const paystackService = new PaystackService(PAYSTACK_SECRET_KEY);

      const verification = await paystackService.verifyAccountNumber(
        accountNumber,
        bankCode
      );
      return c.json({
        ok: true,
        data: verification,
      });
    } catch (error) {
      console.error("Verify account error:", error);
      return c.json(
        {
          ok: false,
          error:
            error instanceof Error ? error.message : "Failed to verify account",
        },
        400
      );
    }
  }
);

export { payoutsApp };
