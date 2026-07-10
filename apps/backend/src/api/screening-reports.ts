import { zValidator } from "@hono/zod-validator";
import {
  createScreeningReportSchema,
  saveScreeningReportPdfSchema,
  sendScreeningReportSchema,
} from "@zerocancer/shared/schemas/screening-report.schema";
import type { TErrorResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { getDB } from "../lib/db";
import { generateReportAccessToken } from "../lib/report-access";
import { buildReportHtml } from "../lib/report-html";
import {
  getReportTemplate,
  REPORT_TAXONOMY,
} from "../lib/report-templates";
import { formatStaffLabel, resolveSignedByName } from "../lib/report-utils";
import { getSupabaseClient } from "../lib/supabase";
import { isLikelyValidWhatsappNumber, normalizeWhatsappNumber } from "../lib/phone";
import { THonoApp, TEnvs } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";
import { WhatsAppService } from "../lib/whatsapp";

export const screeningReportsApp = new Hono<THonoApp>();

screeningReportsApp.use("*", authMiddleware(["center", "center_staff"]));

async function getCenterId(c: any) {
  return c.get("jwtPayload")?.id as string;
}

async function loadCenterForReport(c: any, centerId: string) {
  const supabase = getSupabaseClient(c);
  const { data: center } = await supabase
    .from("ServiceCenter")
    .select(
      "id, centerName, address, phone, whatsappNumber, state, lga, logoUrl, reportFooterText, brandColor"
    )
    .eq("id", centerId)
    .single();
  return center;
}

async function loadPatientForReport(c: any, patientId: string) {
  const supabase = getSupabaseClient(c);
  const { data: patient } = await supabase
    .from("User")
    .select("id, fullName, phone")
    .eq("id", patientId)
    .single();
  return patient;
}

async function loadAppointmentForReport(c: any, appointmentId: string, centerId: string) {
  const supabase = getSupabaseClient(c);

  const { data: appointment, error } = await supabase
    .from("Appointment")
    .select("*")
    .eq("id", appointmentId)
    .eq("centerId", centerId)
    .single();

  if (error || !appointment) return null;

  const [{ data: patient }, { data: center }, { data: existingReport }] =
    await Promise.all([
      supabase
        .from("User")
        .select("id, fullName, phone")
        .eq("id", appointment.patientId)
        .single(),
      supabase
        .from("ServiceCenter")
        .select(
          "id, centerName, address, phone, whatsappNumber, state, lga, logoUrl, reportFooterText, brandColor"
        )
        .eq("id", centerId)
        .single(),
      supabase
        .from("ScreeningReport")
        .select("id")
        .eq("appointmentId", appointmentId)
        .maybeSingle(),
    ]);

  return { appointment, patient, center, existingReport };
}

async function loadReportContext(
  c: any,
  centerId: string,
  params: { patientId?: string; appointmentId?: string }
) {
  if (params.appointmentId) {
    return loadAppointmentForReport(c, params.appointmentId, centerId);
  }

  if (!params.patientId) return null;

  const supabase = getSupabaseClient(c);
  const [patient, center, profile, appointmentAtCenter] = await Promise.all([
    loadPatientForReport(c, params.patientId),
    loadCenterForReport(c, centerId),
    supabase
      .from("PatientProfile")
      .select("userId, assignedCenterId")
      .eq("userId", params.patientId)
      .maybeSingle()
      .then((r) => r.data),
    supabase
      .from("Appointment")
      .select("id")
      .eq("patientId", params.patientId)
      .eq("centerId", centerId)
      .limit(1)
      .maybeSingle()
      .then((r) => r.data),
  ]);

  if (!patient) return null;

  const isAssigned = profile?.assignedCenterId === centerId;
  const hasAppointment = Boolean(appointmentAtCenter?.id);
  if (!isAssigned && !hasAppointment) {
    return null;
  }

  return {
    appointment: null,
    patient,
    center,
    existingReport: null,
  };
}

function formatCenterAddress(center?: {
  address?: string | null;
  lga?: string | null;
  state?: string | null;
} | null): string {
  const address = (center?.address || "").trim();
  const lga = (center?.lga || "").trim();
  const state = (center?.state || "").trim();
  const parts: string[] = [];
  if (address) parts.push(address);
  if (lga && !address.toLowerCase().includes(lga.toLowerCase())) parts.push(lga);
  if (state && !address.toLowerCase().includes(state.toLowerCase())) {
    parts.push(state);
  }
  return parts.join(", ");
}

function buildReportHtmlForCenter(
  loaded: {
    center?: any;
    patient?: any;
  },
  reportFields: {
    title: string;
    sampleType: string;
    resultText: string;
    interpretation: string;
    advise: string;
    conclusion?: string | null;
    remarks: string;
    disclaimer: string;
    signedByName?: string | null;
    createdAt?: string | Date;
  }
) {
  const reportDate = reportFields.createdAt
    ? new Date(reportFields.createdAt).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return buildReportHtml({
    centerName: loaded.center?.centerName || "Screening Center",
    centerAddress: formatCenterAddress(loaded.center),
    centerPhone: loaded.center?.phone,
    centerWhatsapp: loaded.center?.whatsappNumber || loaded.center?.phone,
    logoUrl: loaded.center?.logoUrl,
    reportFooterText: loaded.center?.reportFooterText,
    brandColor: loaded.center?.brandColor,
    patientName: loaded.patient?.fullName || "Patient",
    signedByName: reportFields.signedByName || "Authorized staff",
    reportDate,
    title: reportFields.title,
    sampleType: reportFields.sampleType,
    resultText: reportFields.resultText,
    interpretation: reportFields.interpretation,
    advise: reportFields.advise,
    conclusion: reportFields.conclusion,
    remarks: reportFields.remarks,
    disclaimer: reportFields.disclaimer,
  });
}

// GET /api/screening-reports/taxonomy
screeningReportsApp.get("/taxonomy", async (c) => {
  return c.json({ ok: true, data: { taxonomy: REPORT_TAXONOMY } });
});

// GET /api/screening-reports/template?category=&testType=&subTest=&outcome=
screeningReportsApp.get("/template", async (c) => {
  const reportCategory = c.req.query("category") || "";
  const reportTestType = c.req.query("testType") || "";
  const reportSubTest = c.req.query("subTest") || undefined;
  const resultOutcome = (c.req.query("outcome") || "") as "POSITIVE" | "NEGATIVE";

  const template = getReportTemplate({
    reportCategory,
    reportTestType,
    reportSubTest,
    resultOutcome,
  });

  if (!template) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Template not available for this selection" },
      404
    );
  }

  return c.json({ ok: true, data: { template } });
});

