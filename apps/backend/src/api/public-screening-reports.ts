import type { TErrorResponse } from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "../lib/db";
import { buildReportHtml } from "../lib/report-html";
import { isReportAccessTokenValid } from "../lib/report-access";
import { resolveSignedByName } from "../lib/report-utils";
import { getSupabaseClient } from "../lib/supabase";
import { THonoApp } from "../lib/types";

export const publicScreeningReportsApp = new Hono<THonoApp>();

// GET /api/public/screening-reports/:token — no auth; for WhatsApp links
publicScreeningReportsApp.get("/:token", async (c) => {
  const db = getDB(c);
  const { token } = c.req.param();

  const report = await db.screeningReport.findUnique({
    where: { accessToken: token },
  });

  if (!report || !isReportAccessTokenValid(report)) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Report link is invalid or has expired" },
      404
    );
  }

  const supabase = getSupabaseClient(c);
  const [{ data: center }, { data: patient }] = await Promise.all([
    supabase
      .from("ServiceCenter")
      .select("id, centerName, address, phone, whatsappNumber, state, lga")
      .eq("id", report.centerId)
      .single(),
    supabase
      .from("User")
      .select("id, fullName")
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
    centerAddress: `${center?.address || ""}, ${center?.lga || ""}, ${center?.state || ""}`,
    centerPhone: center?.phone,
    centerWhatsapp: center?.whatsappNumber || center?.phone,
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

  return c.json({
    ok: true,
    data: {
      report: {
        title: report.title,
        resultOutcome: report.resultOutcome,
        pdfUrl: report.pdfUrl,
        createdAt: report.createdAt,
      },
      html,
      center: center
        ? {
            centerName: center.centerName,
            whatsappNumber: center.whatsappNumber || center.phone,
          }
        : null,
    },
  });
});
