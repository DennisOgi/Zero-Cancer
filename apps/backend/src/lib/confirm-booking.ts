import { assignPatientToCenter } from "./patient-center-utils";
import { getSupabaseClient } from "./supabase";
import { createNotificationForUsers } from "./utils";

export async function notifyCenterNewAppointment(
  c: any,
  params: {
    centerId: string;
    appointmentId: string;
    patientName?: string;
    screeningName?: string;
    whenLabel?: string;
  }
) {
  const supabase = getSupabaseClient(c);
  const title = "New appointment booked";
  const message = params.patientName
    ? `${params.patientName} booked ${params.screeningName || "a screening"}${
        params.whenLabel ? ` for ${params.whenLabel}` : ""
      }.`
    : "A patient booked a screening at your facility.";

  const { data: notification, error } = await supabase
    .from("Notification")
    .insert({
      id: crypto.randomUUID(),
      type: "NEW_APPOINTMENT",
      title,
      message,
      data: JSON.stringify({
        appointmentId: params.appointmentId,
        centerId: params.centerId,
      }),
    })
    .select("id")
    .single();

  if (error || !notification?.id) {
    console.error("Failed to create facility appointment notification:", error);
    return;
  }

  const { error: recipientError } = await supabase
    .from("NotificationRecipient")
    .insert({
      id: crypto.randomUUID(),
      notificationId: notification.id,
      centerId: params.centerId,
      userId: null,
      read: false,
    });

  if (recipientError) {
    console.error(
      "Failed to attach facility appointment notification:",
      recipientError
    );
  }
}

export async function connectPatientAfterBooking(
  c: any,
  params: {
    patientId: string;
    centerId: string;
    appointmentId: string;
    patientName?: string;
    screeningName?: string;
    appointmentDateTime?: Date | string;
  }
) {
  try {
    const assigned = await assignPatientToCenter(
      c,
      params.patientId,
      params.centerId,
      { skipLocationCheck: true }
    );
    if ("error" in assigned) {
      const supabase = getSupabaseClient(c);
      await supabase
        .from("PatientProfile")
        .update({ assignedCenterId: params.centerId })
        .eq("userId", params.patientId);
    }
  } catch (error) {
    console.error("Failed to assign booked patient to center:", error);
  }

  const when = params.appointmentDateTime
    ? new Date(params.appointmentDateTime).toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : undefined;

  try {
    await notifyCenterNewAppointment(c, {
      centerId: params.centerId,
      appointmentId: params.appointmentId,
      patientName: params.patientName,
      screeningName: params.screeningName,
      whenLabel: when,
    });
  } catch (error) {
    console.error("Failed to notify facility of booking:", error);
  }

  try {
    await createNotificationForUsers(c, {
      type: "APPOINTMENT_CONFIRMED",
      title: "Appointment confirmed",
      message: params.screeningName
        ? `Your ${params.screeningName} appointment is confirmed${
            when ? ` for ${when}` : ""
          }.`
        : "Your screening appointment is confirmed.",
      userIds: [params.patientId],
      data: { appointmentId: params.appointmentId, centerId: params.centerId },
    });
  } catch (error) {
    console.error("Failed to notify patient of booking:", error);
  }
}

/**
 * A cancelled donation-funded appointment hands its allocation back to the
 * patient, so they can book another center with the same funding.
 */
export async function releaseDonationAllocation(c: any, appointmentId: string) {
  const supabase = getSupabaseClient(c);
  const { data: allocations, error } = await supabase
    .from("DonationAllocation")
    .update({ appointmentId: null, claimedAt: null })
    .eq("appointmentId", appointmentId)
    .select("waitlistId");
  if (error) throw error;

  const waitlistIds = (allocations || [])
    .map((allocation: { waitlistId: string | null }) => allocation.waitlistId)
    .filter(Boolean);
  if (waitlistIds.length) {
    await supabase
      .from("Waitlist")
      .update({ status: "MATCHED", claimedAt: null })
      .in("id", waitlistIds)
      .eq("status", "CLAIMED");
  }
}
