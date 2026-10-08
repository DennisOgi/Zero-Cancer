import { zValidator } from "@hono/zod-validator";
import {
  createCommunityEventSchema,
  listCommunityEventsQuerySchema,
  patientPhotoUploadSchema,
  reviewCommunityEventSchema,
} from "@zerocancer/shared";
import type { TErrorResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import {
  isAllowedPatientPhotoUrl,
  uploadBase64ImageToCloudinary,
} from "../lib/cloudinary-signed-upload";
import { getSupabaseClient } from "../lib/supabase";
import { TEnvs, THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadRateLimit } from "../middleware/upload-rate-limit.middleware";

export const eventsApp = new Hono<THonoApp>();

const PUBLISHER_PROFILES = ["donor", "center"] as const;

function parseImageMime(fileBase64: string) {
  const match = fileBase64.match(/^data:(image\/(?:jpeg|png|webp));base64,/i);
  return match?.[1]?.toLowerCase() as
    | "image/jpeg"
    | "image/png"
    | "image/webp"
    | undefined;
}

function publicEvent(row: any) {
  return {
    id: row.id,
    publisherType: row.publisherType,
    publisherName: row.publisherName,
    title: row.title,
    body: row.body,
    coverImageUrl: row.coverImageUrl,
    imageUrls: row.imageUrls || [],
    featured: Boolean(row.featured),
    status: row.status,
    createdAt: row.createdAt,
  };
}

async function resolvePublisher(c: any) {
  const payload = c.get("jwtPayload");
  const profile = String(payload?.profile || "").toUpperCase();
  const supabase = getSupabaseClient(c);

  if (profile === "CENTER") {
    const { data: center } = await supabase
      .from("ServiceCenter")
      .select("id, centerName")
      .eq("id", payload.id)
      .maybeSingle();
    if (!center) return null;
    return {
      publisherType: "CENTER" as const,
      publisherId: center.id as string,
      publisherName: (center.centerName as string) || "Health facility",
    };
  }

  if (profile === "DONOR") {
    const { data: user } = await supabase
      .from("User")
      .select("id, fullName")
      .eq("id", payload.id)
      .maybeSingle();
    if (!user) return null;
    return {
      publisherType: "DONOR" as const,
      publisherId: user.id as string,
      publisherName: (user.fullName as string) || "Donor",
    };
  }

  return null;
}

function assertOwnUrls(
  urls: string[],
  cloudName: string
): string | null {
  for (const url of urls) {
    if (!isAllowedPatientPhotoUrl(url, cloudName)) {
      return "Photos must be uploaded through the app.";
    }
  }
  return null;
}

eventsApp.get(
  "/",
  zValidator("query", listCommunityEventsQuerySchema, (result) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    const supabase = getSupabaseClient(c);
    const { page = 1, pageSize = 12, publisherType } = c.req.valid("query");
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("CommunityEvent")
      .select("*", { count: "exact" })
      .eq("status", "APPROVED")
      .order("featured", { ascending: false })
      .order("createdAt", { ascending: false })
      .range(from, to);

    if (publisherType) query = query.eq("publisherType", publisherType);

    const { data, error, count } = await query;
    if (error) {
      console.error("[EVENTS] List failed:", error);
      return c.json({ ok: false, error: "Failed to load events" }, 500);
    }

    return c.json({
      ok: true,
      data: {
        events: (data || []).map(publicEvent),
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  }
);

eventsApp.get("/featured", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: featured, error: featuredError } = await supabase
    .from("CommunityEvent")
    .select("*")
    .eq("status", "APPROVED")
    .eq("featured", true)
    .order("createdAt", { ascending: false })
    .limit(8);

  if (featuredError) {
    console.error("[EVENTS] Featured failed:", featuredError);
    return c.json({ ok: false, error: "Failed to load events" }, 500);
  }

  let events = featured || [];
  if (events.length < 8) {
    const { data: latest } = await supabase
      .from("CommunityEvent")
      .select("*")
      .eq("status", "APPROVED")
      .eq("featured", false)
      .order("createdAt", { ascending: false })
      .limit(8 - events.length);
    events = [...events, ...(latest || [])];
  }

  return c.json({
    ok: true,
    data: { events: events.map(publicEvent) },
  });
});

eventsApp.get("/mine", authMiddleware([...PUBLISHER_PROFILES]), async (c) => {
  const publisher = await resolvePublisher(c);
  if (!publisher) {
    return c.json({ ok: false, error: "Publisher profile not found" }, 404);
  }

  const supabase = getSupabaseClient(c);
  const { data, error } = await supabase
    .from("CommunityEvent")
    .select("*")
    .eq("publisherType", publisher.publisherType)
    .eq("publisherId", publisher.publisherId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("[EVENTS] Mine failed:", error);
    return c.json({ ok: false, error: "Failed to load your events" }, 500);
  }

  return c.json({
    ok: true,
    data: { events: (data || []).map(publicEvent) },
  });
});

eventsApp.get(
  "/admin",
  authMiddleware(["admin"]),
  zValidator("query", listCommunityEventsQuerySchema, (result) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    const supabase = getSupabaseClient(c);
    const { page = 1, pageSize = 20, status, publisherType } =
      c.req.valid("query");
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("CommunityEvent")
      .select("*", { count: "exact" })
      .order("createdAt", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);
    if (publisherType) query = query.eq("publisherType", publisherType);

    const { data, error, count } = await query;
    if (error) {
      console.error("[EVENTS] Admin list failed:", error);
      return c.json({ ok: false, error: "Failed to load events" }, 500);
    }

    return c.json({
      ok: true,
      data: {
        events: (data || []).map((row) => ({
          ...publicEvent(row),
          rejectionReason: row.rejectionReason,
          reviewedAt: row.reviewedAt,
        })),
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  }
);

eventsApp.post(
  "/photo",
  authMiddleware([...PUBLISHER_PROFILES]),
  uploadRateLimit,
  zValidator("json", patientPhotoUploadSchema, (result) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    try {
      const {
        CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET,
      } = env<TEnvs>(c);
      const { fileBase64, fileName, mimeType } = c.req.valid("json");
      const detectedMime = parseImageMime(fileBase64);

      if (fileBase64.startsWith("data:") && !detectedMime) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Only JPG, PNG, or WEBP images are allowed." },
          400
        );
      }
      if (detectedMime && detectedMime !== mimeType) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Image type does not match file contents." },
          400
        );
      }

      const normalizedBase64 = fileBase64.startsWith("data:")
        ? fileBase64
        : `data:${mimeType};base64,${fileBase64}`;
      const estimatedBytes = Math.ceil(
        (normalizedBase64.length - normalizedBase64.indexOf(",") - 1) * 0.75
      );
      if (estimatedBytes > 5 * 1024 * 1024) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Photo must be 5MB or smaller." },
          400
        );
      }

      const safeName = fileName.replace(/[^\w.-]+/g, "_").slice(0, 80);
      const uploaded = await uploadBase64ImageToCloudinary({
        cloudName: CLOUDINARY_CLOUD_NAME,
        apiKey: CLOUDINARY_API_KEY,
        apiSecret: CLOUDINARY_API_SECRET,
        fileBase64: normalizedBase64,
        folder: "community-events",
        publicId: `community-events/${Date.now()}-${safeName.replace(/\.[^.]+$/, "")}`,
      });

      return c.json({
        ok: true,
        data: { url: uploaded.secure_url, publicId: uploaded.public_id },
      });
    } catch (error) {
      console.error("[EVENTS] Photo upload failed:", error);
      const message =
        error instanceof Error ? error.message : "Failed to upload photo";
      const status = message.includes("not configured") ? 503 : 500;
      return c.json<TErrorResponse>({ ok: false, error: message }, status);
    }
  }
);

