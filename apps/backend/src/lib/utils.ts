import { JsonObject } from "@prisma/client/runtime/library";
import { TDonationCampaign, TtriggerMatchingParams } from "@zerocancer/shared";
import bcrypt from "bcryptjs";
import { env } from "hono/adapter";
import { getDB } from "./db";
import { sendNotificationEmail } from "./email";
import { TEnvs } from "./types";
import { waitlistMatcherAlg } from "./waitlistMatchingAlg";

export function generateHexId(length: number = 6) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Utility to create a notification for one or more users.
 *
 * This function handles both in-app notifications and optional email notifications
 * for important events like successful matching between patients and donors.
 *
 * Notification Types:
 * - MATCHED: Patient successfully matched to a campaign
 * - PATIENT_MATCHED: Donor notified about patient match
 * - INFO: General information notifications
 * - WARNING: Important warnings requiring attention
 *
 * @param params.type Notification type (e.g., 'MATCHED', 'INFO', etc.)
 * @param params.title Notification title for display
 * @param params.message Detailed notification message
 * @param params.userIds Array of user IDs to notify
 * @param params.data Optional extra data (screening details, campaign info, etc.)
 * @param email Whether to send email notifications in addition to in-app
 * @returns Promise<Notification> Created notification object
 */
export async function createNotificationForUsers(
  c: any,
  {
    type,
    title,
    message,
    userIds,
    data,
  }: {
    type: string;
    title: string;
    message: string;
    userIds: string[];
    data?: JsonObject | undefined;
  },
  email = false
) {
  const db = getDB(c);

  // Send emails if requested
  if (email) {
    try {
      // Fetch user emails
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { email: true, fullName: true },
      });

      const emails = users.map((u) => u.email).filter(Boolean);

      if (emails.length > 0) {
        sendNotificationEmail(c, {
          to: emails,
          type: "INFO",
          title: "New Notification",
          message: "You have a new notification.",
          data: { userIds },
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Failed to send email notifications:", errorMessage);
      // Don't throw error here as we still want to create the notification
    }
  }

  // Create the notification in database
  return db.notification.create({
    data: {
      type,
      title,
      message,
      data,
      recipients: {
        create: userIds.map((userId) => ({ userId })),
      },
    },
  });
}

export async function triggerWaitlistMatching(
  c: any,
  customConfig?: TtriggerMatchingParams
) {
  // Removed compute client integration on 2025-08-08
  await waitlistMatcherAlg(c, customConfig);

  return {
    ok: true,
    message: "Matching process triggered successfully",
  };
}

export async function getUserWithProfiles(
  c: any,
  { email }: { email: string }
) {
  const db = getDB(c);
  const user = await db.user.findUnique({
    where: { email: email! },
    include: {
      donorProfile: { select: { id: true, emailVerified: true } },
      patientProfile: { select: { id: true, emailVerified: true } },
    },
  });
  //   if (!user)
  //     return {
  //       user: null,
  //       profiles: [],
  //     };

  const userProfiles: ("PATIENT" | "DONOR")[] = [];
  if (user?.donorProfile) {
    userProfiles.push("DONOR");
  }
  if (user?.patientProfile) {
    userProfiles.push("PATIENT");
  }
  return { user, profiles: userProfiles };
}

// Helper function to format campaign for API response
export function formatCampaignForResponse(campaign: any): TDonationCampaign {
  let targetGender: "MALE" | "FEMALE" | "ALL" | undefined;

  if (campaign.targetGender === null || campaign.targetGender === undefined) {
    targetGender = "ALL";
  } else if (campaign.targetGender === "MALE") {
    targetGender = "MALE";
  } else {
    targetGender = "FEMALE";
  }

  const patientsHelped = campaign.allocations?.reduce(
    (count: number, allocation: any) => {
      // Count only allocations with completed appointments
      return count + (allocation.appointment?.status === "COMPLETED" ? 1 : 0);
    },
    0
  );

  const patientAppointmentInProgress = campaign.allocations?.reduce(
    (count: number, allocation: any) => {
      // Count only allocations with completed appointments
      return count + (allocation.appointment?.status === "IN_PROGRESS" ? 1 : 0);
    },
    0
  );

  const patientAppointmentScheduled = campaign.allocations?.reduce(
    (count: number, allocation: any) => {
      // Count only allocations with completed appointments
      return count + (allocation.appointment?.status === "IN_PROGRESS" ? 1 : 0);
    },
    0
  );

  const patientPendingAcceptance = campaign.allocations?.reduce(
    (count: number, allocation: any) => {
      // Count only allocations with completed appointments
      return count + (allocation.appointment?.status === "PENDING" ? 1 : 0);
    },
    0
  );

  return {
    id: campaign.id ?? "unknown-campaign-id",
    donorId: campaign.donorId,
    title: campaign.title || "Untitled Campaign",
    description: campaign.purpose || "",
    fundingAmount: campaign.totalAmount,
    usedAmount: campaign.totalAmount - (campaign.availableAmount || 0),
    targetGender,
    targetAgeMin: campaign.targetAgeRange?.split("-")[0]
      ? parseInt(campaign.targetAgeRange.split("-")[0])
      : undefined,
    targetAgeMax: campaign.targetAgeRange?.split("-")[1]
      ? parseInt(campaign.targetAgeRange.split("-")[1])
      : undefined,
    targetStates: campaign.targetStates || [],
    targetLgas: campaign.targetLgas || [],
    status: campaign.status as
      | "ACTIVE"
      | "COMPLETED"
      | "DELETED"
      | "PENDING"
      | "SUSPENDED",
    expiryDate: campaign.expiryDate?.toISOString() || null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.createdAt.toISOString(),
    donor: {
      id: campaign.donor.id,
      fullName: campaign.donor.fullName,
      email: campaign.donor.email,
      organizationName: campaign.donor.donorProfile?.organizationName,
    },
    screeningTypes: campaign.screeningTypes || [],
    patientAllocations: {
      patientsHelped,
      patientPendingAcceptance,
      patientAppointmentInProgress,
      patientAppointmentScheduled,
      allocationsCount: campaign.allocations?.length || 0,
    },
  };
}

export function displayEnvVars(c: any) {
  const {
    ENV_MODE,
    DATABASE_URL,
    JWT_TOKEN_SECRET,
    FRONTEND_URL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    PAYSTACK_SECRET_KEY,
    PAYSTACK_PUBLIC_KEY,
    CRON_API_KEY,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    WAITLIST_BATCH_SIZE,
    WAITLIST_MAX_TOTAL,
    WAITLIST_PARALLEL,
    WAITLIST_CONCURRENT,
    WAITLIST_DEMOGRAPHICS,
    WAITLIST_GEOGRAPHIC_TARGETING,
    WAITLIST_EXPIRY_DAYS,
  } = env<TEnvs>(c);

  const envVars = {
    ENV_MODE,
    DATABASE_URL: DATABASE_URL ? "***SET***" : "NOT SET",
    JWT_TOKEN_SECRET: JWT_TOKEN_SECRET ? "***SET***" : "NOT SET",
    FRONTEND_URL: FRONTEND_URL ?? "NOT SET",
    SMTP_HOST: SMTP_HOST ?? "NOT SET",
    SMTP_PORT: SMTP_PORT ?? "NOT SET",
    SMTP_USER: SMTP_USER ?? "NOT SET",
    SMTP_PASS: SMTP_PASS ? "***SET***" : "NOT SET",
    PAYSTACK_SECRET_KEY: PAYSTACK_SECRET_KEY ? "***SET***" : "NOT SET",
    PAYSTACK_PUBLIC_KEY: PAYSTACK_PUBLIC_KEY ? "***SET***" : "NOT SET",
    CRON_API_KEY: CRON_API_KEY ? "***SET***" : "NOT SET",
    CLOUDINARY_CLOUD_NAME: CLOUDINARY_CLOUD_NAME ?? "NOT SET",
    CLOUDINARY_API_KEY: CLOUDINARY_API_KEY ? "***SET***" : "NOT SET",
    CLOUDINARY_API_SECRET: CLOUDINARY_API_SECRET ? "***SET***" : "NOT SET",
    WAITLIST_BATCH_SIZE: WAITLIST_BATCH_SIZE ?? "NOT SET",
    WAITLIST_MAX_TOTAL: WAITLIST_MAX_TOTAL ?? "NOT SET",
    WAITLIST_PARALLEL: WAITLIST_PARALLEL ?? "NOT SET",
    WAITLIST_CONCURRENT: WAITLIST_CONCURRENT ?? "NOT SET",
    WAITLIST_DEMOGRAPHICS: WAITLIST_DEMOGRAPHICS ?? "NOT SET",
    WAITLIST_GEOGRAPHIC_TARGETING: WAITLIST_GEOGRAPHIC_TARGETING ?? "NOT SET",
    WAITLIST_EXPIRY_DAYS: WAITLIST_EXPIRY_DAYS ?? "NOT SET",
  };

  return envVars;
}
