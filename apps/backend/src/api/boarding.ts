import { zValidator } from "@hono/zod-validator";
import {
  completeBoardingVideosSchema,
  createAnniversaryContactSchema,
  createBoardingInviteSchema,
  facilityChoiceSchema,
} from "@zerocancer/shared";
import type { TErrorResponse, TRecommendedCenter } from "@zerocancer/shared/types";
import crypto from "crypto";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { env } from "hono/adapter";
import { getAgentByUserId } from "../lib/agent.service";
import {
  assignPatientToCenter,
  findRecommendedCenters,
} from "../lib/patient-center-utils";
import { getSupabaseClient } from "../lib/supabase";
import { getDB } from "../lib/db";
import { TEnvs, THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const boardingApp = new Hono<THonoApp>();

function frontendOrigin(c: any) {
  const { FRONTEND_URL } = env<TEnvs>(c);
  return String(FRONTEND_URL || "https://zerocancer.ng").replace(/\/$/, "");
}

function joinUrlFor(c: any, token: string) {
  return `${frontendOrigin(c)}/join/${encodeURIComponent(token)}`;
}

function newToken() {
  return crypto.randomBytes(10).toString("hex");
}

function actorRole(c: any): "PATIENT" | "DONOR" | null {
  const profile = String(c.get("jwtPayload")?.profile || "").toUpperCase();
  if (profile === "PATIENT" || profile === "DONOR") return profile;
  return null;
}

function daysUntil(month: number, day: number, from = new Date()) {
  const year = from.getFullYear();
  let next = new Date(year, month - 1, day);
  next.setHours(0, 0, 0, 0);
  const today = new Date(from);
  today.setHours(0, 0, 0, 0);
  if (next < today) next = new Date(year + 1, month - 1, day);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

function occasionLabel(occasion: string) {
  return occasion === "WEDDING" ? "wedding anniversary" : "birthday";
}

async function loadUserName(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string
) {
  const { data } = await supabase
    .from("User")
    .select("fullName")
    .eq("id", userId)
    .maybeSingle();
  return (data?.fullName as string) || "A friend";
}

async function loadCenter(
  supabase: ReturnType<typeof getSupabaseClient>,
  centerId?: string | null
) {
  if (!centerId) return null;
  const { data } = await supabase
    .from("ServiceCenter")
    .select("id, centerName, address, state, lga, status")
    .eq("id", centerId)
    .maybeSingle();
  if (!data || String(data.status).toUpperCase() !== "ACTIVE") return null;
  return data;
}

async function formatInvite(
  c: any,
  supabase: ReturnType<typeof getSupabaseClient>,
  row: any
) {
  const center = await loadCenter(supabase, row.boundCenterId);
  let waitingListName: string | null = null;
  if (row.waitingListId) {
    const { data: group } = await supabase
      .from("Group")
      .select("name")
      .eq("id", row.waitingListId)
      .maybeSingle();
    waitingListName = (group?.name as string) || null;
  }
  return {
    id: row.id,
    token: row.token,
    type: row.type === "CELEBRANT" ? "CELEBRANT" : "SCREEN",
    joinUrl: joinUrlFor(c, row.token),
    waitingListId: row.waitingListId || null,
    waitingListName,
    boundCenter: center
      ? {
          id: center.id,
          centerName: center.centerName,
          state: center.state,
          lga: center.lga,
        }
      : null,
    createdAt: row.createdAt,
  };
}

export async function getBoardingInviteByToken(c: any, token?: string | null) {
  const normalized = String(token || "").trim().toLowerCase();
  if (!normalized) return null;
  const supabase = getSupabaseClient(c);
  const { data } = await supabase
    .from("BoardingInvite")
    .select("*")
    .eq("token", normalized)
    .maybeSingle();
  return data || null;
}

export async function attachBoardingInvite(
  c: any,
  userId: string,
  token?: string | null,
  role: "PATIENT" | "DONOR" = "PATIENT"
) {
  const invite = await getBoardingInviteByToken(c, token);
  if (!invite) return null;
  if (invite.inviterUserId === userId) return invite;

  const expected = role === "DONOR" ? "CELEBRANT" : "SCREEN";
  if (invite.type !== expected) return invite;

  const supabase = getSupabaseClient(c);
  const { data: already } = await supabase
    .from("BoardingInvitee")
    .select("id")
    .eq("inviteId", invite.id)
    .eq("userId", userId)
    .maybeSingle();
  if (!already) {
    await supabase.from("BoardingInvitee").insert({
      id: crypto.randomUUID(),
      inviteId: invite.id,
      userId,
      role,
      joinedAt: new Date().toISOString(),
    });
  }

  if (role === "PATIENT") {
    const { data: profile } = await supabase
      .from("PatientProfile")
      .select("boardingInviteId")
      .eq("userId", userId)
      .maybeSingle();
    if (!profile?.boardingInviteId) {
      await supabase
        .from("PatientProfile")
        .update({ boardingInviteId: invite.id })
        .eq("userId", userId);
    }
  } else {
    const { data: profile } = await supabase
      .from("DonorProfile")
      .select("boardingInviteId, invitedByUserId")
      .eq("userId", userId)
      .maybeSingle();
    const patch: Record<string, string> = {};
    if (!profile?.boardingInviteId) patch.boardingInviteId = invite.id;
    if (!profile?.invitedByUserId) patch.invitedByUserId = invite.inviterUserId;
    if (Object.keys(patch).length) {
      await supabase.from("DonorProfile").update(patch).eq("userId", userId);
    }
  }

  return invite;
}

export async function referralCodeForBoardingInvite(c: any, invite: any) {
  if (!invite?.inviterUserId) return null;
  const agent = await getAgentByUserId(c, invite.inviterUserId);
  return agent?.referralCode || null;
}

boardingApp.get("/join/:token", async (c) => {
  const invite = await getBoardingInviteByToken(c, c.req.param("token"));
  if (!invite) {
    return c.json<TErrorResponse>({ ok: false, error: "Invite not found" }, 404);
  }
  const supabase = getSupabaseClient(c);
  const inviterName = await loadUserName(supabase, invite.inviterUserId);
  const center = await loadCenter(supabase, invite.boundCenterId);
  let waitingListName: string | null = null;
  if (invite.waitingListId) {
    const { data: group } = await supabase
      .from("Group")
      .select("name")
      .eq("id", invite.waitingListId)
      .maybeSingle();
    waitingListName = (group?.name as string) || null;
  }
  const type = invite.type === "CELEBRANT" ? "CELEBRANT" : "SCREEN";
  return c.json({
    ok: true,
    data: {
      token: invite.token,
      type,
      inviterName,
      inviterHospital: center?.centerName || null,
      waitingListName,
      nextPath:
        type === "CELEBRANT"
          ? `/sign-up/donor?invite=${encodeURIComponent(invite.token)}`
          : `/sign-up/patient?invite=${encodeURIComponent(invite.token)}`,
    },
  });
});

boardingApp.get(
  "/mine",
  authMiddleware(["patient", "donor"]),
  async (c) => {
    const userId = c.get("jwtPayload")?.id;
    const supabase = getSupabaseClient(c);
    const { data } = await supabase
      .from("BoardingInvite")
      .select("*")
      .eq("inviterUserId", userId)
      .order("createdAt", { ascending: false });
    const invites = await Promise.all(
      (data || []).map((row) => formatInvite(c, supabase, row))
    );
    return c.json({ ok: true, data: { invites } });
  }
);

boardingApp.post(
  "/invites",
  authMiddleware(["patient", "donor"]),
  zValidator("json", createBoardingInviteSchema, (result) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    const userId = c.get("jwtPayload")?.id as string;
    const { type, waitingListId } = c.req.valid("json");
    const supabase = getSupabaseClient(c);

    let query = supabase
      .from("BoardingInvite")
      .select("*")
      .eq("inviterUserId", userId)
      .eq("type", type);
    if (waitingListId) query = query.eq("waitingListId", waitingListId);
    else query = query.is("waitingListId", null);
    const { data: existing } = await query.limit(1).maybeSingle();

    let boundCenterId: string | null = existing?.boundCenterId || null;
    if (type === "SCREEN") {
      const { data: profile } = await supabase
        .from("PatientProfile")
        .select("assignedCenterId")
        .eq("userId", userId)
        .maybeSingle();
      boundCenterId = profile?.assignedCenterId || boundCenterId;
    }

    if (existing) {
      if (boundCenterId && boundCenterId !== existing.boundCenterId) {
        await supabase
          .from("BoardingInvite")
          .update({ boundCenterId })
          .eq("id", existing.id);
        existing.boundCenterId = boundCenterId;
      }
      return c.json({
        ok: true,
        data: await formatInvite(c, supabase, existing),
      });
    }

    if (waitingListId) {
      const { data: group } = await supabase
        .from("Group")
        .select("id, visibility, ownerDonorId")
        .eq("id", waitingListId)
        .maybeSingle();
      if (!group) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Waiting list not found" },
          404
        );
      }
    }

    const row = {
      id: crypto.randomUUID(),
      token: newToken(),
      type,
      inviterUserId: userId,
      boundCenterId,
      waitingListId: waitingListId || null,
      createdAt: new Date().toISOString(),
    };
    const { data: created, error } = await supabase
      .from("BoardingInvite")
      .insert(row)
      .select("*")
      .single();
    if (error || !created) {
      console.error("[BOARDING] create invite failed:", error?.message);
      return c.json<TErrorResponse>(
        { ok: false, error: "Could not create invite" },
        500
      );
    }
    return c.json(
      { ok: true, data: await formatInvite(c, supabase, created) },
      201
    );
  }
);

