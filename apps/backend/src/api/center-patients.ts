import { zValidator } from "@hono/zod-validator";
import {
  centerEnrollWaitlistSchema,
  centerRegisterPatientSchema,
} from "@zerocancer/shared/schemas/screening-report.schema";
import type { TErrorResponse } from "@zerocancer/shared/types";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { getDB } from "../lib/db";
import { getSupabaseClient } from "../lib/supabase";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";
import { isLikelyValidWhatsappNumber, normalizeWhatsappNumber } from "../lib/phone";
import { getUserWithProfiles, triggerWaitlistMatching } from "../lib/utils";
import { z } from "zod";

export const centerPatientsApp = new Hono<THonoApp>();

centerPatientsApp.use("*", authMiddleware(["center", "center_staff"]));

async function enrollPatientInWaitlist(
  c: any,
  params: {
    patientId: string;
    screeningTypeId: string;
    centerId: string;
  }
) {
  const db = getDB(c);

  const screeningType = await db.screeningType.findUnique({
    where: { id: params.screeningTypeId },
  });
  if (!screeningType) {
    return { error: "Screening type not found" as const };
  }

  const existingWaitlist = await db.waitlist.findFirst({
    where: {
      patientId: params.patientId,
      screeningTypeId: params.screeningTypeId,
      status: { in: ["PENDING", "MATCHED"] },
    },
  });

  if (existingWaitlist) {
    return { waitlist: existingWaitlist, created: false };
  }

  const waitlist = await db.waitlist.create({
    data: {
      patientId: params.patientId,
      screeningTypeId: params.screeningTypeId,
      status: "PENDING",
      enrolledByCenterId: params.centerId,
    },
    include: { screening: true },
  });

  const profile = await db.patientProfile.findUnique({
    where: { userId: params.patientId },
  });
  if (profile && !profile.assignedCenterId) {
    await db.patientProfile.update({
      where: { userId: params.patientId },
      data: { assignedCenterId: params.centerId },
    });
  }

  try {
    await triggerWaitlistMatching(c);
  } catch (error) {
    console.error("Waitlist matching trigger failed after center enrollment:", error);
  }

  return { waitlist, created: true };
}

// POST /api/center/patients/register-and-enroll
centerPatientsApp.post(
  "/register-and-enroll",
  zValidator("json", centerRegisterPatientSchema),
  async (c) => {
    try {
      const db = getDB(c);
      const centerId = c.get("jwtPayload")?.id as string;
      const data = c.req.valid("json");

      if (!isLikelyValidWhatsappNumber(data.whatsappNumber)) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Enter a valid WhatsApp number in international format (e.g. +2348000000000)",
          },
          400
        );
      }

      const normalizedWhatsapp = normalizeWhatsappNumber(data.whatsappNumber);

      const [userResult, existingCenter] = await Promise.all([
        getUserWithProfiles(c, { email: data.email }),
        db.serviceCenter.findUnique({ where: { email: data.email } }),
      ]);

      if (existingCenter) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Email already registered to a center" },
          409
        );
      }

      let patientId: string;
      let fullName: string;
      let email: string;
      let whatsappNumber: string;

      const { user: existingUser, profiles } = userResult;

      if (existingUser && profiles.includes("PATIENT")) {
        patientId = existingUser.id;
        fullName = existingUser.fullName;
        email = existingUser.email;
        whatsappNumber = normalizedWhatsapp;

        await db.user.update({
          where: { id: existingUser.id },
          data: { phone: normalizedWhatsapp },
        });

        await db.patientProfile
          .update({
            where: { userId: existingUser.id },
            data: { emailVerified: new Date() },
          })
          .catch(() => undefined);
      } else if (existingUser) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Email already registered with another profile type" },
          409
        );
      } else {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const patient = await db.user.create({
          data: {
            fullName: data.fullName,
            email: data.email,
            phone: normalizedWhatsapp,
            passwordHash: hashedPassword,
            patientProfile: {
              create: {
                gender: data.gender,
                dateOfBirth: data.dateOfBirth,
                city: data.localGovernment,
                state: data.state,
                emailVerified: new Date(),
              },
            },
          },
          include: { patientProfile: true },
        });

        patientId = patient.id;
        fullName = patient.fullName;
        email = patient.email;
        whatsappNumber = normalizedWhatsapp;
      }

      const enrollment = await enrollPatientInWaitlist(c, {
        patientId,
        screeningTypeId: data.screeningTypeId,
        centerId,
      });

      if ("error" in enrollment && enrollment.error) {
        return c.json<TErrorResponse>({ ok: false, error: enrollment.error }, 404);
      }

      return c.json(
        {
          ok: true,
          data: {
            patient: {
              id: patientId,
              fullName,
              email,
              whatsappNumber,
            },
            waitlist: enrollment.waitlist,
            waitlistCreated: enrollment.created,
          },
        },
        201
      );
    } catch (error) {
      console.error("Center register-and-enroll error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to register patient and enroll in waitlist" },
        500
      );
    }
  }
);

