import { zValidator } from "@hono/zod-validator";
import {
  bookSelfPayAppointmentSchema,
  cancelCenterAppointmentSchema,
  completeAppointmentSchema,
  deleteResultFileSchema,
  getAppointmentResultsSchema,
  getCenterAppointmentByIdSchema,
  getCenterAppointmentsSchema,
  getPatientAppointmentsSchema,
  getPatientResultByIdSchema,
  rescheduleCenterAppointmentSchema,
  restoreResultFileSchema,
  selectCenterSchema,
  uploadResultsSchema,
  verifyCheckInCodeSchema,
} from "@zerocancer/shared";
import type {
  TBookSelfPayAppointmentResponse,
  TCancelCenterAppointmentResponse,
  TCompleteAppointmentResponse,
  TDataResponse,
  TDeleteResultFileResponse,
  TErrorResponse,
  TGetAppointmentResultsResponse,
  TGetCenterAppointmentByIdResponse,
  TGetCenterAppointmentsResponse,
  TGetCheckInCodeResponse,
  TGetEligibleCentersResponse,
  TGetPatientAppointmentByIdResponse,
  TGetPatientAppointmentsResponse,
  TGetPatientReceiptResponse,
  TGetPatientResultByIdResponse,
  TRestoreResultFileResponse,
  TSelectCenterResponse,
  TUploadResultsResponse,
  TVerifyCheckInCodeResponse,
} from "@zerocancer/shared/types";
import { Hono } from "hono";
import { getDB } from "../lib/db";
import { getSupabaseClient } from "../lib/supabase";
import { THonoApp } from "../lib/types";
import { authMiddleware } from "../middleware/auth.middleware";
// import { centerAppointmentApp } from "./center.appointment";
// import { patientAppointmentApp } from "./patient.appointment";
import { initializePaystackPayment } from "../lib/paystack";
import { createNotificationForUsers, generateHexId } from "../lib/utils";
// import { createNotificationForUsers } from "../lib/waitlistMatchingAlg";

export const appointmentApp = new Hono<THonoApp>();

// ROUTES
// appointmentApp.route("/patient", patientAppointmentApp);
// appointmentApp.route("/center", centerAppointmentApp);

// GET /api/appointment/:id/results
appointmentApp.get(
  "/:id/results",
  authMiddleware(["patient", "center", "admin"]),
  zValidator("param", getAppointmentResultsSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),

  async (c) => {
    const db = getDB(c);
    const { id: appointmentId } = c.req.valid("param");

    // Check appointment exists and user has access
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        // Access control based on user role
        // Admin can access all appointments
      },
      select: { id: true },
    });

    if (!appointment) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found or access denied" },
        404
      );
    }

    // Get the screening result for this appointment
    const result = await db.screeningResult.findFirst({
      where: {
        appointmentId,
      },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDateTime: true,
            screeningType: { select: { id: true, name: true } },
            center: { select: { id: true, centerName: true, address: true } },
          },
        },
        files: {
          where: { isDeleted: false }, // Only show non-deleted files
          orderBy: { filePath: "asc" },
        },
      },
    });

    // If no result found, return null data
    if (!result) {
      return c.json<TGetAppointmentResultsResponse>({
        ok: true,
        data: null,
      });
    }

    // Helper function to group files by folder
    const groupFilesByFolder = (files: any[]): Record<string, any[]> => {
      return files.reduce((acc, file) => {
        const folderName = file.filePath.includes("/")
          ? file.filePath.split("/")[0]
          : "root";

        if (!acc[folderName]) {
          acc[folderName] = [];
        }
        acc[folderName].push(file);
        return acc;
      }, {});
    };

    return c.json<TGetAppointmentResultsResponse>({
      ok: true,
      data: {
        id: result.id,
        notes: result.notes,
        uploadedAt: result.uploadedAt.toISOString(),
        appointment: {
          id: result.appointment.id,
          appointmentDateTime:
            result.appointment.appointmentDateTime.toISOString(),
          screeningType: result.appointment.screeningType,
          center: result.appointment.center,
        },
        files: result.files.map((file) => ({
          id: file.id,
          fileName: file.fileName,
          filePath: file.filePath,
          fileType: file.fileType,
          fileSize: file.fileSize,
          cloudinaryUrl: file.cloudinaryUrl,
          uploadedAt: file.uploadedAt.toISOString(),
          isDeleted: file.isDeleted,
        })),
        folders: groupFilesByFolder(result.files),
      },
    });
  }
);

// ======================================
// CENTER APPOINTMENT MANAGEMENT ROUTES
// ======================================

// Middleware to ensure user is authenticated
appointmentApp.use("/center/*", authMiddleware(["center", "center_staff"]));

// GET /api/appointment/center - List appointments (paginated, filterable)
appointmentApp.get(
  "/center",
  zValidator("query", getCenterAppointmentsSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const {
      page = 1,
      pageSize = 20,
      screeningType,
      status,
    } = c.req.valid("query");
    const where: any = {};
    if (screeningType) where.screeningTypeId = screeningType;
    // Optionally, filter by centerId from JWT
    const payload = c.get("jwtPayload");
    const centerId = payload?.id!; // Use centerId or id from JWT
    if (centerId) where.centerId = centerId;
    if (status) where.status = status; // Use exact match for status
    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { id: true, fullName: true } },
          screeningType: { select: { id: true, name: true } },
        },
      }),
      db.appointment.count({ where }),
    ]);

    // Transform the appointments to match the expected type
    const transformedAppointments = appointments.map((appointment) => ({
      ...appointment,
      appointmentDateTime: appointment.appointmentDateTime.toISOString(),
      createdAt: appointment.createdAt.toISOString(),
      cancellationDate: appointment.cancellationDate?.toISOString() || null,
      checkInCodeExpiresAt:
        appointment.checkInCodeExpiresAt?.toISOString() || null,
    }));

    return c.json<TGetCenterAppointmentsResponse>({
      ok: true,
      data: {
        appointments: transformedAppointments,
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  }
);

// GET /api/appointment/center/:id - Get appointment details
appointmentApp.get(
  "/center/:id",
  zValidator("param", getCenterAppointmentByIdSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const { id } = c.req.valid("param");
    const payload = c.get("jwtPayload");
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, fullName: true } },
        center: { select: { id: true, centerName: true } },
        screeningType: { select: { id: true, name: true } },
        verification: { select: { id: true } },
      },
    });
    if (!appointment || appointment.centerId !== payload?.id) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found." },
        404
      );
    }

    // Transform the appointment to match the expected type
    const transformedAppointment = {
      ...appointment,
      appointmentDateTime: appointment.appointmentDateTime.toISOString(),
      createdAt: appointment.createdAt.toISOString(),
      cancellationDate: appointment.cancellationDate?.toISOString() || null,
      checkInCodeExpiresAt:
        appointment.checkInCodeExpiresAt?.toISOString() || null,
    };

    return c.json<TGetCenterAppointmentByIdResponse>({
      ok: true,
      data: transformedAppointment,
    });
  }
);