boardingApp.get(
  "/invitees",
  authMiddleware(["patient", "donor"]),
  async (c) => {
    const userId = c.get("jwtPayload")?.id;
    const supabase = getSupabaseClient(c);
    const { data: invites } = await supabase
      .from("BoardingInvite")
      .select("id, type")
      .eq("inviterUserId", userId);
    const inviteIds = (invites || []).map((row) => row.id);
    if (inviteIds.length === 0) {
      return c.json({ ok: true, data: { invitees: [] } });
    }
    const typeById = new Map(
      (invites || []).map((row) => [row.id, row.type as string])
    );
    const { data: rows } = await supabase
      .from("BoardingInvitee")
      .select("id, inviteId, userId, role, joinedAt")
      .in("inviteId", inviteIds)
      .order("joinedAt", { ascending: false });

    const userIds = Array.from(
      new Set((rows || []).map((row) => row.userId as string))
    );
    const names = new Map<string, string>();
    if (userIds.length) {
      const { data: users } = await supabase
        .from("User")
        .select("id, fullName")
        .in("id", userIds);
      for (const user of users || []) {
        names.set(user.id, user.fullName);
      }
    }

    return c.json({
      ok: true,
      data: {
        invitees: (rows || []).map((row) => ({
          id: row.id,
          fullName: names.get(row.userId) || "Member",
          role: row.role === "DONOR" ? "DONOR" : "PATIENT",
          joinedAt: row.joinedAt,
          inviteType:
            typeById.get(row.inviteId) === "CELEBRANT" ? "CELEBRANT" : "SCREEN",
        })),
      },
    });
  }
);