// GET /api/screening-reports/eligible-appointments
// Returns patients the center can create reports for:
// - patients assigned to this center
// - patients with any appointment at this center
// - optional search by name/phone
screeningReportsApp.get("/eligible-appointments", async (c) => {
  const centerId = await getCenterId(c);
  const supabase = getSupabaseClient(c);
  const search = (c.req.query("search") || "").trim().toLowerCase();

  const [{ data: assignedProfiles }, { data: appointments }] = await Promise.all([
    supabase
      .from("PatientProfile")
      .select("userId")
      .eq("assignedCenterId", centerId)
      .limit(200),
    supabase
      .from("Appointment")
      .select("id, patientId, screeningTypeId, status, kitId, appointmentDateTime")
      .eq("centerId", centerId)
      .order("appointmentDateTime", { ascending: false })
      .limit(200),
  ]);

  const patientIds = [
    ...new Set([
      ...(assignedProfiles || []).map((p) => p.userId),
      ...(appointments || []).map((a) => a.patientId),
    ]),
  ];

  if (patientIds.length === 0) {
    return c.json({ ok: true, data: { patients: [], appointments: [] } });
  }

  const { data: patients } = await supabase
    .from("User")
    .select("id, fullName, phone")
    .in("id", patientIds);

  const patientMap = new Map((patients || []).map((p) => [p.id, p]));

  const latestAppointmentByPatient = new Map<string, any>();
  for (const appointment of appointments || []) {
    const existing = latestAppointmentByPatient.get(appointment.patientId);
    if (
      !existing ||
      new Date(appointment.appointmentDateTime) >
        new Date(existing.appointmentDateTime)
    ) {
      latestAppointmentByPatient.set(appointment.patientId, appointment);
    }
  }

  let eligible = patientIds
    .map((patientId) => {
      const patient = patientMap.get(patientId);
      if (!patient) return null;
      const appointment = latestAppointmentByPatient.get(patientId) || null;
      return {
        patientId,
        appointmentId: appointment?.id || null,
        appointmentDateTime: appointment?.appointmentDateTime || null,
        appointmentStatus: appointment?.status || null,
        patient,
        patientName: patient.fullName || "Patient",
        phone: patient.phone || null,
      };
    })
    .filter(Boolean) as Array<Record<string, any>>;

  if (search) {
    eligible = eligible.filter((row) => {
      const name = row.patientName?.toLowerCase() || "";
      const phone = row.phone?.toLowerCase() || "";
      return name.includes(search) || phone.includes(search);
    });
  }

  eligible.sort((a, b) =>
    String(a.patientName).localeCompare(String(b.patientName))
  );

  return c.json({
    ok: true,
    data: {
      patients: eligible,
      // Backward-compatible alias
      appointments: eligible.map((row) => ({
        id: row.appointmentId || row.patientId,
        appointmentDateTime: row.appointmentDateTime,
        patient: row.patient,
      })),
    },
  });
});