// POST /api/appointment/center/:id/cancel - Cancel appointment
appointmentApp.post(
  "/center/:id/cancel",
  zValidator("json", cancelCenterAppointmentSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const id = c.req.param("id");
    const { reason } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const appointment = await db.appointment.findUnique({ where: { id } });
    if (!appointment || appointment.centerId !== payload?.id) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found." },
        404
      );
    }
    if (appointment.status! === "CANCELLED") {
      return c.json<TErrorResponse>(
        { ok: false, error: "Already cancelled." },
        400
      );
    }
    await db.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancellationReason: reason || null,
        cancellationDate: new Date(),
      },
    });
    // Optionally, notify patient
    // ...
    return c.json<TCancelCenterAppointmentResponse>({
      ok: true,
      data: { id: id! },
    });
  }
);

// POST /api/appointment/center/:id/reschedule - Reschedule appointment
// NOTE TO SELF: Make a more robust rescheduling system later
// This is a simple version that just updates the date/time & resets status
appointmentApp.post(
  "/center/:id/reschedule",
  zValidator("json", rescheduleCenterAppointmentSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const id = c.req.param("id");
    const { newDateTime, reason } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const appointment = await db.appointment.findUnique({ where: { id } });
    if (!appointment || appointment.centerId !== payload?.id) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found." },
        404
      );
    }
    if (appointment.status! === "CANCELLED") {
      return c.json<TErrorResponse>(
        { ok: false, error: "Cannot reschedule a cancelled appointment." },
        400
      );
    }
    const updated = await db.appointment.update({
      where: { id },
      data: {
        appointmentDateTime: new Date(newDateTime!),
        status: "SCHEDULED",
      },
    });
    // Optionally, notify patient
    // ...
    return c.json<
      TDataResponse<{
        id: string;
        appointmentDateTime: string;
      }>
    >({
      ok: true,
      data: {
        id: updated.id!,
        appointmentDateTime: updated.appointmentDateTime.toISOString(),
      },
    });
  }
);

// POST /api/appointment/center/verify - Verify check-in code
appointmentApp.post(
  "/center/verify",
  zValidator("json", verifyCheckInCodeSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const { checkInCode } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    if (!payload) {
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
    }

    // Find appointment by check-in code
    const appointment = await db.appointment.findUnique({
      where: { checkInCode },
      include: {
        patient: { select: { id: true, fullName: true } },
        center: { select: { id: true, centerName: true } },
        screeningType: { select: { id: true, name: true } },
        verification: { select: { id: true, verifiedAt: true } },
      },
    });

    if (!appointment) {
      return c.json<TVerifyCheckInCodeResponse>({
        ok: true,
        data: {
          valid: false,
          message: "Invalid check-in code",
        },
      });
    }

    // Check if the code has expired
    if (
      appointment.checkInCodeExpiresAt &&
      new Date() > appointment.checkInCodeExpiresAt
    ) {
      return c.json<TVerifyCheckInCodeResponse>({
        ok: true,
        data: {
          valid: false,
          message: "Check-in code has expired",
        },
      });
    }

    // Check if appointment is already verified
    if (appointment.verification) {
      return c.json<TVerifyCheckInCodeResponse>({
        ok: true,
        data: {
          valid: false,
          appointmentId: appointment.id,
          message: "Appointment already checked in",
        },
      });
    }

    // Check-in is allowed any day while the code is still valid (not expired)
    // and the appointment is still scheduled.
    if (!["SCHEDULED", "IN_PROGRESS"].includes(appointment.status || "")) {
      return c.json<TVerifyCheckInCodeResponse>({
        ok: true,
        data: {
          valid: false,
          appointmentId: appointment.id,
          message: `Appointment cannot be checked in (status: ${appointment.status})`,
        },
      });
    }

    // Verify that the center staff belongs to the same center as the appointment
    const centerId = payload.id; // Center or staff ID from JWT
    if (appointment.centerId !== centerId) {
      return c.json<TVerifyCheckInCodeResponse>({
        ok: true,
        data: {
          valid: false,
          message: "Check-in code does not belong to your center",
        },
      });
    }

    // Create verification record and update appointment status
    let verifiedByStaffId: string | null = null;
    if (payload.profile?.toLowerCase() === "center_staff" && payload.email) {
      const staff = await db.centerStaff.findFirst({
        where: { centerId, email: payload.email },
      });
      verifiedByStaffId = staff?.id ?? null;
    }

    await db.$transaction(async (tx) => {
      await tx.appointmentVerification.create({
        data: {
          appointmentId: appointment.id,
          verifiedBy: verifiedByStaffId,
          verifiedAt: new Date(),
        },
      });

      // Update appointment status to IN_PROGRESS
      await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: "IN_PROGRESS" },
      });
    });

    // Send notification to patient
    try {
      await createNotificationForUsers(
        c,
        {
          type: "CHECK_IN_CONFIRMED",
          title: "Check-in Confirmed",
          message: `Your appointment at ${appointment.center.centerName} has been confirmed. Please proceed with your screening.`,
          userIds: [appointment.patientId],
          data: { appointmentId: appointment.id },
        },
        true
      ); // Enable email notification for appointment check-in
    } catch (error) {
      // Log the error but don't fail the request
      console.error("Failed to send notification:", error);
    }

    // Send notification to donors if this is a donated appointment
    if (appointment.isDonation) {
      try {
        // Find all donors who funded this appointment
        const allocations = await db.donationAllocation.findMany({
          where: { appointmentId: appointment.id },
          include: {
            campaign: {
              select: { donorId: true },
            },
          },
        });

        const donorIds = [
          ...new Set(
            allocations.map((allocation) => allocation.campaign.donorId)
          ),
        ];

        if (donorIds.length > 0) {
          await createNotificationForUsers(c, {
            type: "PATIENT_CHECKED_IN",
            title: "Patient Has Checked In",
            message: `A patient you funded has checked in for their ${appointment.screeningType.name} screening at ${appointment.center.centerName}. Their appointment is now in progress.`,
            userIds: donorIds,
            data: {
              appointmentId: appointment.id,
              screeningType: appointment.screeningType.name,
              centerName: appointment.center.centerName,
              patientId: appointment.patientId,
            },
          });
        }
      } catch (error) {
        // Log the error but don't fail the request
        console.error("Failed to send donor check-in notification:", error);
      }
    }

    return c.json<TVerifyCheckInCodeResponse>({
      ok: true,
      data: {
        valid: true,
        appointmentId: appointment.id,
        message: "Check-in successful",
      },
    });
  }
);

