import { zValidator } from "@hono/zod-validator";
import {
  addKitsSchema,
  DEFAULT_KIT_ORDER_SCREENING_TYPE_ID,
  getKitOrdersQuerySchema,
  getKitsQuerySchema,
  isKitProductId,
  kitProductById,
  kitProductLabel,
  kitProductMinQuantity,
  kitShopCatalog,
  orderKitsSchema,
  updateKitOrderSchema,
} from "@zerocancer/shared";
import { Hono } from "hono";
import { getSupabaseClient } from "../lib/supabase";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const kitApp = new Hono<THonoApp>();

type EoiLineInput = {
  kitProduct: string;
  quantity: number;
};

function buildEoiInvoice(params: {
  invoiceNumber: string;
  issuedAt: string;
  lines: EoiLineInput[];
  buyer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string;
  };
}) {
  return {
    type: "EXPRESSION_OF_INTEREST" as const,
    title: "Expression of Interest Invoice",
    invoiceNumber: params.invoiceNumber,
    issuedAt: params.issuedAt,
    priceNote: "For Confirmation",
    footerNote: "You will be contacted later.",
    lines: params.lines.map((line) => {
      const product = kitProductById(line.kitProduct);
      return {
        kitProduct: line.kitProduct,
        name: product?.name || kitProductLabel(line.kitProduct) || line.kitProduct,
        shortName: product?.shortName || null,
        quantity: line.quantity,
        unitLabel: product?.unitLabel || "units",
        priceDisplay: "For Confirmation",
      };
    }),
    buyer: params.buyer,
  };
}

function centerBuyerFromRow(
  center: {
    centerName?: string | null;
    email?: string | null;
    phone?: string | null;
    whatsappNumber?: string | null;
    address?: string | null;
    state?: string | null;
    lga?: string | null;
  } | null,
  emailFallback?: string | null
) {
  return {
    name: center?.centerName || "Health facility",
    email: center?.email || emailFallback || null,
    phone: center?.whatsappNumber || center?.phone || null,
    address: [center?.address, center?.lga, center?.state]
      .filter(Boolean)
      .join(", "),
  };
}