// GET /api/center/patients/overview — assigned patients + waitlist summary for this center
centerPatientsApp.get("/overview", async (c) => {
  try {
    const centerId = c.get("jwtPayload")?.id as string;
    const supabase = getSupabaseClient(c);

    const [
      { data: assignedProfiles, error: profilesError },
      { count: assignedPatientCount, error: assignedError },
    ] = await Promise.all([
      supabase
        .from("PatientProfile")
        .select("userId, city, state, assignedCenterId")
        .eq("assignedCenterId", centerId)
        .order("userId", { ascending: false })
        .limit(8),
      supabase
        .from("PatientProfile")
        .select("*", { count: "exact", head: true })
        .eq("assignedCenterId", centerId),
    ]);

    if (assignedError) throw assignedError;
    if (profilesError) throw profilesError;

    const { data: allAssignedRows, error: allAssignedError } = await supabase
      .from("PatientProfile")
      .select("userId")
      .eq("assignedCenterId", centerId);

    if (allAssignedError) throw allAssignedError;

    const allAssignedPatientIds = (allAssignedRows || []).map(
      (row) => row.userId as string
    );

    let waitlists: Array<{
      id: string;
      status: string;
      screeningTypeId: string;
      patientId: string;
      joinedAt: string;
    }> = [];

    const { data: centerWaitlists, error: waitlistError } = await supabase
      .from("Waitlist")
      .select("id, status, screeningTypeId, patientId, joinedAt")
      .eq("enrolledByCenterId", centerId)
      .in("status", ["PENDING", "MATCHED"]);

    if (waitlistError) throw waitlistError;
    waitlists = centerWaitlists || [];

    if (allAssignedPatientIds.length > 0) {
      const { data: assignedWaitlists, error: assignedWaitlistError } =
        await supabase
          .from("Waitlist")
          .select("id, status, screeningTypeId, patientId, joinedAt")
          .in("patientId", allAssignedPatientIds)
          .in("status", ["PENDING", "MATCHED"]);

      if (assignedWaitlistError) throw assignedWaitlistError;

      const seen = new Set(waitlists.map((row) => row.id));
      for (const row of assignedWaitlists || []) {
        if (!seen.has(row.id as string)) {
          waitlists.push(row as typeof waitlists[number]);
        }
      }
    }

    const screeningTypeIds = [
      ...new Set((waitlists || []).map((row) => row.screeningTypeId as string)),
    ];
    const patientIds = [
      ...new Set((assignedProfiles || []).map((row) => row.userId as string)),
    ];

    const [{ data: screeningTypes }, { data: users }] = await Promise.all([
      screeningTypeIds.length
        ? supabase.from("ScreeningType").select("id, name").in("id", screeningTypeIds)
        : Promise.resolve({ data: [] }),
      patientIds.length
        ? supabase
            .from("User")
            .select("id, fullName, email, phone")
            .in("id", patientIds)
        : Promise.resolve({ data: [] }),
    ]);

    const screeningNameById = new Map(
      (screeningTypes || []).map((row) => [row.id as string, row.name as string])
    );
    const userById = new Map(
      (users || []).map((row) => [row.id as string, row])
    );

    const waitlistByScreening = new Map<
      string,
      { screeningTypeId: string; name: string; pending: number; matched: number }
    >();

    for (const row of waitlists || []) {
      const screeningTypeId = row.screeningTypeId as string;
      const current = waitlistByScreening.get(screeningTypeId) || {
        screeningTypeId,
        name: screeningNameById.get(screeningTypeId) || "Unknown screening",
        pending: 0,
        matched: 0,
      };
      if (row.status === "MATCHED") current.matched += 1;
      else current.pending += 1;
      waitlistByScreening.set(screeningTypeId, current);
    }

    const waitlistSummary = [...waitlistByScreening.values()].sort(
      (a, b) => b.pending + b.matched - (a.pending + a.matched)
    );

    const recentPatients = (assignedProfiles || []).map((profile) => {
      const user = userById.get(profile.userId as string);
      const patientWaitlists = (waitlists || []).filter(
        (row) => row.patientId === profile.userId
      );
      return {
        id: profile.userId as string,
        fullName: user?.fullName || "Patient",
        email: user?.email || "",
        phone: user?.phone || "",
        state: profile.state as string | null,
        city: profile.city as string | null,
        waitlistCount: patientWaitlists.length,
        pendingCount: patientWaitlists.filter((row) => row.status === "PENDING").length,
        matchedCount: patientWaitlists.filter((row) => row.status === "MATCHED").length,
      };
    });

    return c.json({
      ok: true,
      data: {
        assignedPatientCount: assignedPatientCount || 0,
        totalWaitlistEntries: waitlists?.length || 0,
        pendingWaitlistEntries: (waitlists || []).filter(
          (row) => row.status === "PENDING"
        ).length,
        matchedWaitlistEntries: (waitlists || []).filter(
          (row) => row.status === "MATCHED"
        ).length,
        waitlistSummary,
        recentPatients,
      },
    });
  } catch (error) {
    console.error("Center patients overview error:", error);
    return c.json<TErrorResponse>(
      { ok: false, error: "Failed to load center patient overview" },
      500
    );
  }
});

