import { zValidator } from "@hono/zod-validator";
import type { TErrorResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import { z } from "zod";
import {
  acceptReferralInvite,
  getAgentByCode,
  getReferrerBoundCenter,
  updateReferralConsent,
} from "../lib/agent.service";
import { getCenterAvailability } from "../lib/center-availability";
import {
  findRecommendedCenters,
  pickAutoAssignedCenter,
} from "../lib/patient-center-utils";
import { getDB } from "../lib/db";
import { getStaffByReferralCode } from "../lib/staff-referral.service";
import { getSupabaseClient } from "../lib/supabase";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

function serializeBoundCenter(center: any) {
  if (!center) return null;
  return {
    id: center.id,
    centerName: center.centerName,
    address: center.address,
    state: center.state,
    lga: center.lga,
  };
}

async function loadCenterOffer(c: any, centerId: string) {
  const db = getDB(c);
  const center = await db.serviceCenter.findUnique({
    where: { id: centerId },
  });
  if (!center || String(center.status || "").toUpperCase() !== "ACTIVE") {
    return null;
  }

  const links = await db.serviceCenterScreeningType.findMany({
    where: { centerId },
    include: {
      screeningType: {
        select: {
          id: true,
          name: true,
          description: true,
          agreedPrice: true,
          active: true,
        },
      },
    },
  });

  const services = links
    .filter((link: any) => link.screeningType?.active !== false)
    .map((link: any) => ({
      screeningTypeId: link.screeningTypeId,
      name: link.screeningType?.name || "",
      description: link.screeningType?.description || null,
      price: Number(link.amount || link.screeningType?.agreedPrice || 0),
      agreedPrice: Number(link.screeningType?.agreedPrice || 0),
    }))
    .filter((service: any) => service.name);

  const today = new Date();
  const from = today.toISOString().slice(0, 10);
  const toDate = new Date(today);
  toDate.setDate(toDate.getDate() + 21);
  const to = toDate.toISOString().slice(0, 10);

  let nextOpenDays: Array<{ date: string; slotsAvailable: number }> = [];
  try {
    const availability = await getCenterAvailability(c, centerId, { from, to });
    nextOpenDays = (availability.days || [])
      .filter((day: any) => day.isOpen)
      .map((day: any) => {
        const slotsAvailable = (day.slots || []).reduce(
          (sum: number, slot: any) => sum + Number(slot.remaining || 0),
          0
        );
        return { date: day.date as string, slotsAvailable };
      })
      .filter((day) => day.slotsAvailable > 0)
      .slice(0, 7);
  } catch {
    nextOpenDays = [];
  }

  return {
    id: center.id,
    centerName: center.centerName,
    address: center.address,
    state: center.state,
    lga: center.lga,
    services,
    nextOpenDays,
  };
}

async function resolveReferralMeta(c: any, code: string) {
  const supabase = getSupabaseClient(c);
  const normalized = code.trim().toUpperCase();

  const staffHit = await getStaffByReferralCode(c, normalized);
  if (staffHit?.staff) {
    const staffName =
      staffHit.staff.fullName ||
      String(staffHit.staff.email || "").split("@")[0] ||
      "A ZeroCancer nurse";
    const centerId =
      staffHit.staff.centerId ||
      (staffHit.staff as any)?.center?.id ||
      null;
    return {
      type: "nurse" as const,
      code: staffHit.referral?.inviteCode || staffHit.staff.referralCode,
      status: staffHit.referral?.status || "ACTIVE",
      referrerName: staffName,
      boundCenterId: centerId as string | null,
      screenAnywhere: true,
    };
  }

  const { data: invite } = await supabase
    .from("Referral")
    .select("id, inviteCode, inviteName, status, referrerAgentId")
    .eq("inviteCode", normalized)
    .maybeSingle();

  if (invite) {
    const { data: agent } = await supabase
      .from("AgentProfile")
      .select("referralCode, userId")
      .eq("id", invite.referrerAgentId)
      .single();
    let referrerName = "A ZeroCancer agent";
    if (agent?.userId) {
      const { data: user } = await supabase
        .from("User")
        .select("fullName")
        .eq("id", agent.userId)
        .single();
      if (user?.fullName) referrerName = user.fullName;
    }
    const bound = await getReferrerBoundCenter(c, invite.referrerAgentId);
    return {
      type: "invite" as const,
      code: invite.inviteCode,
      status: invite.status,
      referrerName,
      agentCode: agent?.referralCode,
      boundCenterId: bound?.id || null,
      screenAnywhere: false,
    };
  }

  const agent = await getAgentByCode(c, normalized);
  if (!agent) return null;
  const { data: user } = await supabase
    .from("User")
    .select("fullName")
    .eq("id", agent.userId)
    .single();
  const bound = await getReferrerBoundCenter(c, agent.id);
  return {
    type: "agent" as const,
    code: agent.referralCode,
    referrerName: user?.fullName || "A ZeroCancer agent",
    agentCode: agent.referralCode,
    boundCenterId: bound?.id || null,
    screenAnywhere: false,
  };
}

export const referralsApp = new Hono<THonoApp>();

// GET /api/v1/referrals/lookup/:code — public
referralsApp.get("/lookup/:code", async (c) => {
  const code = c.req.param("code");
  const meta = await resolveReferralMeta(c, code);
  if (!meta) {
    return c.json<TErrorResponse>({ ok: false, error: "Invalid code" }, 404);
  }

  const boundOffer = meta.boundCenterId
    ? await loadCenterOffer(c, meta.boundCenterId)
    : null;

  return c.json({
    ok: true,
    data: {
      type: meta.type,
      code: meta.code,
      status: (meta as any).status,
      referrerName: meta.referrerName,
      agentCode: (meta as any).agentCode,
      screenAnywhere: meta.screenAnywhere,
      boundCenter: boundOffer
        ? {
            id: boundOffer.id,
            centerName: boundOffer.centerName,
            address: boundOffer.address,
            state: boundOffer.state,
            lga: boundOffer.lga,
          }
        : meta.boundCenterId
          ? serializeBoundCenter(
              await getDB(c).serviceCenter.findUnique({
                where: { id: meta.boundCenterId },
              })
            )
          : null,
      services: boundOffer?.services || [],
      nextOpenDays: boundOffer?.nextOpenDays || [],
    },
  });
});

const offerQuerySchema = z.object({
  code: z.string().min(2),
  state: z.string().optional(),
  lga: z.string().optional(),
  centerId: z.string().uuid().optional(),
});

// GET /api/v1/referrals/offer — public: resolve facility + facility prices for a referral
referralsApp.get(
  "/offer",
  zValidator("query", offerQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const { code, state, lga, centerId } = c.req.valid("query");
    const meta = await resolveReferralMeta(c, code);
    if (!meta) {
      return c.json<TErrorResponse>({ ok: false, error: "Invalid code" }, 404);
    }

    const db = getDB(c);
    let selectedCenterId = centerId || null;
    let distanceTier: string | null = null;
    let alternatives: Array<{
      id: string;
      centerName: string;
      state: string;
      lga: string;
      distanceTier: string;
    }> = [];

    if (!selectedCenterId && state && lga) {
      const recommended = await findRecommendedCenters(db, state, lga, 8);
      alternatives = recommended.map((row) => ({
        id: row.id,
        centerName: row.centerName,
        state: row.state,
        lga: row.lga,
        distanceTier: row.distanceTier,
      }));
      const preferred =
        meta.boundCenterId &&
        recommended.find((row) => row.id === meta.boundCenterId);
      if (preferred) {
        selectedCenterId = preferred.id;
        distanceTier = preferred.distanceTier;
      } else {
        const nearest = pickAutoAssignedCenter(recommended);
        selectedCenterId = nearest?.id || null;
        distanceTier = nearest?.distanceTier || null;
      }
    }

    if (!selectedCenterId && meta.boundCenterId) {
      selectedCenterId = meta.boundCenterId;
      distanceTier = "referrer_facility";
    }

    const offer = selectedCenterId
      ? await loadCenterOffer(c, selectedCenterId)
      : null;

    return c.json({
      ok: true,
      data: {
        type: meta.type,
        code: meta.code,
        referrerName: meta.referrerName,
        screenAnywhere: meta.screenAnywhere,
        boundCenterId: meta.boundCenterId,
        usingNearest:
          Boolean(state && lga) &&
          Boolean(selectedCenterId) &&
          selectedCenterId !== meta.boundCenterId,
        distanceTier,
        center: offer,
        alternatives,
      },
    });
  }
);

const acceptSchema = z.object({
  code: z.string().min(4),
  commissionAllowed: z.boolean().optional(),
  preferredCenterId: z.string().uuid().optional().nullable(),
});

// POST /api/v1/referrals/accept — patient
referralsApp.post(
  "/accept",
  authMiddleware(["patient"]),
  zValidator("json", acceptSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const userId = c.get("jwtPayload")?.id as string;
      const body = c.req.valid("json");
      const staffHit = await getStaffByReferralCode(c, body.code);
      if (staffHit?.staff) {
        const { acceptStaffReferral } = await import(
          "../lib/staff-referral.service"
        );
        const referral = await acceptStaffReferral(c, userId, body.code, {
          commissionAllowed: body.commissionAllowed,
        });
        return c.json({ ok: true, data: referral });
      }
      const referral = await acceptReferralInvite(c, userId, body.code, {
        commissionAllowed: body.commissionAllowed,
        preferredCenterId: body.preferredCenterId,
      });
      return c.json({ ok: true, data: referral });
    } catch (error: any) {
      return c.json<TErrorResponse>(
        { ok: false, error: error?.message || "Could not accept referral" },
        400
      );
    }
  }
);