boardingApp.get(
  "/facility-options",
  authMiddleware(["patient"]),
  async (c) => {
    const userId = c.get("jwtPayload")?.id as string;
    const db = getDB(c);
    const supabase = getSupabaseClient(c);
    const { data: profile } = await supabase
      .from("PatientProfile")
      .select("state, city, assignedCenterId, facilityChoice, boardingInviteId")
      .eq("userId", userId)
      .maybeSingle();
    if (!profile?.state || !profile?.city) {
      return c.json({
        ok: true,
        data: {
          patientState: profile?.state || "",
          patientLga: profile?.city || "",
          inviterName: null,
          inviterCenter: null,
          hasLocalFacility: false,
          localCenters: [],
          nearestCenters: [],
          facilityChoice: profile?.facilityChoice || null,
        },
      });
    }

    const recommended = await findRecommendedCenters(
      db,
      profile.state,
      profile.city,
      12
    );
    const localCenters = recommended.filter((row) => row.distanceTier === "same_lga");
    const nearestCenters = recommended.filter(
      (row) => row.distanceTier !== "same_lga"
    );

    let inviterName: string | null = null;
    let inviterCenter: (TRecommendedCenter & { isInviterHospital?: boolean }) | null =
      null;
    if (profile.boardingInviteId) {
      const { data: invite } = await supabase
        .from("BoardingInvite")
        .select("inviterUserId, boundCenterId")
        .eq("id", profile.boardingInviteId)
        .maybeSingle();
      if (invite?.inviterUserId) {
        inviterName = await loadUserName(supabase, invite.inviterUserId);
      }
      const bound = recommended.find((row) => row.id === invite?.boundCenterId);
      if (bound && bound.distanceTier === "same_lga") {
        inviterCenter = { ...bound, isInviterHospital: true };
      }
    }

    return c.json({
      ok: true,
      data: {
        patientState: profile.state,
        patientLga: profile.city,
        inviterName,
        inviterCenter,
        hasLocalFacility: localCenters.length > 0,
        localCenters,
        nearestCenters,
        facilityChoice: profile.facilityChoice || null,
      },
    });
  }
);