// POST /api/appointment/center/:id/upload-results - Upload screening results
appointmentApp.post(
  "/center/:id/upload-results",
  zValidator("json", uploadResultsSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const { id } = c.req.param();
    const { files, notes } = c.req.valid("json");
    const payload = c.get("jwtPayload");

    if (!payload?.id) {
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
    }

    // Verify appointment exists and belongs to center
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        center: true,
        patient: { select: { id: true, fullName: true } },
      },
    });

    if (!appointment) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found" },
        404
      );
    }

    if (appointment.centerId !== payload.id) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment does not belong to your center" },
        403
      );
    }

    // Check if appointment is in valid state for result upload
    if (!["IN_PROGRESS", "SCHEDULED"].includes(appointment.status!)) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Appointment is not in a valid state for result upload",
        },
        400
      );
    }

    try {
      let uploadedBy: string | null = null;
      if (payload.profile === "CENTER_STAFF" && payload.email) {
        const staff = await db.centerStaff.findFirst({
          where: {
            email: payload.email,
            centerId: payload.id,
          },
        });
        uploadedBy = staff?.id || null;
      }

      // Create or update screening result with files in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create or update screening result
        const screeningResult = await tx.screeningResult.upsert({
          where: { appointmentId: id },
          create: {
            appointmentId: id,
            notes,
            uploadedBy,
          },
          update: {
            notes,
            uploadedBy,
            uploadedAt: new Date(),
          },
        });

        // Create file records
        if (files && files.length > 0) {
          await tx.screeningResultFile.createMany({
            data: files.map((file) => ({
              resultId: screeningResult.id,
              fileName: file.fileName || "unknown",
              filePath: file.filePath || "unknown",
              fileType: file.fileType || "unknown",
              fileSize: file.fileSize || 0,
              cloudinaryUrl: file.url || "",
              cloudinaryId: file.cloudinaryId || "",
            })),
          });
        }

        // Keep appointment as IN_PROGRESS - completion is manual
        await tx.appointment.update({
          where: { id },
          data: { status: "IN_PROGRESS" },
        });

        return screeningResult;
      });

      try {
        await createNotificationForUsers(c, {
          type: "SCREENING_RESULT_UPLOADED",
          title: "Screening results available",
          message:
            "Your screening results have been uploaded and are now available in your patient portal.",
          userIds: [appointment.patientId],
          data: { appointmentId: id, resultId: result.id },
        });
      } catch (notifyError) {
        console.error("Failed to notify patient about uploaded results:", notifyError);
      }

      return c.json<TUploadResultsResponse>({
        ok: true,
        data: {
          resultId: result.id,
          filesCount: files?.length || 0,
        },
      });
    } catch (error) {
      console.error("Error uploading results:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to upload results" },
        500
      );
    }
  }
);

// POST /api/appointment/center/:id/complete - Mark appointment as completed
appointmentApp.post(
  "/center/:id/complete",
  zValidator("json", completeAppointmentSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const supabase = getSupabaseClient(c);
    const { id } = c.req.param();
    const { completionNotes, kitSerialNumber } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const centerId = payload?.id as string;

    const { data: appointment, error: appointmentError } = await supabase
      .from("Appointment")
      .select("*")
      .eq("id", id)
      .eq("centerId", centerId)
      .eq("status", "IN_PROGRESS")
      .single();

    if (appointmentError || !appointment) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found or cannot be completed" },
        404
      );
    }

    if (!kitSerialNumber?.trim()) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Kit serial number is required to complete screening" },
        400
      );
    }

    const { data: kit, error: kitError } = await supabase
      .from("Kit")
      .select("id, serialNumber")
      .eq("serialNumber", kitSerialNumber.trim())
      .eq("centerId", centerId)
      .eq("status", "AVAILABLE")
      .maybeSingle();

    if (kitError || !kit) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: `Kit with serial number ${kitSerialNumber} not found in your inventory or is already used.`,
        },
        400
      );
    }

    const now = new Date().toISOString();

    const { error: completeError } = await supabase
      .from("Appointment")
      .update({ status: "COMPLETED", kitId: kit.id })
      .eq("id", id);

    if (completeError) {
      console.error("Failed to complete appointment:", completeError);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to complete appointment" },
        500
      );
    }

    const { error: kitUpdateError } = await supabase
      .from("Kit")
      .update({ status: "USED", usedAt: now })
      .eq("id", kit.id);

    if (kitUpdateError) {
      console.error("Failed to mark kit as used:", kitUpdateError);
      await supabase
        .from("Appointment")
        .update({ status: "IN_PROGRESS", kitId: null })
        .eq("id", id);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to record kit usage. Appointment was not completed." },
        500
      );
    }

    if (completionNotes?.trim()) {
      const { data: existingResult } = await supabase
        .from("ScreeningResult")
        .select("id")
        .eq("appointmentId", id)
        .maybeSingle();

      if (existingResult) {
        await supabase
          .from("ScreeningResult")
          .update({ notes: completionNotes.trim(), uploadedAt: now })
          .eq("id", existingResult.id);
      } else {
        await supabase.from("ScreeningResult").insert({
          id: crypto.randomUUID(),
          appointmentId: id,
          notes: completionNotes.trim(),
          uploadedAt: now,
        });
      }
    }

    const [{ data: center }, { data: screeningType }] = await Promise.all([
        supabase
          .from("ServiceCenter")
          .select("centerName")
          .eq("id", centerId)
          .single(),
        supabase
          .from("ScreeningType")
          .select("name")
          .eq("id", appointment.screeningTypeId)
          .single(),
      ]);

    try {
      await createNotificationForUsers(c, {
        type: "RESULTS_AVAILABLE",
        title: "Screening Completed",
        message: `Your ${screeningType?.name || "screening"} at ${center?.centerName || "your center"} has been completed. Your center will send your report shortly.`,
        userIds: [appointment.patientId],
        data: { appointmentId: id },
      });
    } catch (error) {
      console.error("Failed to send completion notification:", error);
    }

    try {
      const { creditCommissionForCompletedAppointment } = await import(
        "../lib/commission.service"
      );
      await creditCommissionForCompletedAppointment(c, id);
    } catch (error) {
      console.error("Failed to credit referral commission:", error);
    }

    if (appointment.isDonation) {
      try {
        const db = getDB(c);
        const allocations = await db.donationAllocation.findMany({
          where: { appointmentId: id },
          include: {
            campaign: {
              select: { donorId: true },
            },
          },
        });

        const donorIds = [
          ...new Set(
            allocations.map((allocation: any) => allocation.campaign?.donorId).filter(Boolean)
          ),
        ];

        if (donorIds.length > 0) {
          await createNotificationForUsers(c, {
            type: "APPOINTMENT_COMPLETED",
            title: "Screening Completed",
            message: `A patient you funded has completed their ${screeningType?.name || "screening"} at ${center?.centerName || "the center"}.`,
            userIds: donorIds,
            data: {
              appointmentId: id,
              screeningType: screeningType?.name,
              centerName: center?.centerName,
              patientId: appointment.patientId,
            },
          });
        }
      } catch (error) {
        console.error("Failed to send donor completion notification:", error);
      }
    }

    return c.json<TCompleteAppointmentResponse>({
      ok: true,
      data: {
        appointmentId: id,
        completedAt: now,
        status: "COMPLETED",
      },
    });
  }
);

