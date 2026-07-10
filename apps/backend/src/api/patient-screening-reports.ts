import type { TErrorResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "../lib/db";
import { buildReportHtml } from "../lib/report-html";
import { resolveSignedByName } from "../lib/report-utils";
import { getSupabaseClient } from "../lib/supabase";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";

export const patientScreeningReportsApp = new Hono<THonoApp>();

patientScreeningReportsApp.use("*", authMiddleware(["patient"]));

async function buildReportResponse(c: any, report: any) {
  const supabase = getSupabaseClient(c);
  const db = getDB(c);

  const [{ data: center }, { data: patient }] = await Promise.all([
    supabase
      .from("ServiceCenter")
      .select(
        "id, centerName, address, phone, whatsappNumber, state, lga, logoUrl, reportFooterText, brandColor"
      )
      .eq("id", report.centerId)
      .single(),
    supabase
      .from("User")
      .select("id, fullName, phone")
      .eq("id", report.patientId)
      .single(),
  ]);

  let signedByName = report.signedByName || null;
  if (!signedByName && report.signedByStaffId) {
    const staff = await db.centerStaff.findUnique({
      where: { id: report.signedByStaffId },
    });
    signedByName = resolveSignedByName({ signedByStaffEmail: staff?.email });
  }

  const html = buildReportHtml({
    centerName: center?.centerName || "Screening Center",
    centerAddress: [
      center?.address,
      center?.lga &&
      !(center?.address || "")
        .toLowerCase()
        .includes((center?.lga || "").toLowerCase())
        ? center.lga
        : null,
      center?.state &&
      !(center?.address || "")
        .toLowerCase()
        .includes((center?.state || "").toLowerCase())
        ? center.state
        : null,
    ]
      .filter(Boolean)
      .join(", "),
    centerPhone: center?.phone,
    centerWhatsapp: center?.whatsappNumber || center?.phone,
    logoUrl: center?.logoUrl,
    reportFooterText: center?.reportFooterText,
    brandColor: center?.brandColor,
    patientName: patient?.fullName || "Patient",
    signedByName,
    reportDate: new Date(report.createdAt).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    title: report.title,
    sampleType: report.sampleType,
    resultText: report.resultText,
    interpretation: report.interpretation,
    advise: report.advise,
    conclusion: report.conclusion,
    remarks: report.remarks,
    disclaimer: report.disclaimer,
  });

  return {
    report,
    html,
    center: center
      ? {
          id: center.id,
          centerName: center.centerName,
          whatsappNumber: center.whatsappNumber || center.phone,
        }
      : null,
  };
}

// GET /api/patient/screening-reports
patientScreeningReportsApp.get("/", async (c) => {
  const db = getDB(c);
  const patientId = c.get("jwtPayload")?.id as string;

  const reports = await db.screeningReport.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return c.json({
    ok: true,
    data: {
      reports: (reports || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        resultOutcome: r.resultOutcome,
        resultText: r.resultText,
        reportCategory: r.reportCategory,
        createdAt: r.createdAt,
        whatsappStatus: r.whatsappStatus,
        pdfUrl: r.pdfUrl,
      })),
    },
  });
});

// GET /api/patient/screening-reports/:id
patientScreeningReportsApp.get("/:id", async (c) => {
  const db = getDB(c);
  const patientId = c.get("jwtPayload")?.id as string;
  const { id } = c.req.param();

  const report = await db.screeningReport.findUnique({ where: { id } });
  if (!report || report.patientId !== patientId) {
    return c.json<TErrorResponse>({ ok: false, error: "Report not found" }, 404);
  }

  const payload = await buildReportResponse(c, report);
  return c.json({ ok: true, data: payload });
});
