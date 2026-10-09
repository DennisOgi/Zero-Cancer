import { zValidator } from "@hono/zod-validator";
import {
  createWaitingListSchema,
  listWaitingListsQuerySchema,
} from "@zerocancer/shared";
import type { TErrorResponse } from "@zerocancer/shared/types";
import crypto from "crypto";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { getSupabaseClient } from "../lib/supabase";
import { TEnvs, THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const waitingListsApp = new Hono<THonoApp>();

const DEFAULT_CERVICAL_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

function frontendOrigin(c: any) {
  const { FRONTEND_URL } = env<TEnvs>(c);
  return String(FRONTEND_URL || "https://zerocancer.ng").replace(/\/$/, "");
}

function joinUrlFor(c: any, shareToken: string) {
  return `${frontendOrigin(c)}/sign-up/patient?list=${encodeURIComponent(shareToken)}`;
}

function newShareToken() {
  return crypto.randomBytes(12).toString("hex");
}

async function screeningMeta(
  supabase: ReturnType<typeof getSupabaseClient>,
  screeningTypeId?: string | null
) {
  const id = screeningTypeId || DEFAULT_CERVICAL_ID;
  const { data } = await supabase
    .from("ScreeningType")
    .select("id, name, agreedPrice")
    .eq("id", id)
    .maybeSingle();
  return {
    id: data?.id || id,
    name: (data?.name as string) || "Cervical screening",
    price: Number(data?.agreedPrice) || 10000,
  };
}

async function listCounts(
  supabase: ReturnType<typeof getSupabaseClient>,
  groupId: string,
  screeningTypeId?: string | null
) {
  const { data: profiles } = await supabase
    .from("PatientProfile")
    .select("userId")
    .eq("groupId", groupId);
  const patientIds = (profiles || []).map((row: { userId: string }) => row.userId);
  const memberCount = patientIds.length;
  if (memberCount === 0) return { memberCount: 0, pendingCount: 0 };

  let query = supabase
    .from("Waitlist")
    .select("*", { count: "exact", head: true })
    .in("patientId", patientIds)
    .eq("status", "PENDING");
  if (screeningTypeId) query = query.eq("screeningTypeId", screeningTypeId);
  const { count } = await query;
  return { memberCount, pendingCount: count || 0 };
}

async function ownerLabel(
  supabase: ReturnType<typeof getSupabaseClient>,
  ownerDonorId?: string | null
) {
  if (!ownerDonorId) return null;
  const { data: donor } = await supabase
    .from("DonorProfile")
    .select("organizationName")
    .eq("userId", ownerDonorId)
    .maybeSingle();
  if (donor?.organizationName) return donor.organizationName as string;
  const { data: user } = await supabase
    .from("User")
    .select("fullName")
    .eq("id", ownerDonorId)
    .maybeSingle();
  return (user?.fullName as string) || null;
}

async function formatList(
  c: any,
  supabase: ReturnType<typeof getSupabaseClient>,
  row: any,
  donorId?: string
) {
  const screening = await screeningMeta(supabase, row.screeningTypeId);
  const counts = await listCounts(supabase, row.id, row.screeningTypeId);
  const isOwner = Boolean(donorId && row.ownerDonorId === donorId);
  const canShare = row.visibility === "PUBLIC" || isOwner;
  return {
    id: row.id,
    name: row.name,
    description: row.description || null,
    visibility: row.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
    targetGender: row.targetGender || null,
    screeningTypeId: screening.id,
    screeningTypeName: screening.name,
    screeningPrice: screening.price,
    memberCount: counts.memberCount,
    pendingCount: counts.pendingCount,
    createdAt: row.createdAt,
    isOwner,
    joinUrl: canShare && row.shareToken ? joinUrlFor(c, row.shareToken) : undefined,
    ownerLabel: await ownerLabel(supabase, row.ownerDonorId),
  };
}

async function paginatedLists(
  c: any,
  supabase: ReturnType<typeof getSupabaseClient>,
  {
    visibility,
    ownerDonorId,
    search,
    page,
    pageSize,
    donorId,
  }: {
    visibility?: string;
    ownerDonorId?: string;
    search?: string;
    page: number;
    pageSize: number;
    donorId?: string;
  }
) {
  let query = supabase.from("Group").select("*", { count: "exact" });
  if (visibility) query = query.eq("visibility", visibility);
  if (ownerDonorId) query = query.eq("ownerDonorId", ownerDonorId);
  const safeSearch = search?.replace(/[%*,()]/g, "").trim().slice(0, 80);
  if (safeSearch) {
    query = query.or(`name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
  }

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query
    .order("createdAt", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) throw error;
  const rows = data || [];
  const lists = await Promise.all(
    rows.map((row) => formatList(c, supabase, row, donorId))
  );
  const total = count || 0;
  return {
    lists,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

waitingListsApp.get("/join/:token", async (c) => {
  const token = String(c.req.param("token") || "").trim().toLowerCase();
  if (token.length < 8) {
    return c.json<TErrorResponse>({ ok: false, error: "Waiting list not found" }, 404);
  }

  const supabase = getSupabaseClient(c);
  const { data: group } = await supabase
    .from("Group")
    .select("name, description, targetGender, screeningTypeId")
    .eq("shareToken", token)
    .maybeSingle();

  if (!group) {
    return c.json<TErrorResponse>({ ok: false, error: "Waiting list not found" }, 404);
  }

  const screening = await screeningMeta(supabase, group.screeningTypeId);
  return c.json({
    ok: true,
    data: {
      name: group.name,
      description: group.description || null,
      targetGender: group.targetGender || null,
      screeningTypeName: screening.name,
    },
  });
});

waitingListsApp.get(
  "/public",
  authMiddleware(["donor"]),
  zValidator("query", listWaitingListsQuerySchema),
  async (c) => {
    const { page = 1, pageSize = 20, search } = c.req.valid("query");
    const supabase = getSupabaseClient(c);
    const donorId = c.get("jwtPayload")?.id;
    const data = await paginatedLists(c, supabase, {
      visibility: "PUBLIC",
      search: search?.trim() || undefined,
      page,
      pageSize,
      donorId,
    });
    return c.json({ ok: true, data });
  }
);

waitingListsApp.get("/mine", authMiddleware(["donor"]), async (c) => {
  const supabase = getSupabaseClient(c);
  const donorId = c.get("jwtPayload")?.id;
  const data = await paginatedLists(c, supabase, {
    ownerDonorId: donorId,
    page: 1,
    pageSize: 100,
    donorId,
  });
  return c.json({ ok: true, data });
});

waitingListsApp.post(
  "/",
  authMiddleware(["donor"]),
  zValidator("json", createWaitingListSchema),
  async (c) => {
    const body = c.req.valid("json");
    const donorId = c.get("jwtPayload")?.id;
    const supabase = getSupabaseClient(c);
    const screening = await screeningMeta(supabase, body.screeningTypeId);

    const { data: created, error } = await supabase
      .from("Group")
      .insert({
        id: crypto.randomUUID(),
        name: body.name.trim(),
        description: body.description?.trim() || null,
        visibility: body.visibility,
        ownerDonorId: donorId,
        shareToken: newShareToken(),
        targetGender: body.targetGender || null,
        screeningTypeId: screening.id,
        createdAt: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("[WAITING_LIST] create failed:", error.message);
      return c.json<TErrorResponse>(
        { ok: false, error: "Could not create waiting list" },
        500
      );
    }

    return c.json({ ok: true, data: await formatList(c, supabase, created, donorId) }, 201);
  }
);

export async function attachPatientToWaitingList(
  c: any,
  patientId: string,
  listToken?: string | null
) {
  const token = String(listToken || "").trim().toLowerCase();
  if (!token) return;

  const supabase = getSupabaseClient(c);
  const { data: group } = await supabase
    .from("Group")
    .select("id, screeningTypeId")
    .eq("shareToken", token)
    .maybeSingle();
  if (!group) return;

  await supabase.from("PatientProfile").update({ groupId: group.id }).eq("userId", patientId);

  const screeningTypeId = group.screeningTypeId || DEFAULT_CERVICAL_ID;
  const { data: existing } = await supabase
    .from("Waitlist")
    .select("id")
    .eq("patientId", patientId)
    .eq("screeningTypeId", screeningTypeId)
    .in("status", ["PENDING", "MATCHED"])
    .maybeSingle();
  if (existing) return;

  await supabase.from("Waitlist").insert({
    id: crypto.randomUUID(),
    patientId,
    screeningTypeId,
    status: "PENDING",
    joinedAt: new Date().toISOString(),
  });
}
