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

export const referralsApp = new Hono<THonoApp>();

// GET /api/v1/referrals/lookup/:code — public
referralsApp.get("/lookup/:code", async (c) => {
  const code = c.req.param("code");
  const supabase = getSupabaseClient(c);
  const normalized = code.trim().toUpperCase();

  const staffHit = await getStaffByReferralCode(c, normalized);
  if (staffHit?.staff) {
    const staffName =
      staffHit.staff.fullName ||
      String(staffHit.staff.email || "").split("@")[0] ||
      "A ZeroCancer nurse";
    return c.json({
      ok: true,
      data: {
        type: "nurse",
        code: staffHit.referral?.inviteCode || staffHit.staff.referralCode,
        status: staffHit.referral?.status || "ACTIVE",
        referrerName: staffName,
        boundCenter: null,
        screenAnywhere: true,
      },
    });
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
    return c.json({
      ok: true,
      data: {
        type: "invite",
        code: invite.inviteCode,
        status: invite.status,
        referrerName,
        agentCode: agent?.referralCode,
        boundCenter: serializeBoundCenter(
          await getReferrerBoundCenter(c, invite.referrerAgentId)
        ),
      },
    });
  }

  const agent = await getAgentByCode(c, normalized);
  if (!agent) {
    return c.json<TErrorResponse>({ ok: false, error: "Invalid code" }, 404);
  }
  const { data: user } = await supabase
    .from("User")
    .select("fullName")
    .eq("id", agent.userId)
    .single();

  return c.json({
    ok: true,
    data: {
      type: "agent",
      code: agent.referralCode,
      referrerName: user?.fullName || "A ZeroCancer agent",
      agentCode: agent.referralCode,
      boundCenter: serializeBoundCenter(await getReferrerBoundCenter(c, agent.id)),
    },
  });
});

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