// GET /api/center/patients/search?q= — find existing patients to enroll on waitlist
centerPatientsApp.get(
  "/search",
  zValidator(
    "query",
    z.object({ q: z.string().min(2, "Enter at least 2 characters") })
  ),
  async (c) => {
    const { q } = c.req.valid("query");
    const supabase = getSupabaseClient(c);
    const term = q.trim();

    const { data: users, error } = await supabase
      .from("User")
      .select("id, fullName, email, phone")
      .or(`fullName.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(25);

    if (error) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to search patients" },
        500
      );
    }

    const userIds = (users || []).map((u) => u.id);
    if (userIds.length === 0) {
      return c.json({ ok: true, data: { patients: [] } });
    }

    const { data: profiles } = await supabase
      .from("PatientProfile")
      .select("userId")
      .in("userId", userIds);

    const patientIds = new Set((profiles || []).map((p) => p.userId));

    return c.json({
      ok: true,
      data: {
        patients: (users || [])
          .filter((u) => patientIds.has(u.id))
          .map((u) => ({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
          })),
      },
    });
  }
);

// POST /api/center/patients/enroll-waitlist — enroll an existing patient
centerPatientsApp.post(
  "/enroll-waitlist",
  zValidator("json", centerEnrollWaitlistSchema),
  async (c) => {
    try {
      const db = getDB(c);
      const centerId = c.get("jwtPayload")?.id as string;
      const { patientId, screeningTypeId } = c.req.valid("json");

      const patient = await db.user.findUnique({ where: { id: patientId } });
      if (!patient) {
        return c.json<TErrorResponse>({ ok: false, error: "Patient not found" }, 404);
      }

      const profile = await db.patientProfile.findUnique({
        where: { userId: patientId },
      });
      if (!profile) {
        return c.json<TErrorResponse>(
          { ok: false, error: "User is not registered as a patient" },
          400
        );
      }

      const enrollment = await enrollPatientInWaitlist(c, {
        patientId,
        screeningTypeId,
        centerId,
      });

      if ("error" in enrollment && enrollment.error) {
        return c.json<TErrorResponse>({ ok: false, error: enrollment.error }, 404);
      }

      return c.json({
        ok: true,
        data: {
          patient: {
            id: patient.id,
            fullName: patient.fullName,
            email: patient.email,
            phone: patient.phone,
          },
          waitlist: enrollment.waitlist,
          waitlistCreated: enrollment.created,
        },
      });
    } catch (error) {
      console.error("Center enroll-waitlist error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to enroll patient in waitlist" },
        500
      );
    }
  }
);