// GET /api/screening-reports/staff
screeningReportsApp.get("/staff", async (c) => {
  const db = getDB(c);
  const centerId = await getCenterId(c);
  const staff = await db.centerStaff.findMany({
    where: { centerId },
  });

  return c.json({
    ok: true,
    data: {
      staff: (staff || []).map((member: any) => ({
        id: member.id,
        email: member.email,
        role: member.role,
        label: formatStaffLabel(member.email, member.role),
      })),
    },
  });
});

// POST /api/screening-reports
screeningReportsApp.post(
  "/",
  zValidator("json", createScreeningReportSchema),
  async (c) => {
    try {
      const db = getDB(c);
      const centerId = await getCenterId(c);
      const body = c.req.valid("json");

      const loaded = await loadReportContext(c, centerId, {
        patientId: body.patientId,
        appointmentId: body.appointmentId,
      });
      if (!loaded?.patient) {
        return c.json<TErrorResponse>(
          { ok: false, error: "Patient not found or not linked to your center" },
          404
        );
      }

      if (body.appointmentId && loaded.existingReport) {
        return c.json<TErrorResponse>(
          { ok: false, error: "A report already exists for this appointment" },
          409
        );
      }

      const patientId = loaded.patient.id as string;

      let signedByName: string | null = body.signedByName?.trim() || null;
      if (body.signedByStaffId) {
        const staff = await db.centerStaff.findUnique({
          where: { id: body.signedByStaffId },
        });
        if (!staff || staff.centerId !== centerId) {
          return c.json<TErrorResponse>(
            { ok: false, error: "Invalid signatory selected" },
            400
          );
        }
        if (!signedByName) {
          signedByName = resolveSignedByName({ signedByStaffEmail: staff.email });
        }
      }

      if (!signedByName) {
        return c.json<TErrorResponse>(
          {
            ok: false,
            error: "Enter the name of the person who performed the test",
          },
          400
        );
      }

      const reportAccess = generateReportAccessToken();

      const report = await db.screeningReport.create({
        data: {
          appointmentId: body.appointmentId || null,
          centerId,
          patientId,
          signedByStaffId: body.signedByStaffId || null,
          signedByName,
          reportCategory: body.reportCategory,
          reportTestType: body.reportTestType,
          reportSubTest: body.reportSubTest || null,
          resultOutcome: body.resultOutcome,
          title: body.title,
          sampleType: body.sampleType,
          resultText: body.resultText,
          interpretation: body.interpretation,
          advise: body.advise,
          conclusion: body.conclusion || null,
          remarks: body.remarks,
          disclaimer: body.disclaimer,
          accessToken: reportAccess.accessToken,
          accessTokenExpiresAt: reportAccess.accessTokenExpiresAt,
        },
      });

      const html = buildReportHtmlForCenter(loaded, {
        ...body,
        signedByName,
      });

      return c.json({
        ok: true,
        data: { report, html, signedByName },
      });
    } catch (error) {
      console.error("Create screening report error:", error);
      return c.json<TErrorResponse>(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to save screening report",
        },
        500
      );
    }
  }
);

// POST /api/screening-reports/:id/pdf — persist Cloudinary PDF URL after client upload
screeningReportsApp.post(
  "/:id/pdf",
  zValidator("json", saveScreeningReportPdfSchema),
  async (c) => {
    const db = getDB(c);
    const centerId = await getCenterId(c);
    const { id } = c.req.param();
    const body = c.req.valid("json");

    const report = await db.screeningReport.findUnique({ where: { id } });
    if (!report || report.centerId !== centerId) {
      return c.json<TErrorResponse>({ ok: false, error: "Report not found" }, 404);
    }

    const updated = await db.screeningReport.update({
      where: { id },
      data: {
        pdfUrl: body.pdfUrl,
        pdfCloudinaryId: body.pdfCloudinaryId || null,
      },
    });

    return c.json({ ok: true, data: { report: updated } });
  }
);