// DELETE /api/appointment/center/files/:fileId - Soft delete a file
appointmentApp.delete(
  "/center/files/:fileId",
  zValidator("json", deleteResultFileSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const { fileId } = c.req.param();
    const { reason, notifyPatient = true } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    const staffId = payload?.id!;

    // Verify file exists and belongs to center's appointment
    const file = await db.screeningResultFile.findFirst({
      where: {
        id: fileId,
        isDeleted: false, // Can't delete already deleted files
        result: {
          appointment: {
            centerId: payload?.id, // Use the center ID from auth payload
          },
        },
      },
      include: {
        result: {
          include: {
            appointment: {
              select: {
                id: true,
                status: true,
                patientId: true,
              },
            },
          },
        },
      },
    });

    if (!file) {
      return c.json<TErrorResponse>(
        { ok: false, error: "File not found or already deleted" },
        404
      );
    }

    // Soft delete the file
    const deletedFile = await db.screeningResultFile.update({
      where: { id: fileId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: staffId,
        deletionReason: reason || null,
      },
    });

    // Only notify patient if appointment is COMPLETED and notification is not disabled
    const shouldNotifyPatient =
      file.result.appointment.status === "COMPLETED" && notifyPatient;

    if (shouldNotifyPatient) {
      try {
        await createNotificationForUsers(c, {
          type: "RESULT_UPDATED",
          title: "Result File Removed",
          message: `A result file "${file.fileName}" has been removed from your screening results.`,
          userIds: [file.result.appointment.patientId!],
          data: { appointmentId: file.result.appointment.id },
        });
      } catch (error) {
        console.error("Failed to send deletion notification:", error);
      }
    }

    return c.json<TDeleteResultFileResponse>({
      ok: true,
      data: {
        fileId: deletedFile.id!,
        deletedAt: deletedFile.deletedAt!.toISOString(),
      },
    });
  }
);

// POST /api/appointment/center/files/:fileId/restore - Restore a soft-deleted file
appointmentApp.post(
  "/center/files/:fileId/restore",
  zValidator("json", restoreResultFileSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const { fileId } = c.req.param();
    const payload = c.get("jwtPayload");

    // Verify file exists and is deleted
    const file = await db.screeningResultFile.findFirst({
      where: {
        id: fileId,
        isDeleted: true, // Can only restore deleted files
        result: {
          appointment: {
            centerId: payload?.id,
          },
        },
      },
      include: {
        result: {
          include: {
            appointment: {
              select: {
                id: true,
                status: true,
                patientId: true,
              },
            },
          },
        },
      },
    });

    if (!file) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Deleted file not found" },
        404
      );
    }

    // Restore the file
    const restoredFile = await db.screeningResultFile.update({
      where: { id: fileId },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
      },
    });

    // Only notify patient if appointment is COMPLETED
    if (file.result.appointment.status === "COMPLETED") {
      try {
        await createNotificationForUsers(c, {
          type: "RESULT_UPDATED",
          title: "Result File Restored",
          message: `Result file "${file.fileName}" has been restored to your screening results.`,
          userIds: [file.result.appointment.patientId!],
          data: { appointmentId: file.result.appointment.id },
        });
      } catch (error) {
        console.error("Failed to send restore notification:", error);
      }
    }

    return c.json<TRestoreResultFileResponse>({
      ok: true,
      data: {
        fileId: restoredFile.id!,
        restoredAt: new Date().toISOString(),
      },
    });
  }
);

// ======================================
// PATIENT APPOINTMENT MANAGEMENT ROUTES
// ======================================

// Middleware to ensure user is authenticated
appointmentApp.use("/patient/*", authMiddleware(["patient"]));