boardingApp.post(
  "/facility-choice",
  authMiddleware(["patient"]),
  zValidator("json", facilityChoiceSchema, (result) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    const userId = c.get("jwtPayload")?.id as string;
    const { action, centerId, notifyWhenLocal } = c.req.valid("json");
    const supabase = getSupabaseClient(c);
    const { data: profile } = await supabase
      .from("PatientProfile")
      .select("state, city, boardingInviteId")
      .eq("userId", userId)
      .maybeSingle();
    if (!profile?.state || !profile?.city) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Add your location before choosing a facility" },
        400
      );
    }

    if (action === "WAIT") {
      await supabase
        .from("PatientProfile")
        .update({
          facilityChoice: "WAIT",
          wantsLocalFacilityNotify: true,
          assignedCenterId: null,
        })
        .eq("userId", userId);
      await supabase.from("CityFacilityDemand").insert({
        id: crypto.randomUUID(),
        userId,
        state: profile.state,
        lga: profile.city,
        choice: "WAIT",
        createdAt: new Date().toISOString(),
      });
      return c.json({
        ok: true,
        data: {
          assignedCenter: null,
          waitingForCity: true,
          message:
            "You will be notified via WhatsApp and email when a facility opens in your city.",
        },
      });
    }

    let targetCenterId = centerId;
    if (action === "JOIN_INVITER") {
      const { data: invite } = await supabase
        .from("BoardingInvite")
        .select("boundCenterId")
        .eq("id", profile.boardingInviteId)
        .maybeSingle();
      targetCenterId = invite?.boundCenterId;
    }
    if (!targetCenterId) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Please choose a health facility" },
        400
      );
    }

    const assignment = await assignPatientToCenter(c, userId, targetCenterId, {
      skipLocationCheck: action === "JOIN_INVITER",
    });
    if ("error" in assignment) {
      return c.json<TErrorResponse>({ ok: false, error: assignment.error }, 400);
    }

    const otherCity = assignment.center.distanceTier !== "same_lga";
    await supabase
      .from("PatientProfile")
      .update({
        facilityChoice: otherCity ? "OTHER_CITY" : action === "JOIN_INVITER" ? "INVITER" : "NEAREST",
        wantsLocalFacilityNotify: Boolean(otherCity && notifyWhenLocal),
      })
      .eq("userId", userId);

    if (otherCity && notifyWhenLocal) {
      await supabase.from("CityFacilityDemand").insert({
        id: crypto.randomUUID(),
        userId,
        state: profile.state,
        lga: profile.city,
        choice: "OTHER_CITY_NOTIFY",
        assignedCenterId: assignment.center.id,
        createdAt: new Date().toISOString(),
      });
    }

    return c.json({
      ok: true,
      data: {
        assignedCenter: assignment.center,
        waitingForCity: false,
        message: otherCity
          ? notifyWhenLocal
            ? `Joined ${assignment.center.centerName}. We will also tell you when a facility opens in ${profile.city}.`
            : `Joined ${assignment.center.centerName}.`
          : `You have joined ${assignment.center.centerName}.`,
      },
    });
  }
);

