import { getDB } from "./db";
import { getSupabaseClient } from "./supabase";
import { createNotificationForUsers, triggerWaitlistMatching } from "./utils";

export const ENROLLMENT_REQUEST_EXPIRY_DAYS = 7;

export function getEnrollmentRequestExpiresAt(requestedAt: Date) {
  return new Date(
    requestedAt.getTime() + ENROLLMENT_REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );
}

export function isEnrollmentRequestExpired(requestedAt: Date) {
  return getEnrollmentRequestExpiresAt(requestedAt).getTime() < Date.now();
}

export async function expireStaleEnrollmentRequests(
  c: any,
  filters?: { patientId?: string; centerId?: string }
) {
  const supabase = getSupabaseClient(c);
  const cutoff = new Date(
    Date.now() - ENROLLMENT_REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  let query = supabase
    .from("CenterEnrollmentRequest")
    .update({
      status: "EXPIRED",
      respondedAt: new Date().toISOString(),
    })
    .eq("status", "PENDING")
    .lt("requestedAt", cutoff);

  if (filters?.patientId) query = query.eq("patientId", filters.patientId);
  if (filters?.centerId) query = query.eq("centerId", filters.centerId);

  const { error } = await query;
  if (error) throw error;
}

export function formatEnrollmentRequestForApi(request: Record<string, any>) {
  const requestedAt = new Date(String(request.requestedAt));
  return {
    id: request.id,
    status: request.status,
    message: request.message,
    requestedAt: requestedAt.toISOString(),
    expiresAt: getEnrollmentRequestExpiresAt(requestedAt).toISOString(),
    respondedAt: request.respondedAt
      ? new Date(String(request.respondedAt)).toISOString()
      : null,
    center: request.center,
    screeningType: request.screeningType,
    patient: request.patient,
  };
}

export async function enrollPatientInWaitlist(
  c: any,
  params: {
    patientId: string;
    screeningTypeId: string;
    centerId: string;
    skipCenterAssign?: boolean;
    updateExistingEnrollment?: boolean;
  }
) {
  const db = getDB(c);

  const screeningType = await db.screeningType.findUnique({
    where: { id: params.screeningTypeId },
  });
  if (!screeningType) {
    return { error: "Screening type not found" as const };
  }

  const centerOffering = await db.serviceCenterScreeningType.findUnique({
    where: {
      centerId_screeningTypeId: {
        centerId: params.centerId,
        screeningTypeId: params.screeningTypeId,
      },
    },
  });
  if (!centerOffering) {
    return { error: "Screening type is not offered at this center" as const };
  }

  const existingWaitlist = await db.waitlist.findFirst({
    where: {
      patientId: params.patientId,
      screeningTypeId: params.screeningTypeId,
      status: { in: ["PENDING", "MATCHED"] },
    },
  });

  if (existingWaitlist) {
    if (
      params.updateExistingEnrollment &&
      existingWaitlist.enrolledByCenterId !== params.centerId
    ) {
      await db.waitlist.update({
        where: { id: existingWaitlist.id },
        data: { enrolledByCenterId: params.centerId },
      });
    }
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

  if (!params.skipCenterAssign) {
    const profile = await db.patientProfile.findUnique({
      where: { userId: params.patientId },
    });
    if (profile && !profile.assignedCenterId) {
      await db.patientProfile.update({
        where: { userId: params.patientId },
        data: { assignedCenterId: params.centerId },
      });
    }
  }

  try {
    await triggerWaitlistMatching(c);
  } catch (error) {
    console.error("Waitlist matching trigger failed after center enrollment:", error);
  }

  return { waitlist, created: true };
}

async function assertCenterOffersScreening(
  db: ReturnType<typeof getDB>,
  centerId: string,
  screeningTypeId: string
) {
  const centerOffering = await db.serviceCenterScreeningType.findUnique({
    where: {
      centerId_screeningTypeId: {
        centerId,
        screeningTypeId,
      },
    },
  });

  if (!centerOffering) {
    return { error: "Screening type is not offered at this center" as const };
  }

  return null;
}

export async function createCenterEnrollmentRequest(
  c: any,
  params: {
    patientId: string;
    centerId: string;
    screeningTypeId: string;
    message?: string;
  }
) {
  const db = getDB(c);

  const screeningError = await assertCenterOffersScreening(
    db,
    params.centerId,
    params.screeningTypeId
  );
  if (screeningError) {
    return screeningError;
  }

  const existing = await db.centerEnrollmentRequest.findFirst({
    where: {
      patientId: params.patientId,
      centerId: params.centerId,
      screeningTypeId: params.screeningTypeId,
      status: "PENDING",
    },
  });

  if (existing) {
    return { request: existing, created: false };
  }

  const [center, screeningType] = await Promise.all([
    db.serviceCenter.findUnique({ where: { id: params.centerId } }),
    db.screeningType.findUnique({ where: { id: params.screeningTypeId } }),
  ]);

  const request = await db.centerEnrollmentRequest.create({
    data: {
      patientId: params.patientId,
      centerId: params.centerId,
      screeningTypeId: params.screeningTypeId,
      status: "PENDING",
      message: params.message ?? null,
    },
    include: {
      center: { select: { id: true, centerName: true } },
      screeningType: { select: { id: true, name: true } },
    },
  });

  const centerName = center?.centerName || "A screening center";
  const screeningName = screeningType?.name || "a screening service";

  try {
    await createNotificationForUsers(
      c,
      {
        type: "CENTER_ENROLLMENT_REQUEST",
        title: "Center enrollment request",
        message: `${centerName} has requested to enroll you for ${screeningName}. Please review and approve or decline within ${ENROLLMENT_REQUEST_EXPIRY_DAYS} days in your patient portal.`,
        userIds: [params.patientId],
        data: {
          requestId: request.id,
          centerId: params.centerId,
          screeningTypeId: params.screeningTypeId,
        },
      },
      true
    );
  } catch (error) {
    console.error("Failed to notify patient about enrollment request:", error);
  }

  return { request, created: true };
}

export async function approveCenterEnrollmentRequest(
  c: any,
  requestId: string,
  patientId: string
) {
  const db = getDB(c);

  const request = await db.centerEnrollmentRequest.findFirst({
    where: { id: requestId, patientId, status: "PENDING" },
    include: {
      center: { select: { id: true, centerName: true } },
      screeningType: { select: { id: true, name: true } },
    },
  });

  if (!request) {
    return { error: "Enrollment request not found or already handled" as const };
  }

  if (isEnrollmentRequestExpired(new Date(String(request.requestedAt)))) {
    await db.centerEnrollmentRequest.update({
      where: { id: requestId },
      data: { status: "EXPIRED", respondedAt: new Date() },
    });
    return { error: "This enrollment request has expired" as const };
  }

  const enrollment = await enrollPatientInWaitlist(c, {
    patientId,
    screeningTypeId: request.screeningTypeId,
    centerId: request.centerId,
    skipCenterAssign: true,
    updateExistingEnrollment: true,
  });

  if ("error" in enrollment && enrollment.error) {
    return { error: enrollment.error };
  }

  await db.patientProfile.update({
    where: { userId: patientId },
    data: { assignedCenterId: request.centerId },
  });

  const updated = await db.centerEnrollmentRequest.update({
    where: { id: requestId, status: "PENDING" },
    data: { status: "APPROVED", respondedAt: new Date() },
  });

  if (!updated) {
    return { error: "Enrollment request not found or already handled" as const };
  }

  return { request, enrollment };
}

export async function fulfillCenterEnrollmentRequest(
  c: any,
  requestId: string,
  patientId: string
) {
  return approveCenterEnrollmentRequest(c, requestId, patientId);
}