// POST /api/appointment/patient/book
appointmentApp.post(
  "/patient/book",
  zValidator("json", bookSelfPayAppointmentSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    try {
    const db = getDB(c);
    const {
      screeningTypeId,
      centerId,
      appointmentDateTime,
      isHomeVisit,
      homeAddress,
      referralCode,
      commissionAllowed,
      savingsPlanId,
    } = c.req.valid("json");
    const payload = c.get("jwtPayload");
    if (!payload) {
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
    }
    const userId = payload.id!;
    if (!userId) {
      return c.json<TErrorResponse>(
        { ok: false, error: "User ID not found in token" },
        401
      );
    }

    if (isHomeVisit && !homeAddress?.trim()) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Home address is required for home screening" },
        400
      );
    }

    if (referralCode) {
      try {
        const { acceptReferralInvite } = await import("../lib/agent.service");
        await acceptReferralInvite(c, userId, referralCode, {
          commissionAllowed,
          preferredCenterId: centerId,
        });
      } catch (error) {
        console.error("Referral accept during booking:", error);
      }
    } else if (commissionAllowed !== undefined) {
      try {
        const { updateReferralConsent } = await import("../lib/agent.service");
        await updateReferralConsent(c, userId, {
          commissionAllowed,
          preferredCenterId: centerId,
        });
      } catch {
        /* no existing referral */
      }
    }

    const { resolveAttributionForPatient } = await import(
      "../lib/agent.service"
    );
    const { getAgentNetworkConfig } = await import(
      "../lib/agent-network-config"
    );
    const attribution = await resolveAttributionForPatient(c, userId);
    const networkConfig = getAgentNetworkConfig(c.env || {});

    const result = await db.serviceCenterScreeningType.findUnique({
      where: {
        centerId_screeningTypeId: {
          centerId: centerId!,
          screeningTypeId: screeningTypeId!,
        },
      },
      include: {
        screeningType: true, // Include screening type to get base price
      },
    });

    if (!result) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Screening type not available at this center" },
        400
      );
    }

    // Get base price and retail price for price snapshots
    const basePrice =
      result.screeningType.agreedPrice ?? result.screeningType.basePrice ?? 0;
    let retailPrice = result.amount; // The amount is the retail price set by the center
    if (isHomeVisit && networkConfig.homeScreeningEnabled) {
      retailPrice =
        Number(retailPrice) + Number(networkConfig.homeVisitSurchargeFlat);
    }

    // Savings plan can fully cover booking
    let coveredBySavings = false;
    if (savingsPlanId) {
      const supabase = getSupabaseClient(c);
      const { data: plan } = await supabase
        .from("SavingsPlan")
        .select("*")
        .eq("id", savingsPlanId)
        .eq("patientId", userId)
        .eq("status", "READY")
        .maybeSingle();
      if (plan && Number(plan.savedAmount) >= Number(retailPrice)) {
        coveredBySavings = true;
      }
    }

    // TODO: Validate input, authenticate user, verify payment with Paystack
    const paymentReference = `book-appointment-${
      payload.id
    }-${Date.now()}-${generateHexId(6)}`;

    // turn in transaction
    const transaction = await db.transaction.create({
      data: {
        type: "APPOINTMENT",
        status: coveredBySavings ? "COMPLETED" : "PENDING",
        amount: retailPrice,
        paymentReference, // store actual paystack payment reference
        paymentChannel: coveredBySavings ? "SAVINGS" : "PAYSTACK",
      },
    });

    const appointment = await db.appointment.create({
      data: {
        patientId: userId!,
        centerId: centerId!,
        screeningTypeId: screeningTypeId!,
        appointmentDateTime: new Date(appointmentDateTime!),
        isDonation: false,
        status: coveredBySavings ? "SCHEDULED" : "PENDING",
        transactionId: transaction.id!,
        basePriceSnapshot: basePrice,
        retailPriceSnapshot: retailPrice,
        isHomeVisit: Boolean(isHomeVisit),
        homeAddress: isHomeVisit ? homeAddress?.trim() : null,
        referralId: attribution.referral?.id || null,
        attributedAgentId: attribution.agentId,
        ...(coveredBySavings
          ? {
              checkInCode: generateHexId(6).toUpperCase(),
              checkInCodeExpiresAt: new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
              ),
            }
          : {}),
      },
      include: {
        transaction: true,
        center: true,
        screeningType: true,
        result: true,
      },
    });

    if (coveredBySavings && savingsPlanId) {
      const supabase = getSupabaseClient(c);
      await supabase
        .from("SavingsPlan")
        .update({
          status: "USED",
          appointmentId: appointment.id,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", savingsPlanId);

      return c.json({
        ok: true,
        data: {
          appointment,
          paidWithSavings: true,
          authorization_url: null,
        },
        message: "Appointment booked using your savings",
      });
    }

    let paystackResponse: {
      authorization_url?: string;
      access_code?: string;
    } | null = null;

    try {
      paystackResponse = await initializePaystackPayment(c, {
        email: payload.email!,
        amount: retailPrice * 100,
        reference: paymentReference,
        paymentType: "appointment_booking",
        patientId: userId,
        metadata: {
          appointmentId: appointment.id,
        },
      });
    } catch (paystackError) {
      console.error("Paystack initialization failed for booking:", paystackError);
      return c.json<TErrorResponse>(
        {
          ok: false,
          error:
            paystackError instanceof Error
              ? paystackError.message
              : "Failed to initialize payment",
        },
        502
      );
    }

    if (!paystackResponse?.authorization_url) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Payment provider did not return a checkout URL" },
        502
      );
    }

    // Strictly shape the appointment object to TPatientAppointment
    const safeAppointment = {
      id: appointment.id!,
      patientId: appointment.patientId!,
      centerId: appointment.centerId!,
      screeningTypeId: appointment.screeningTypeId!,
      appointmentDateTime: appointment.appointmentDateTime.toISOString(),
      isDonation: appointment.isDonation!,
      status: appointment.status!,
      transactionId:
        appointment.transactionId === null
          ? undefined
          : appointment.transactionId,
      checkInCode: appointment.checkInCode!,
      checkInCodeExpiresAt: appointment.checkInCodeExpiresAt
        ? appointment.checkInCodeExpiresAt.toISOString()
        : null,
      donationId:
        appointment.donationId === null ? undefined : appointment.donationId,
      center: appointment.center!
        ? {
            id: appointment.center.id!,
            centerName: appointment.center.centerName!,
            address: appointment.center.address!,
            state: appointment.center.state!,
            lga: appointment.center.lga!,
          }
        : undefined,
      screeningType: appointment.screeningType!
        ? {
            id: appointment.screeningType.id!,
            name: appointment.screeningType.name!,
          }
        : undefined,
      transaction: appointment.transaction!
        ? {
            id: appointment.transaction.id!,
            type: appointment.transaction.type!,
            status: appointment.transaction.status!,
            amount: appointment.transaction.amount!,
            paymentReference: appointment.transaction.paymentReference!,
            paymentChannel: appointment.transaction.paymentChannel!,
            createdAt:
              appointment.transaction.createdAt instanceof Date
                ? appointment.transaction.createdAt.toISOString()
                : String(appointment.transaction.createdAt),
          }
        : undefined,
      result: appointment.result ? { id: appointment.result.id! } : undefined, // Add more fields if needed
    };
    return c.json<TBookSelfPayAppointmentResponse>({
      ok: true,
      data: {
        appointment: safeAppointment,
        payment: {
              transactionId: paymentReference,
              reference: paymentReference,
              authorizationUrl: paystackResponse.authorization_url,
              accessCode: paystackResponse.access_code,
            },
      },
    });
    } catch (error) {
      console.error("Patient book appointment error:", error);
      return c.json<TErrorResponse>(
        { ok: false, error: "Failed to book appointment" },
        500
      );
    }
  }
);

// GET /api/appointment/patient/matches/eligible-centers/:allocationId
appointmentApp.get(
  "/patient/matches/eligible-centers/:allocationId",
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    if (!payload)
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
    const userId = payload.id!;
    const allocationId = c.req.param("allocationId");
    const page = parseInt(c.req.query("page") || "1", 10);
    const size = parseInt(c.req.query("size") || "20", 10);
    const state = c.req.query("state");
    const lga = c.req.query("lga");

    // Ensure allocation belongs to this patient and is not yet assigned to an appointment
    const allocation = await db.donationAllocation.findUnique({
      where: { id: allocationId },
      include: { waitlist: true },
    });
    if (
      !allocation ||
      allocation.patientId !== userId ||
      allocation.appointmentId
    ) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid or already assigned allocation" },
        400
      );
    }
    // Find all active centers offering this screening type
    const screeningTypeId = allocation.waitlist.screeningTypeId!;
    const [centers, total] = await Promise.all([
      db.serviceCenter.findMany({
        skip: (page - 1) * size,
        take: size,
        where: {
          services: { some: { id: screeningTypeId } },
          state: state || undefined,
          lga: lga || undefined,
          status: "ACTIVE",
        },
        select: {
          id: true,
          centerName: true,
          address: true,
          state: true,
          lga: true,
        },
      }),
      db.serviceCenter.count({
        where: {
          services: { some: { id: screeningTypeId } },
          state: state || undefined,
          lga: lga || undefined,
          status: "ACTIVE",
        },
      }),
    ]);

    return c.json<TGetEligibleCentersResponse>({
      ok: true,
      data: {
        centers,
        page,
        pageSize: size,
        total,
        totalPages: Math.ceil(centers.length / size),
      },
    });
  }
);