boardingApp.post(
  "/videos",
  authMiddleware(["patient", "donor"]),
  zValidator("json", completeBoardingVideosSchema, (result) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    const userId = c.get("jwtPayload")?.id as string;
    const role = actorRole(c);
    const skipped = Boolean(c.req.valid("json").skipped);
    const supabase = getSupabaseClient(c);
    const now = new Date().toISOString();
    const patch = skipped
      ? { boardingVideosSkippedAt: now }
      : { boardingVideosCompletedAt: now };
    const table = role === "DONOR" ? "DonorProfile" : "PatientProfile";
    await supabase.from(table).update(patch).eq("userId", userId);
    return c.json({ ok: true, data: { skipped } });
  }
);

function formatAnniversary(
  c: any,
  ownerName: string,
  celebrantUrl: string,
  row: any
) {
  const days = daysUntil(Number(row.month), Number(row.day));
  const message = [
    `Hello ${row.name},`,
    "",
    `${ownerName} set this up so you can sponsor cancer screening as part of your ${occasionLabel(row.occasion)}.`,
    "",
    "Create your ZeroCancer account, then fund women already waiting or start a waiting list for your celebration:",
    celebrantUrl,
    "",
    "— ZeroCancer",
  ].join("\n");
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    occasion: row.occasion === "WEDDING" ? "WEDDING" : "BIRTHDAY",
    month: Number(row.month),
    day: Number(row.day),
    daysUntil: days,
    dueSoon: days <= 21,
    inviteUrl: celebrantUrl,
    whatsappMessage: message,
  };
}

async function celebrantUrlForOwner(c: any, userId: string) {
  const supabase = getSupabaseClient(c);
  const { data: existing } = await supabase
    .from("BoardingInvite")
    .select("*")
    .eq("inviterUserId", userId)
    .eq("type", "CELEBRANT")
    .is("waitingListId", null)
    .limit(1)
    .maybeSingle();
  if (existing?.token) return joinUrlFor(c, existing.token);
  const row = {
    id: crypto.randomUUID(),
    token: newToken(),
    type: "CELEBRANT",
    inviterUserId: userId,
    boundCenterId: null,
    waitingListId: null,
    createdAt: new Date().toISOString(),
  };
  await supabase.from("BoardingInvite").insert(row);
  return joinUrlFor(c, row.token);
}

boardingApp.get(
  "/anniversaries",
  authMiddleware(["patient", "donor"]),
  async (c) => {
    const userId = c.get("jwtPayload")?.id as string;
    const supabase = getSupabaseClient(c);
    const ownerName = await loadUserName(supabase, userId);
    const url = await celebrantUrlForOwner(c, userId);
    const { data } = await supabase
      .from("AnniversaryContact")
      .select("*")
      .eq("ownerUserId", userId)
      .order("createdAt", { ascending: false });
    return c.json({
      ok: true,
      data: {
        contacts: (data || []).map((row) =>
          formatAnniversary(c, ownerName, url, row)
        ),
      },
    });
  }
);

boardingApp.post(
  "/anniversaries",
  authMiddleware(["patient", "donor"]),
  zValidator("json", createAnniversaryContactSchema, (result) => {
    if (!result.success) throw new HTTPException(400, { cause: result.error });
  }),
  async (c) => {
    const userId = c.get("jwtPayload")?.id as string;
    const body = c.req.valid("json");
    const supabase = getSupabaseClient(c);
    const row = {
      id: crypto.randomUUID(),
      ownerUserId: userId,
      name: body.name,
      phone: body.phone,
      occasion: body.occasion,
      month: body.month,
      day: body.day,
      createdAt: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("AnniversaryContact")
      .insert(row)
      .select("*")
      .single();
    if (error || !data) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Could not save this date" },
        500
      );
    }
    const ownerName = await loadUserName(supabase, userId);
    const url = await celebrantUrlForOwner(c, userId);
    return c.json(
      {
        ok: true,
        data: formatAnniversary(c, ownerName, url, data),
      },
      201
    );
  }
);

boardingApp.delete(
  "/anniversaries/:id",
  authMiddleware(["patient", "donor"]),
  async (c) => {
    const userId = c.get("jwtPayload")?.id as string;
    const supabase = getSupabaseClient(c);
    await supabase
      .from("AnniversaryContact")
      .delete()
      .eq("id", c.req.param("id"))
      .eq("ownerUserId", userId);
    return c.json({ ok: true, data: { deleted: true } });
  }
);