// GET /api/v1/kit - List kits (paginated, filtered)
kitApp.get(
  "/",
  authMiddleware(["center", "center_staff", "admin"]),
  zValidator("query", getKitsQuerySchema),
  async (c) => {
    const supabase = getSupabaseClient(c);
    const {
      page = 1,
      pageSize = 20,
      status,
      screeningTypeId,
      centerId: queryCenterId,
      search,
    } = c.req.valid("query");

    const payload = c.get("jwtPayload");
    const userRole = payload?.profile;
    const jwtCenterId = payload?.id;

    let targetCenterId = queryCenterId;
    if (userRole === "CENTER" || userRole === "CENTER_STAFF") {
      targetCenterId = jwtCenterId;
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from("Kit")
      .select("id, serialNumber, batchNumber, status, receivedAt, screeningTypeId, kitProduct, centerId", {
        count: "exact",
      })
      .order("receivedAt", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);
    if (screeningTypeId) query = query.eq("screeningTypeId", screeningTypeId);
    if (targetCenterId) query = query.eq("centerId", targetCenterId);
    if (search) query = query.ilike("serialNumber", `%${search}%`);

    const { data, error, count } = await query;
    if (error) {
      console.error("List kits failed:", error);
      return c.json({ ok: false, error: "Failed to load kits" }, 500);
    }

    const typeIds = [
      ...new Set((data || []).map((row: any) => row.screeningTypeId).filter(Boolean)),
    ];
    const { data: types } = typeIds.length
      ? await supabase.from("ScreeningType").select("id, name").in("id", typeIds)
      : { data: [] };
    const nameById = new Map((types || []).map((t: any) => [t.id, t.name]));
    const total = count || 0;

    return c.json({
      ok: true,
      data: {
        kits: (data || []).map((row: any) => ({
          ...row,
          screeningType: { name: nameById.get(row.screeningTypeId) || "Kit" },
          kitProductName: kitProductLabel(row.kitProduct),
        })),
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
    const supabase = getSupabaseClient(c);
    const { centerId, screeningTypeId, serialNumbers, batchNumber } =
      c.req.valid("json");

    const payload = c.get("jwtPayload");
    if (payload?.profile === "CENTER" && payload.id !== centerId) {
      return c.json(
        { ok: false, error: "Unauthorized: Cannot add kits to another center" },
        403
      );
    }

    try {
      const kitsData = serialNumbers.map((sn) => ({
        id: crypto.randomUUID(),
        serialNumber: sn,
        batchNumber: batchNumber || null,
        centerId,
        screeningTypeId,
        status: "AVAILABLE",
      }));

      const { data, error } = await supabase
        .from("Kit")
        .upsert(kitsData, { onConflict: "serialNumber", ignoreDuplicates: true })
        .select("id");
      if (error) throw error;

      return c.json({
        ok: true,
        data: {
          count: data?.length || 0,
          message: `Successfully added ${data?.length || 0} kits to inventory.`,
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
    const supabase = getSupabaseClient(c);
    const payload = c.get("jwtPayload");
    const centerId = payload?.profile?.startsWith("CENTER")
      ? payload.id
      : undefined;

    let query = supabase.from("Kit").select("status");
    if (centerId) query = query.eq("centerId", centerId);
    const { data, error } = await query;
    if (error) {
      console.error("Kit stats failed:", error);
      return c.json({ ok: false, error: "Failed to load kit stats" }, 500);
    }

    const formattedStats = {
      AVAILABLE: 0,
      USED: 0,
      DAMAGED: 0,
      TOTAL: 0,
    };
    for (const row of data || []) {
      const status = String((row as any).status || "") as keyof typeof formattedStats;
      if (status in formattedStats && status !== "TOTAL") {
        formattedStats[status] += 1;
      }
      formattedStats.TOTAL += 1;
    }

    return c.json({ ok: true, data: formattedStats });
  }
);

// GET /api/v1/kit/orders - List this facility's kit purchase / restock requests
kitApp.get(
  "/orders",
  authMiddleware(["center", "center_staff"]),
  async (c) => {
    const supabase = getSupabaseClient(c);
    const centerId = c.get("jwtPayload")?.id as string;

    const { data, error } = await supabase
      .from("RestockRequest")
      .select("*")
      .eq("centerId", centerId)
      .order("requestedAt", { ascending: false })
      .limit(50);

    if (error) {
      console.error("List kit orders failed:", error);
      return c.json({ ok: false, error: "Failed to load kit orders" }, 500);
    }

    const typeIds = [
      ...new Set((data || []).map((row: any) => row.screeningTypeId).filter(Boolean)),
    ];
    const { data: types } = typeIds.length
      ? await supabase
          .from("ScreeningType")
          .select("id, name")
          .in("id", typeIds)
      : { data: [] };
    const nameById = new Map(
      (types || []).map((t: any) => [t.id, t.name])
    );

    return c.json({
      ok: true,
      data: {
        orders: (data || []).map((row: any) => ({
          ...row,
          screeningTypeName: nameById.get(row.screeningTypeId) || "Kit",
          kitProductName: kitProductLabel(row.kitProduct),
        })),
      },
    });
  }
);

// POST /api/v1/kit/orders - Request kits for this facility (sales/fulfillment later)
kitApp.post(
  "/orders",
  authMiddleware(["center"]),
  zValidator("json", orderKitsSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const supabase = getSupabaseClient(c);
      const payload = c.get("jwtPayload");
      const centerId = payload?.id as string;
      const body = c.req.valid("json");

      const lineItems =
        body.items?.length
          ? body.items
          : body.quantity
            ? [
                {
                  kitProduct: body.kitProduct || "",
                  quantity: body.quantity,
                },
              ]
            : [];

      if (!lineItems.length) {
        return c.json(
          {
            ok: false,
            error: "Add at least one device or kit to your order.",
          },
          400
        );
      }

      const catalog = kitShopCatalog();
      for (const line of lineItems) {
        if (!line.kitProduct || !isKitProductId(line.kitProduct)) {
          return c.json(
            {
              ok: false,
              error: "Select products from the Kits and Devices catalogue.",
            },
            400
          );
        }
        if (!catalog.some((product) => product.id === line.kitProduct)) {
          return c.json(
            { ok: false, error: "One of the selected products is not available." },
            400
          );
        }
        const min = kitProductMinQuantity(line.kitProduct);
        if (line.quantity < min) {
          const label = kitProductLabel(line.kitProduct) || "This product";
          return c.json(
            {
              ok: false,
              error: `${label}: minimum order quantity is ${min}.`,
            },
            400
          );
        }
      }

      // Inventory FK still expects a screening type; shop UI does not ask for one.
      let screeningTypeId =
        body.screeningTypeId || DEFAULT_KIT_ORDER_SCREENING_TYPE_ID;
      const { data: screeningType } = await supabase
        .from("ScreeningType")
        .select("id")
        .eq("id", screeningTypeId)
        .maybeSingle();
      if (!screeningType) {
        const { data: fallback } = await supabase
          .from("ScreeningType")
          .select("id")
          .ilike("name", "%cervical%")
          .limit(1)
          .maybeSingle();
        if (!fallback?.id) {
          return c.json(
            {
              ok: false,
              error: "Could not place order. Please contact ZeroCancer support.",
            },
            500
          );
        }
        screeningTypeId = fallback.id;
      }

      const { data: center } = await supabase
        .from("ServiceCenter")
        .select("id, centerName, email, phone, whatsappNumber, address, state, lga")
        .eq("id", centerId)
        .maybeSingle();

      const requestedAt = new Date().toISOString();
      const requestedBy = payload?.email || payload?.staffId || centerId;
      const invoiceNumber = `EOI-${Date.now().toString(36).toUpperCase()}`;
      const lineSummary = lineItems
        .map((line) => {
          const product = kitProductById(line.kitProduct);
          return `${product?.name || line.kitProduct} × ${line.quantity}`;
        })
        .join("; ");
      const orders = lineItems.map((line) => ({
        id: crypto.randomUUID(),
        centerId,
        screeningTypeId,
        kitProduct: line.kitProduct || null,
        invoiceNumber,
        requestedQuantity: line.quantity,
        urgency: body.urgency || "NORMAL",
        reason:
          body.notes ||
          `Expression of Interest ${invoiceNumber}: ${lineSummary}`,
        status: "PENDING",
        requestedBy,
        requestedAt,
      }));

      const { data, error } = await supabase
        .from("RestockRequest")
        .insert(orders)
        .select("*");

      if (error) throw error;

      const invoice = buildEoiInvoice({
        invoiceNumber,
        issuedAt: requestedAt,
        lines: lineItems,
        buyer: centerBuyerFromRow(center, payload?.email),
      });

      const count = data?.length || orders.length;
      return c.json(
        {
          ok: true,
          data: {
            orders: data || orders,
            order: data?.[0] || orders[0],
            invoiceNumber,
            invoice,
          },
          message:
            count === 1
              ? "Expression of Interest submitted. You will be contacted later."
              : `Expression of Interest for ${count} items submitted. You will be contacted later.`,
        },
        201
      );
    } catch (error: any) {
      console.error("Kit order failed:", error);
      return c.json(
        { ok: false, error: error?.message || "Failed to submit kit order" },
        400
      );
    }
  }
);

// GET /api/v1/kit/orders/invoice/:invoiceNumber - Rebuild EOI invoice for reprint
kitApp.get(
  "/orders/invoice/:invoiceNumber",
  authMiddleware(["center", "center_staff"]),
  async (c) => {
    const supabase = getSupabaseClient(c);
    const payload = c.get("jwtPayload");
    const centerId = payload?.id as string;
    const invoiceNumber = c.req.param("invoiceNumber");

    const { data: rows, error } = await supabase
      .from("RestockRequest")
      .select("*")
      .eq("centerId", centerId)
      .eq("invoiceNumber", invoiceNumber)
      .order("requestedAt", { ascending: true });

    if (error) {
      console.error("Load EOI invoice failed:", error);
      return c.json({ ok: false, error: "Failed to load invoice" }, 500);
    }
    if (!rows?.length) {
      return c.json({ ok: false, error: "Invoice not found" }, 404);
    }

    const { data: center } = await supabase
      .from("ServiceCenter")
      .select("id, centerName, email, phone, whatsappNumber, address, state, lga")
      .eq("id", centerId)
      .maybeSingle();

    const invoice = buildEoiInvoice({
      invoiceNumber,
      issuedAt: rows[0].requestedAt,
      lines: rows.map((row: any) => ({
        kitProduct: row.kitProduct || "UNKNOWN",
        quantity: row.requestedQuantity,
      })),
      buyer: centerBuyerFromRow(center, payload?.email),
    });

    return c.json({
      ok: true,
      data: {
        invoice,
        orders: rows.map((row: any) => ({
          ...row,
          kitProductName: kitProductLabel(row.kitProduct),
        })),
      },
    });
  }
);

// POST /api/v1/kit/orders/:id/cancel - Facility withdraws a pending EOI (all lines in the invoice)
kitApp.post("/orders/:id/cancel", authMiddleware(["center"]), async (c) => {
  const supabase = getSupabaseClient(c);
  const payload = c.get("jwtPayload");
  const centerId = payload?.id as string;
  const id = c.req.param("id");

  const { data: existing } = await supabase
    .from("RestockRequest")
    .select("id, invoiceNumber, status")
    .eq("id", id)
    .eq("centerId", centerId)
    .maybeSingle();

  if (!existing) {
    return c.json({ ok: false, error: "Order not found" }, 404);
  }
  if (existing.status !== "PENDING") {
    return c.json(
      { ok: false, error: "Only pending Expressions of Interest can be cancelled" },
      400
    );
  }

  let query = supabase
    .from("RestockRequest")
    .update({
      status: "CANCELLED",
      reviewedAt: new Date().toISOString(),
      reviewedBy: payload?.email || payload?.id,
    })
    .eq("centerId", centerId)
    .eq("status", "PENDING");

  if (existing.invoiceNumber) {
    query = query.eq("invoiceNumber", existing.invoiceNumber);
  } else {
    query = query.eq("id", id);
  }

  const { data, error } = await query.select("id");
  if (error) {
    console.error("Cancel kit order failed:", error);
    return c.json({ ok: false, error: "Failed to cancel order" }, 500);
  }
  if (!data?.length) {
    return c.json(
      { ok: false, error: "Only pending Expressions of Interest can be cancelled" },
      400
    );
  }
  return c.json({
    ok: true,
    data: {
      id: data[0].id,
      invoiceNumber: existing.invoiceNumber || null,
      cancelledCount: data.length,
    },
  });
});

// GET /api/v1/kit/admin/orders - All facility kit orders (platform admin)
kitApp.get(
  "/admin/orders",
  authMiddleware(["admin"]),
  zValidator("query", getKitOrdersQuerySchema),
  async (c) => {
    const supabase = getSupabaseClient(c);
    const { status, centerId } = c.req.valid("query");

    let query = supabase
      .from("RestockRequest")
      .select("*")
      .order("requestedAt", { ascending: false })
      .limit(200);
    if (status) query = query.eq("status", status);
    if (centerId) query = query.eq("centerId", centerId);
    const { data, error } = await query;
    if (error) {
      console.error("Admin list kit orders failed:", error);
      return c.json({ ok: false, error: "Failed to load kit orders" }, 500);
    }

    const rows = data || [];
    const typeIds = [...new Set(rows.map((r: any) => r.screeningTypeId))];
    const centerIds = [...new Set(rows.map((r: any) => r.centerId))];
    const [{ data: types }, { data: centers }] = await Promise.all([
      typeIds.length
        ? supabase.from("ScreeningType").select("id, name").in("id", typeIds)
        : Promise.resolve({ data: [] as any[] }),
      centerIds.length
        ? supabase
            .from("ServiceCenter")
            .select("id, centerName, state, lga, phone, email")
            .in("id", centerIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const typeById = new Map((types || []).map((t: any) => [t.id, t.name]));
    const centerById = new Map((centers || []).map((ct: any) => [ct.id, ct]));

    return c.json({
      ok: true,
      data: {
        orders: rows.map((row: any) => ({
          ...row,
          screeningTypeName: typeById.get(row.screeningTypeId) || "Kit",
          kitProductName: kitProductLabel(row.kitProduct),
          center: centerById.get(row.centerId) || null,
        })),
      },
    });
  }
);

const allowedTransitions: Record<string, string[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["SHIPPED", "DELIVERED", "REJECTED"],
  SHIPPED: ["DELIVERED"],
};

// PATCH /api/v1/kit/admin/orders/:id - Approve, ship, deliver or reject
kitApp.patch(
  "/admin/orders/:id",
  authMiddleware(["admin"]),
  zValidator("json", updateKitOrderSchema, (result, c) => {
    if (!result.success) {
      return c.json({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const supabase = getSupabaseClient(c);
    const admin = c.get("jwtPayload");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const { data: order } = await supabase
      .from("RestockRequest")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!order) {
      return c.json({ ok: false, error: "Order not found" }, 404);
    }
    if (!(allowedTransitions[order.status] || []).includes(body.status)) {
      return c.json(
        {
          ok: false,
          error: `Can't move an order from ${order.status} to ${body.status}`,
        },
        400
      );
    }

    const now = new Date().toISOString();
    let shipmentId: string | null = order.shipmentId || null;

    let serials: string[] = [];
    if (body.status === "DELIVERED") {
      const quantity = order.requestedQuantity as number;
      const provided = [...new Set(body.serialNumbers || [])];
      if (provided.length && provided.length !== quantity) {
        return c.json(
          {
            ok: false,
            error: `Enter ${quantity} serial numbers (one per kit) or leave the box empty to generate them.`,
          },
          400
        );
      }
      const prefix = `ZC-${String(order.id).slice(0, 6).toUpperCase()}`;
      serials = provided.length
        ? provided
        : Array.from(
            { length: quantity },
            (_, i) => `${prefix}-${String(i + 1).padStart(4, "0")}`
          );

      const { data: existing } = await supabase
        .from("Kit")
        .select("serialNumber")
        .in("serialNumber", serials);
      if (existing?.length) {
        return c.json(
          {
            ok: false,
            error: `Serial numbers already in use: ${existing
              .slice(0, 5)
              .map((k: any) => k.serialNumber)
              .join(", ")}`,
          },
          409
        );
      }
    }

    if (body.status === "SHIPPED" || body.status === "DELIVERED") {
      if (!shipmentId) {
        const { data: shipment, error: shipError } = await supabase
          .from("KitShipment")
          .insert({
            centerId: order.centerId,
            screeningTypeId: order.screeningTypeId,
            quantity: order.requestedQuantity,
            batchNumber: body.batchNumber || null,
            trackingNumber: body.trackingNumber || null,
            status: body.status,
            notes: body.reviewNotes || null,
            createdBy: admin?.email || admin?.id,
            ...(body.status === "DELIVERED" ? { deliveredAt: now } : {}),
          })
          .select("id")
          .single();
        if (shipError) {
          console.error("Create kit shipment failed:", shipError);
          return c.json({ ok: false, error: "Failed to record shipment" }, 500);
        }
        shipmentId = shipment.id;
      } else {
        await supabase
          .from("KitShipment")
          .update({
            status: body.status,
            updatedAt: now,
            ...(body.trackingNumber ? { trackingNumber: body.trackingNumber } : {}),
            ...(body.batchNumber ? { batchNumber: body.batchNumber } : {}),
            ...(body.status === "DELIVERED" ? { deliveredAt: now } : {}),
          })
          .eq("id", shipmentId);
      }
    }

    let kitsAdded = 0;
    if (body.status === "DELIVERED") {
      const { data: inserted, error: kitError } = await supabase
        .from("Kit")
        .insert(
          serials.map((serialNumber) => ({
            serialNumber,
            batchNumber: body.batchNumber || null,
            centerId: order.centerId,
            screeningTypeId: order.screeningTypeId,
            kitProduct: order.kitProduct || null,
            status: "AVAILABLE",
          }))
        )
        .select("id");
      if (kitError) {
        console.error("Add delivered kits failed:", kitError);
        return c.json(
          { ok: false, error: "Failed to add kits to facility inventory" },
          500
        );
      }
      kitsAdded = inserted?.length || 0;
    }

    const { data: updated, error } = await supabase
      .from("RestockRequest")
      .update({
        status: body.status,
        reviewedBy: admin?.email || admin?.id,
        reviewedAt: now,
        ...(body.reviewNotes ? { reviewNotes: body.reviewNotes } : {}),
        shipmentId,
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      console.error("Update kit order failed:", error);
      return c.json({ ok: false, error: "Failed to update order" }, 500);
    }

    return c.json({ ok: true, data: { order: updated, kitsAdded } });
  }
);

export default kitApp;