// POST /api/appointment/patient/matches/select-center
appointmentApp.post(
  "/patient/matches/select-center",
  zValidator("json", selectCenterSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    if (!payload)
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
    const userId = payload.id!;
    const { allocationId, centerId, appointmentDateTime } = c.req.valid("json");

    // Validate allocation
    const allocation = await db.donationAllocation.findUnique({
      where: { id: allocationId },
      include: { waitlist: true },
    });

    if (
      !allocation ||
      allocation.patientId !== userId ||
      allocation.appointmentId
    ) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Invalid or already assigned allocation" },
        400
      );
    }

    // Create appointment and link to allocation
    const appointment = await db.appointment.create({
      data: {
        patientId: userId,
        centerId: centerId!,
        screeningTypeId: allocation.waitlist.screeningTypeId!,
        isDonation: true,
        status: "SCHEDULED",
        appointmentDateTime: new Date(appointmentDateTime!),
        donationId: allocation.campaignId!,
        checkInCode: generateHexId(6).toUpperCase(),
        checkInCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        allocation: {
          connect: { id: allocationId! },
        },
      },
      include: {
        center: true,
        screeningType: true,
        transaction: true,
        result: true,
      },
    });

    // Update allocation and waitlist status
    await db.$transaction(async (tx) => {
      const claimedAtDate = new Date();
      await tx.donationAllocation.update({
        where: { id: allocationId! },
        data: {
          appointmentId: appointment.id!,
          claimedAt: claimedAtDate,
        },
      });

      await tx.waitlist.update({
        where: { id: allocation.waitlist.id! },
        data: { status: "CLAIMED", claimedAt: claimedAtDate },
      });
    });

    console.log("I have updated allocations and waitlist statuses");

    const safeAppointment = {
      id: appointment.id!,
      patientId: appointment.patientId!,
      centerId: appointment.centerId!,
      screeningTypeId: appointment.screeningTypeId!,
      appointmentDateTime: appointment.appointmentDateTime.toISOString(),
      isDonation: appointment.isDonation!,
      status: appointment.status!,
      transactionId:
        appointment.transactionId === null
          ? undefined
          : appointment.transactionId,
      checkInCode: appointment.checkInCode!,
      checkInCodeExpiresAt: appointment.checkInCodeExpiresAt
        ? appointment.checkInCodeExpiresAt.toISOString()
        : null,
      donationId:
        appointment.donationId === null ? undefined : appointment.donationId,
      center: appointment.center
        ? {
            id: appointment.center.id!,
            centerName: appointment.center.centerName!,
            address: appointment.center.address!,
            state: appointment.center.state!,
            lga: appointment.center.lga!,
          }
        : undefined,
      screeningType: appointment.screeningType
        ? {
            id: appointment.screeningType.id!,
            name: appointment.screeningType.name!,
          }
        : undefined,
      transaction: appointment.transaction
        ? {
            id: appointment.transaction.id!,
            type: appointment.transaction.type!,
            status: appointment.transaction.status!,
            amount: appointment.transaction.amount!,
            paymentReference: appointment.transaction.paymentReference!,
            paymentChannel: appointment.transaction.paymentChannel!,
            createdAt: appointment.transaction.createdAt.toISOString(),
          }
        : undefined,
      result: appointment.result ? { id: appointment.result.id! } : undefined, // Add more fields if needed
    };
    return c.json<TSelectCenterResponse>({
      ok: true,
      data: { appointment: safeAppointment },
    });
  }
);

// GET /api/appointment/patient - List patient appointments
appointmentApp.get(
  "/patient",
  zValidator("query", getPatientAppointmentsSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    if (!payload)
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
    const userId = payload.id!;
    const page = parseInt(c.req.query("page") || "1", 10);
    const size = parseInt(c.req.query("size") || "20", 10);
    const status = c.req.query("status");
    const where: any = {
      patientId: userId,
    };
    if (status) where.status = status;
    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        orderBy: { appointmentDateTime: "desc" },
        include: {
          center: {
            select: {
              id: true,
              centerName: true,
              address: true,
              state: true,
              lga: true,
            },
          },
          screeningType: { select: { id: true, name: true } },
          transaction: true,
          result: true,
        },
      }),
      db.appointment.count({ where }),
    ]);
    const safeAppointments = appointments.map((a) => ({
      id: a.id!,
      patientId: a.patientId!,
      centerId: a.centerId!,
      screeningTypeId: a.screeningTypeId!,
      appointmentDateTime: a.appointmentDateTime.toISOString(),
      isDonation: a.isDonation!,
      status: a.status!,
      transactionId: a.transactionId === null ? undefined : a.transactionId,
      checkInCode: a.checkInCode!,
      checkInCodeExpiresAt: a.checkInCodeExpiresAt
        ? a.checkInCodeExpiresAt.toISOString()
        : null,
      donationId: a.donationId === null ? undefined : a.donationId,
      center: a.center
        ? {
            id: a.center.id!,
            centerName: a.center.centerName!,
            address: a.center.address!,
            state: a.center.state!,
            lga: a.center.lga!,
          }
        : undefined,
      screeningType: a.screeningType
        ? { id: a.screeningType.id!, name: a.screeningType.name! }
        : undefined,
      transaction: a.transaction
        ? {
            id: a.transaction.id!,
            type: a.transaction.type!,
            status: a.transaction.status!,
            amount: a.transaction.amount!,
            paymentReference: a.transaction.paymentReference!,
            paymentChannel: a.transaction.paymentChannel!,
            createdAt: a.transaction.createdAt.toISOString(),
          }
        : undefined,
      result: a.result ? { id: a.result.id! } : undefined, // Add more fields if needed
    }));
    return c.json<TGetPatientAppointmentsResponse>({
      ok: true,
      data: {
        appointments: safeAppointments,
        page,
        pageSize: size,
        total,
        totalPages: Math.ceil(total / size),
      },
    });
  }
);

// GET /api/appointment/patient/results - List patient results
// appointmentApp.get(
//   "/results",
//   zValidator("query", getPatientResultsSchema, (result, c) => {
//     if (!result.success)
//       return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
//   }),
//   async (c) => {
//     const db = getDB(c);
//     const payload = c.get("jwtPayload");
//     const patientId = payload?.id!;
//     const { page = 1, pageSize = 20 } = c.req.valid("query");