eventsApp.post(
  "/",
  authMiddleware([...PUBLISHER_PROFILES]),
  zValidator("json", createCommunityEventSchema, (result) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    const publisher = await resolvePublisher(c);
    if (!publisher) {
      return c.json({ ok: false, error: "Publisher profile not found" }, 404);
    }

    const { CLOUDINARY_CLOUD_NAME } = env<TEnvs>(c);
    const data = c.req.valid("json");
    const extra = data.imageUrls || [];
    const urlError = assertOwnUrls(
      [data.coverImageUrl, ...extra],
      CLOUDINARY_CLOUD_NAME
    );
    if (urlError) {
      return c.json({ ok: false, error: urlError }, 400);
    }

    const supabase = getSupabaseClient(c);
    const { data: created, error } = await supabase
      .from("CommunityEvent")
      .insert({
        publisherType: publisher.publisherType,
        publisherId: publisher.publisherId,
        publisherName: publisher.publisherName,
        title: data.title,
        body: data.body,
        coverImageUrl: data.coverImageUrl,
        imageUrls: extra,
        status: "PENDING",
        featured: false,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[EVENTS] Create failed:", error);
      return c.json({ ok: false, error: "Failed to submit event" }, 500);
    }

    return c.json(
      {
        ok: true,
        message: "Event submitted. It will appear after ZeroCancer approves it.",
        data: publicEvent(created),
      },
      201
    );
  }
);

eventsApp.get("/:id", async (c) => {
  const supabase = getSupabaseClient(c);
  const { data: row, error } = await supabase
    .from("CommunityEvent")
    .select("*")
    .eq("id", c.req.param("id"))
    .eq("status", "APPROVED")
    .maybeSingle();

  if (error || !row) {
    return c.json({ ok: false, error: "Event not found" }, 404);
  }

  return c.json({ ok: true, data: publicEvent(row) });
});

eventsApp.delete("/:id", authMiddleware(["donor", "center", "admin"]), async (c) => {
  const supabase = getSupabaseClient(c);
  const payload = c.get("jwtPayload");
  const profile = String(payload?.profile || "").toUpperCase();
  const { data: row } = await supabase
    .from("CommunityEvent")
    .select("*")
    .eq("id", c.req.param("id"))
    .maybeSingle();

  if (!row) return c.json({ ok: false, error: "Event not found" }, 404);

  if (profile !== "ADMIN") {
    const publisher = await resolvePublisher(c);
    if (
      !publisher ||
      row.publisherType !== publisher.publisherType ||
      row.publisherId !== publisher.publisherId
    ) {
      return c.json({ ok: false, error: "Forbidden" }, 403);
    }
    if (row.status === "APPROVED") {
      return c.json(
        { ok: false, error: "Approved events can only be removed by ZeroCancer." },
        400
      );
    }
  }

  const { error } = await supabase
    .from("CommunityEvent")
    .delete()
    .eq("id", row.id);
  if (error) return c.json({ ok: false, error: "Failed to delete event" }, 500);
  return c.json({ ok: true, data: { id: row.id } });
});

eventsApp.patch(
  "/:id/review",
  authMiddleware(["admin"]),
  zValidator("json", reviewCommunityEventSchema, (result) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    const supabase = getSupabaseClient(c);
    const payload = c.get("jwtPayload");
    const { status, featured, rejectionReason } = c.req.valid("json");

    const { data: row } = await supabase
      .from("CommunityEvent")
      .select("id")
      .eq("id", c.req.param("id"))
      .maybeSingle();
    if (!row) return c.json({ ok: false, error: "Event not found" }, 404);

    const { data: updated, error } = await supabase
      .from("CommunityEvent")
      .update({
        status,
        featured: status === "APPROVED" ? Boolean(featured) : false,
        rejectionReason: status === "REJECTED" ? rejectionReason || null : null,
        reviewedAt: new Date().toISOString(),
        reviewedBy: payload?.id || null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", row.id)
      .select("*")
      .single();

    if (error) {
      console.error("[EVENTS] Review failed:", error);
      return c.json({ ok: false, error: "Failed to review event" }, 500);
    }

    return c.json({ ok: true, data: publicEvent(updated) });
  }
);
