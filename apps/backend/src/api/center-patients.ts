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
import { getUserWithProfiles } from "../lib/utils";
import {
  createCenterEnrollmentRequest,
  enrollPatientInWaitlist,
  expireStaleEnrollmentRequests,
  formatEnrollmentRequestForApi,
} from "../lib/center-enrollment-utils";
import { z } from "zod";

export const centerPatientsApp = new Hono<THonoApp>();

centerPatientsApp.use("*", authMiddleware(["center", "center_staff"]));

function isPhoneSearchTerm(term: string) {
  const digits = term.replace(/\D/g, "");
  return digits.length >= 4 && digits.length >= term.replace(/\s/g, "").length * 0.5;
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
      let isNewPatient = false;

      const { user: existingUser, profiles } = userResult;

      if (existingUser && profiles.includes("PATIENT")) {
        patientId = existingUser.id;
        fullName = existingUser.fullName;
        email = existingUser.email;
        whatsappNumber = normalizedWhatsapp;

        await db.patientProfile
          .update({
            where: { userId: existingUser.id },
            data: { emailVerified: new Date() },
          })
          .catch(() => undefined);

        const enrollmentRequest = await createCenterEnrollmentRequest(c, {
          patientId,
          centerId,
          screeningTypeId: data.screeningTypeId,
          message: `${fullName} was registered at your center for screening.`,
        });

        if ("error" in enrollmentRequest && enrollmentRequest.error) {
          return c.json<TErrorResponse>(
            { ok: false, error: enrollmentRequest.error },
            400
          );
        }

        const screeningType = await db.screeningType.findUnique({
          where: { id: data.screeningTypeId },
        });

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
              pendingApproval: true,
              requestId: enrollmentRequest.request.id,
              requestCreated: enrollmentRequest.created,
              isNewPatient: false,
              screeningName: screeningType?.name,
            },
          },
          201
        );
      } else if (existingUser) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Email already registered with another profile type" },
          409
        );
      } else {
        isNewPatient = true;
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
                mustChangePassword: true,
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

      const screeningName =
        (enrollment.waitlist as { screening?: { name?: string } } | undefined)
          ?.screening?.name || undefined;

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
            isNewPatient,
            screeningName,
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

// GET /api/center/patients — paginated list of patients assigned to this center
centerPatientsApp.get(
  "/",
  zValidator(
    "query",
    z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
      search: z.string().optional(),
    })
  ),
  async (c) => {
    try {
      const centerId = c.get("jwtPayload")?.id as string;
      const { page, pageSize, search } = c.req.valid("query");
      const supabase = getSupabaseClient(c);

      const { data: assignedRows, error: assignedError } = await supabase
        .from("PatientProfile")
        .select("userId, city, state")
        .eq("assignedCenterId", centerId);

      if (assignedError) throw assignedError;

      const assignedIds = (assignedRows || []).map((row) => row.userId as string);
      if (assignedIds.length === 0) {
        return c.json({
          ok: true,
          data: {
            patients: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          },
        });
      }

      let usersQuery = supabase
        .from("User")
        .select("id, fullName, email, phone")
        .in("id", assignedIds);

      const term = search?.trim();
      if (term) {
        const phoneFilter = buildPhoneSearchFilter(term);
        if (isPhoneSearchTerm(term) && phoneFilter) {
          usersQuery = usersQuery.or(phoneFilter);
        } else {
          usersQuery = usersQuery.ilike("fullName", `%${term}%`);
        }
      }

      const { data: users, error: usersError } = await usersQuery;
      if (usersError) throw usersError;

      const profileByUserId = new Map(
        (assignedRows || []).map((row) => [row.userId as string, row])
      );

      const matchedUsers = (users || []).filter((user) =>
        profileByUserId.has(user.id as string)
      );

      const patientIds = matchedUsers.map((user) => user.id as string);

      const { data: waitlists, error: waitlistError } = patientIds.length
        ? await supabase
            .from("Waitlist")
            .select("id, status, patientId, screeningTypeId")
            .in("patientId", patientIds)
            .in("status", ["PENDING", "MATCHED"])
        : { data: [], error: null };

      if (waitlistError) throw waitlistError;

      const patients = matchedUsers
        .map((user) => {
          const profile = profileByUserId.get(user.id as string);
          const patientWaitlists = (waitlists || []).filter(
            (row) => row.patientId === user.id
          );
          return {
            id: user.id as string,
            fullName: (user.fullName as string) || "Patient",
            email: (user.email as string) || "",
            phone: (user.phone as string) || "",
            state: (profile?.state as string | null) || null,
            city: (profile?.city as string | null) || null,
            waitlistCount: patientWaitlists.length,
            pendingCount: patientWaitlists.filter((row) => row.status === "PENDING")
              .length,
            matchedCount: patientWaitlists.filter((row) => row.status === "MATCHED")
              .length,
          };
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      const total = patients.length;
      const start = (page - 1) * pageSize;
      const paged = patients.slice(start, start + pageSize);

      return c.json({
        ok: true,
        data: {
          patients: paged,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 0,
        },
      });
    } catch (error) {
      console.error("Center patients list error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to load center patients" },
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
    const db = getDB(c);

    await expireStaleEnrollmentRequests(c, { centerId });

    const pendingEnrollmentRequestCount = await db.centerEnrollmentRequest.count({
      where: { centerId, status: "PENDING" },
    });

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
        pendingEnrollmentRequestCount,
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

function buildPhoneSearchFilter(term: string) {
  const digits = term.replace(/\D/g, "");
  const normalized = normalizeWhatsappNumber(term);
  const variants = new Set<string>();

  if (digits) variants.add(digits);
  if (normalized) {
    variants.add(normalized);
    variants.add(normalized.replace("+", ""));
  }
  if (digits.startsWith("234") && digits.length > 3) {
    variants.add(`0${digits.slice(3)}`);
  } else if (digits.startsWith("0")) {
    variants.add(`234${digits.slice(1)}`);
    variants.add(`+234${digits.slice(1)}`);
  }

  return [...variants]
    .filter((value) => value.length >= 4)
    .map((value) => `phone.ilike.%${value}%`)
    .join(",");
}

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

    const phoneFilter = buildPhoneSearchFilter(term);
    const looksLikeEmail = term.includes("@");
    let usersQuery;

    if (isPhoneSearchTerm(term) && phoneFilter) {
      usersQuery = supabase
        .from("User")
        .select("id, fullName, email, phone")
        .or(phoneFilter)
        .limit(25);
    } else if (looksLikeEmail) {
      usersQuery = supabase
        .from("User")
        .select("id, fullName, email, phone")
        .ilike("email", term.trim().toLowerCase())
        .limit(10);
    } else {
      // Name search is intentionally limited to reduce cross-center PII exposure
      usersQuery = supabase
        .from("User")
        .select("id, fullName, email, phone")
        .ilike("fullName", `%${term}%`)
        .limit(10);
    }

    const { data: users, error } = await usersQuery;

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

// GET /api/center/patients/enrollment-requests
centerPatientsApp.get("/enrollment-requests", async (c) => {
  try {
    const db = getDB(c);
    const centerId = c.get("jwtPayload")?.id as string;
    const status = c.req.query("status") || "PENDING";

    await expireStaleEnrollmentRequests(c, { centerId });

    const requests = await db.centerEnrollmentRequest.findMany({
      where: { centerId, status },
      orderBy: { requestedAt: "desc" },
      include: {
        patient: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        screeningType: {
          select: { id: true, name: true },
        },
      },
    });

    return c.json({
      ok: true,
      data: {
        requests: requests.map((request) => formatEnrollmentRequestForApi(request)),
      },
    });
  } catch (error) {
    console.error("Center enrollment requests error:", error);
    return c.json<TErrorResponse>(
      { ok: false, error: "Failed to load enrollment requests" },
      500
    );
  }
});

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

      const enrollmentRequest = await createCenterEnrollmentRequest(c, {
        patientId,
        centerId,
        screeningTypeId,
      });

      if ("error" in enrollmentRequest && enrollmentRequest.error) {
        return c.json<TErrorResponse>(
          { ok: false, error: enrollmentRequest.error },
          400
        );
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
          pendingApproval: true,
          requestId: enrollmentRequest.request.id,
          requestCreated: enrollmentRequest.created,
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