//     const [results, total] = await Promise.all([
//       db.screeningResult.findMany({
//         where: {
//           appointment: { patientId },
//         },
//         skip: (Number(page) - 1) * Number(pageSize),
//         take: Number(pageSize),
//         orderBy: { uploadedAt: "desc" },
//         include: {
//           appointment: {
//             select: {
//               id: true,
//               appointmentDate: true,
//               appointmentTime: true,
//               screeningType: { select: { id: true, name: true } },
//               center: { select: { id: true, centerName: true } },
//             },
//           },
//           files: {
//             orderBy: { filePath: "asc" },
//           },
//         },
//       }),
//       db.screeningResult.count({
//         where: {
//           appointment: { patientId },
//         },
//       }),
//     ]);

//     // Helper function to group files by folder
//     const groupFilesByFolder = (files: any[]): Record<string, any[]> => {
//       return files.reduce((acc, file) => {
//         const folderName = file.filePath.includes("/")
//           ? file.filePath.split("/")[0]
//           : "root";

//         if (!acc[folderName]) {
//           acc[folderName] = [];
//         }
//         acc[folderName].push(file);
//         return acc;
//       }, {});
//     };

//     // Format the response
//     const processedResults = results.map((result) => ({
//       id: result.id,
//       notes: result.notes,
//       uploadedAt: result.uploadedAt.toISOString(),
//       appointment: {
//         id: result.appointment.id,
//         appointmentDate: result.appointment.appointmentDate.toISOString(),
//         appointmentTime: result.appointment.appointmentTime?.toISOString(),
//         screeningType: result.appointment.screeningType,
//         center: result.appointment.center,
//       },
//       files: result.files.map((file) => ({
//         id: file.id,
//         fileName: file.fileName,
//         filePath: file.filePath,
//         fileType: file.fileType,
//         fileSize: file.fileSize,
//         url: file.cloudinaryUrl,
//         uploadedAt: file.uploadedAt.toISOString(),
//         isDeleted: file.isDeleted,
//       })),
//       folders: groupFilesByFolder(result.files),
//     }));

//     return c.json<TGetPatientResultsResponse>({
//       ok: true,
//       data: {
//         results: processedResults,
//         page: Number(page),
//         pageSize: Number(pageSize),
//         total,
//         totalPages: Math.ceil(total / Number(pageSize)),
//       },
//     });
//   }
// );

// GET /api/appointment/patient/results/:id - Get specific patient result
appointmentApp.get(
  "/patient/results/:id",
  zValidator("param", getPatientResultByIdSchema, (result, c) => {
    if (!result.success)
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
  }),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    const patientId = payload?.id!;
    const { id } = c.req.valid("param");

    const result = await db.screeningResult.findFirst({
      where: {
        id,
        appointment: { patientId },
      },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDateTime: true,
            screeningType: { select: { id: true, name: true } },
            center: { select: { id: true, centerName: true, address: true } },
          },
        },
        files: {
          orderBy: { filePath: "asc" },
        },
      },
    });

    if (!result) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Result not found" },
        404
      );
    }

    // Helper function to group files by folder
    const groupFilesByFolder = (files: any[]): Record<string, any[]> => {
      return files.reduce((acc, file) => {
        const folderName = file.filePath.includes("/")
          ? file.filePath.split("/")[0]
          : "root";

        if (!acc[folderName]) {
          acc[folderName] = [];
        }
        acc[folderName].push(file);
        return acc;
      }, {});
    };

    return c.json<TGetPatientResultByIdResponse>({
      ok: true,
      data: {
        id: result.id,
        notes: result.notes,
        uploadedAt: result.uploadedAt.toISOString(),
        appointment: {
          id: result.appointment.id,
          appointmentDateTime:
            result.appointment.appointmentDateTime.toISOString(),
          screeningType: result.appointment.screeningType,
          center: result.appointment.center,
        },
        files: result.files.map((file) => ({
          id: file.id,
          fileName: file.fileName,
          filePath: file.filePath,
          fileType: file.fileType,
          fileSize: file.fileSize,
          cloudinaryUrl: file.cloudinaryUrl,
          uploadedAt: file.uploadedAt.toISOString(),
          isDeleted: file.isDeleted,
        })),
        folders: groupFilesByFolder(result.files),
      },
    });
  }
);

// // GET /api/appointment/patient/receipts - List patient receipts
// appointmentApp.get(
//   "/patient/receipts",
//   zValidator("query", getPatientReceiptsSchema, (result, c) => {
//     if (!result.success)
//       return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
//   }),
//   async (c) => {
//     const db = getDB(c);
//     const payload = c.get("jwtPayload");
//     if (!payload)
//       return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
//     const userId = payload.id!;
//     const page = parseInt(c.req.query("page") || "1", 10);
//     const size = parseInt(c.req.query("size") || "20", 10);
//     const [receipts, total] = await Promise.all([
//       db.transaction.findMany({
//         where: { appointments: { some: { patientId: userId } } },
//         skip: (page - 1) * size,
//         take: size,
//         orderBy: { createdAt: "desc" },
//         include: {
//           appointments: {
//             select: {
//               id: true,
//               appointmentDate: true,
//               screeningType: { select: { id: true, name: true } },
//               patientId: true,
//             },
//           },
//         },
//       }),
//       db.transaction.count({
//         where: { appointments: { some: { patientId: userId } } },
//       }),
//     ]);
//     const safeReceipts = receipts.map((r) => ({
//       id: r.id!,
//       appointments: r.appointments.map((a) => ({
//         id: a.id!,
//         appointmentDate: a.appointmentDate.toISOString(),
//         screeningType: { id: a.screeningType.id!, name: a.screeningType.name! },
//         patientId: a.patientId!,
//       })),
//       createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
//     }));
//     return c.json<TGetPatientReceiptsResponse>({
//       ok: true,
//       data: {
//         receipts: safeReceipts,
//         page,
//         pageSize: size,
//         total,
//         totalPages: Math.ceil(total / size),
//       },
//     });
//   }
// );