// GET /api/screening-reports/:id
screeningReportsApp.get("/:id", async (c) => {
  const db = getDB(c);
  const centerId = await getCenterId(c);
  const { id } = c.req.param();

  const report = await db.screeningReport.findUnique({ where: { id } });
  if (!report || report.centerId !== centerId) {
    return c.json<TErrorResponse>({ ok: false, error: "Report not found" }, 404);
  }

  const loaded = await loadReportContext(c, centerId, {
    patientId: report.patientId,
    appointmentId: report.appointmentId || undefined,
  });
  let signedByName = report.signedByName || null;
  if (!signedByName && report.signedByStaffId) {
    const staff = await db.centerStaff.findUnique({
      where: { id: report.signedByStaffId },
    });
    signedByName = resolveSignedByName({ signedByStaffEmail: staff?.email });
  }

  const html = buildReportHtmlForCenter(loaded || {}, {
    title: report.title,
    sampleType: report.sampleType,
    resultText: report.resultText,
    interpretation: report.interpretation,
    advise: report.advise,
    conclusion: report.conclusion,
    remarks: report.remarks,
    disclaimer: report.disclaimer,
    signedByName,
    createdAt: report.createdAt,
  });

  return c.json({ ok: true, data: { report, html, patient: loaded?.patient } });
});

// POST /api/screening-reports/:id/send-whatsapp
// Legacy Twilio endpoint — report sharing now uses wa.me click-to-chat on the frontend.
screeningReportsApp.post(
  "/:id/send-whatsapp",
  zValidator("json", sendScreeningReportSchema),
  async (c) => {
    const db = getDB(c);
    const centerId = await getCenterId(c);
    const { id } = c.req.param();
    const { pdfUrl } = c.req.valid("json");
    const { FRONTEND_URL } = env<TEnvs>(c);

    const report = await db.screeningReport.findUnique({ where: { id } });
    if (!report || report.centerId !== centerId) {
      return c.json<TErrorResponse>({ ok: false, error: "Report not found" }, 404);
    }

    const loaded = await loadReportContext(c, centerId, {
      patientId: report.patientId,
      appointmentId: report.appointmentId || undefined,
    });
    const patientPhone = loaded?.patient?.phone;
    if (!patientPhone) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Patient has no WhatsApp number on file" },
        400
      );
    }

    if (!isLikelyValidWhatsappNumber(patientPhone)) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: `Invalid WhatsApp number on file: ${patientPhone}. Use international format e.g. +2348000000000`,
        },
        400
      );
    }

    const center = loaded?.center;
    const centerWhatsapp = center?.whatsappNumber || center?.phone || undefined;
    const publicReportLink = report.accessToken
      ? `${FRONTEND_URL}/reports/view/${report.accessToken}`
      : `${FRONTEND_URL}/patient/reports/${report.id}`;
    const pdfLink = pdfUrl || report.pdfUrl;
    if (!pdfLink && env<TEnvs>(c).ENV_MODE === "production") {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Upload a PDF before sending the report on WhatsApp",
        },
        400
      );
    }

    const message = [
      `Hello ${loaded?.patient?.fullName || "there"},`,
      ``,
      `Your screening report from ${center?.centerName || "your screening center"} is ready.`,
      `Result: ${report.resultText}`,
      ``,
      pdfLink ? `Download PDF: ${pdfLink}` : "",
      `View online: ${publicReportLink}`,
      centerWhatsapp
        ? `For questions, contact the center on WhatsApp: ${centerWhatsapp}`
        : "",
      ``,
      `— ${center?.centerName || "Screening Center"} via ZeroCancer`,
    ]
      .filter(Boolean)
      .join("\n");

    const whatsapp = new WhatsAppService(c);
    const sent = await whatsapp.sendCenterReport({
      to: patientPhone,
      message,
      centerName: center?.centerName || "Screening Center",
      centerWhatsappNumber: centerWhatsapp,
      mediaUrl: pdfLink || undefined,
    });

    await db.screeningReport.update({
      where: { id: report.id },
      data: {
        whatsappSentAt: new Date().toISOString(),
        whatsappStatus: sent.success
          ? sent.mock
            ? "SIMULATED"
            : "SENT"
          : "FAILED",
        pdfUrl: pdfLink || report.pdfUrl,
      },
    });

    if (!sent.success) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: sent.error || "Failed to send WhatsApp message",
        },
        sent.mock ? 503 : 502
      );
    }

    return c.json({
      ok: true,
      data: {
        status: sent.mock ? "SIMULATED" : "SENT",
        mock: sent.mock ?? false,
      },
    });
  }
);