const consentSchema = z.object({
  commissionAllowed: z.boolean(),
  preferredCenterId: z.string().uuid().optional().nullable(),
});

// PATCH /api/v1/referrals/consent — point 11
referralsApp.patch(
  "/consent",
  authMiddleware(["patient"]),
  zValidator("json", consentSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    try {
      const userId = c.get("jwtPayload")?.id as string;
      const body = c.req.valid("json");
      const updated = await updateReferralConsent(c, userId, body);
      return c.json({
        ok: true,
        data: updated,
        message: "Referral preferences saved",
      });
    } catch (error: any) {
      return c.json<TErrorResponse>(
        { ok: false, error: error?.message || "Could not update consent" },
        400
      );
    }
  }
);

// GET /api/v1/referrals/mine — patient view of who referred them
referralsApp.get("/mine", authMiddleware(["patient"]), async (c) => {
  const supabase = getSupabaseClient(c);
  const userId = c.get("jwtPayload")?.id as string;

  const { data: referral } = await supabase
    .from("Referral")
    .select("*")
    .eq("referredUserId", userId)
    .order("acceptedAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: staffReferral } = await supabase
    .from("StaffReferral")
    .select("id, staffId, inviteCode, status, commissionAllowed, acceptedAt")
    .eq("referredUserId", userId)
    .order("acceptedAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("PatientProfile")
    .select("referralCodeUsed, commissionConsent, assignedCenterId")
    .eq("userId", userId)
    .maybeSingle();

  return c.json({
    ok: true,
    data: { referral, staffReferral, profile },
  });
});