// GET /api/appointment/patient/receipts/:id - Get specific patient receipt
appointmentApp.get("/patient/receipts/:id", async (c) => {
  const db = getDB(c);
  const payload = c.get("jwtPayload");
  if (!payload)
    return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
  const userId = payload.id!;
  const id = c.req.param("id");
  const receipt = await db.transaction.findUnique({
    where: { id },
    include: {
      appointments: {
        select: {
          id: true,
          patientId: true,
          appointmentDateTime: true,
          screeningType: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!receipt || !receipt.appointments.some((a) => a.patientId === userId)) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Not found or forbidden" },
      404
    );
  }
  const safeReceipt = {
    id: receipt.id!,
    appointments: receipt.appointments.map((a) => ({
      id: a.id!,
      appointmentDateTime: a.appointmentDateTime.toISOString(),
      screeningType: { id: a.screeningType.id!, name: a.screeningType.name! },
      patientId: a.patientId!,
    })),
    createdAt: receipt.createdAt ? receipt.createdAt.toISOString() : undefined,
  };
  return c.json<TGetPatientReceiptResponse>({ ok: true, data: safeReceipt });
});

// GET /api/appointment/patient/:id - Get appointment details by ID
appointmentApp.get("/patient/:id", async (c) => {
  const db = getDB(c);
  const payload = c.get("jwtPayload");
  if (!payload)
    return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);

  const userId = payload.id!;
  const id = c.req.param("id");

  const appointment = await db.appointment.findUnique({
    where: { id },
    include: {
      center: {
        select: {
          id: true,
          centerName: true,
          address: true,
          state: true,
          lga: true,
          phone: true,
          email: true,
        },
      },
      screeningType: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      transaction: true,
      result: {
        include: {
          files: {
            where: { isDeleted: false },
            select: {
              id: true,
              fileName: true,
              fileType: true,
              cloudinaryUrl: true,
              uploadedAt: true,
            },
          },
        },
      },
      verification: {
        include: {
          verifier: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!appointment || appointment.patientId !== userId) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Appointment not found" },
      404
    );
  }

  const safeAppointment = {
    id: appointment.id!,
    patientId: appointment.patientId!,
    centerId: appointment.centerId!,
    screeningTypeId: appointment.screeningTypeId!,
    appointmentDateTime: appointment.appointmentDateTime.toISOString(),
    isDonation: appointment.isDonation!,
    status: appointment.status!,
    transactionId:
      appointment.transactionId === null
        ? undefined
        : appointment.transactionId,
    checkInCode: appointment.checkInCode!,
    checkInCodeExpiresAt: appointment.checkInCodeExpiresAt
      ? appointment.checkInCodeExpiresAt.toISOString()
      : null,
    donationId:
      appointment.donationId === null ? undefined : appointment.donationId,
    cancellationReason:
      appointment.cancellationReason === null
        ? undefined
        : appointment.cancellationReason,
    cancellationDate: appointment.cancellationDate
      ? appointment.cancellationDate.toISOString()
      : undefined,
    createdAt: appointment.createdAt.toISOString(),
    center: appointment.center
      ? {
          id: appointment.center.id!,
          centerName: appointment.center.centerName!,
          address: appointment.center.address!,
          state: appointment.center.state!,
          lga: appointment.center.lga!,
          phoneNumber: appointment.center.phone!,
          email: appointment.center.email!,
        }
      : undefined,
    screeningType: appointment.screeningType
      ? {
          id: appointment.screeningType.id!,
          name: appointment.screeningType.name!,
          description:
            appointment.screeningType.description === null
              ? undefined
              : appointment.screeningType.description,
        }
      : undefined,
    transaction: appointment.transaction
      ? {
          id: appointment.transaction.id!,
          type: appointment.transaction.type!,
          status: appointment.transaction.status!,
          amount: appointment.transaction.amount!,
          paymentReference: appointment.transaction.paymentReference!,
          paymentChannel: appointment.transaction.paymentChannel!,
          createdAt: appointment.transaction.createdAt.toISOString(),
        }
      : undefined,
    result: appointment.result
      ? {
          id: appointment.result.id!,
          notes:
            appointment.result.notes === null
              ? undefined
              : appointment.result.notes,
          uploadedAt: appointment.result.uploadedAt.toISOString(),
          files: appointment.result.files.map((file) => ({
            id: file.id!,
            fileName: file.fileName!,
            fileType: file.fileType!,
            cloudinaryUrl: file.cloudinaryUrl!,
            uploadedAt: file.uploadedAt.toISOString(),
          })),
        }
      : undefined,
    verification: appointment.verification
      ? {
          id: appointment.verification.id!,
          verifiedAt: appointment.verification.verifiedAt.toISOString(),
          verifier: appointment.verification.verifier
            ? {
                id: appointment.verification.verifier.id!,
                email: appointment.verification.verifier.email!,
              }
            : undefined,
        }
      : undefined,
  };

  return c.json<TGetPatientAppointmentByIdResponse>({
    ok: true,
    data: safeAppointment,
  });
});

// POST /api/appointment/patient/:id/cancel - Patient cancels their appointment
appointmentApp.post(
  "/patient/:id/cancel",
  zValidator("json", cancelCenterAppointmentSchema, (result, c) => {
    if (!result.success) {
      return c.json<TErrorResponse>({ ok: false, error: result.error }, 400);
    }
  }),
  async (c) => {
    const db = getDB(c);
    const payload = c.get("jwtPayload");
    if (!payload) {
      return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");
    const { reason } = c.req.valid("json");
    const appointment = await db.appointment.findUnique({ where: { id } });

    if (!appointment || appointment.patientId !== payload.id) {
      return c.json<TErrorResponse>(
        { ok: false, error: "Appointment not found." },
        404
      );
    }

    if (appointment.status === "CANCELLED") {
      return c.json<TErrorResponse>(
        { ok: false, error: "Already cancelled." },
        400
      );
    }

    if (!["SCHEDULED", "PENDING"].includes(appointment.status)) {
      return c.json<TErrorResponse>(
        {
          ok: false,
          error: "Only scheduled appointments can be cancelled.",
        },
        400
      );
    }

    await db.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancellationReason: reason || "Cancelled by patient",
        cancellationDate: new Date(),
      },
    });

    return c.json<TCancelCenterAppointmentResponse>({
      ok: true,
      data: { id: id! },
    });
  }
);

// GET /api/appointment/patient/:id/checkin-code - Get appointment check-in code
appointmentApp.get("/patient/:id/checkin-code", async (c) => {
  const db = getDB(c);
  const payload = c.get("jwtPayload");
  if (!payload)
    return c.json<TErrorResponse>({ ok: false, error: "Unauthorized" }, 401);
  const userId = payload.id!;
  const id = c.req.param("id");
  const appointment = await db.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      patientId: true,
      checkInCode: true,
      checkInCodeExpiresAt: true,
      appointmentDateTime: true,
      status: true,
    },
  });
  if (!appointment || appointment.patientId !== userId) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Not found or forbidden" },
      404
    );
  }
  // Optionally, check if code is expired
  if (
    appointment.checkInCodeExpiresAt &&
    new Date() > appointment.checkInCodeExpiresAt
  ) {
    return c.json<TErrorResponse>(
      { ok: false, error: "Check-in code expired" },
      410
    );
  }
  return c.json<TGetCheckInCodeResponse>({
    ok: true,
    data: {
      checkInCode: appointment.checkInCode!,
      expiresAt: appointment.checkInCodeExpiresAt
        ? appointment.checkInCodeExpiresAt.toISOString()
        : null,
    },
  });
});
