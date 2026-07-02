import type { Context } from "hono";
import { env } from "hono/adapter";
import type { TtriggerMatchingParams } from "@zerocancer/shared";
import { getDB } from "./db";
import { locationInList } from "./location-utils";
import { getSupabaseClient } from "./supabase";
import type { TEnvs } from "./types";
import { createNotificationForUsers } from "./utils";
import { WhatsAppService } from "./whatsapp";

type WaitlistRow = {
  id: string;
  patientId: string;
  screeningTypeId: string;
  status: string;
  joinedAt: string;
  enrolledByCenterId: string | null;
};

type CampaignRow = {
  id: string;
  donorId: string;
  title: string;
  availableAmount: number;
  targetGender: string | null;
  targetAgeRange: string | null;
  targetStates: string;
  targetLgas: string;
  targetAssociationId: string | null;
  targetGroupId: string | null;
  targetIndividualId: string | null;
  targetPhone: string | null;
  createdAt: string;
  screeningTypeIds: string[];
};

type PatientContext = {
  userId: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  city: string | null;
  state: string | null;
  associationId: string | null;
  groupId: string | null;
  assignedCenterId: string | null;
  unclaimedAllocations: number;
};

type ScreeningTypeRow = {
  id: string;
  name: string;
  agreedPrice: number;
};

const GENERAL_POOL_ID = "general-donor-pool";
const MAX_UNCLAIMED_ALLOCATIONS = 3;
const GENERAL_POOL_MAX_RANK = 1000;

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseAgeRange(ageRange: string): [number, number] {
  const [min, max] = ageRange.split("-").map(Number);
  return [min || 0, max || 999];
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function patientMatchesCampaign(
  patient: PatientContext,
  campaign: CampaignRow,
  enableTargeting: boolean
): boolean {
  if (!enableTargeting) return true;

  if (
    campaign.targetIndividualId &&
    campaign.targetIndividualId !== patient.userId
  ) {
    return false;
  }

  if (campaign.targetPhone && campaign.targetPhone !== patient.phone) {
    return false;
  }

  if (
    campaign.targetAssociationId &&
    campaign.targetAssociationId !== patient.associationId
  ) {
    return false;
  }

  if (campaign.targetGroupId && campaign.targetGroupId !== patient.groupId) {
    return false;
  }

  const patientAge = calculateAge(patient.dateOfBirth);

  if (campaign.targetAgeRange) {
    const [ageMin, ageMax] = parseAgeRange(campaign.targetAgeRange);
    if (patientAge != null && (patientAge < ageMin || patientAge > ageMax)) {
      return false;
    }
  }

  if (campaign.targetGender) {
    if (!patient.gender || campaign.targetGender !== patient.gender) {
      return false;
    }
  }

  const targetStates = parseJsonArray(campaign.targetStates);
  if (targetStates.length > 0) {
    if (!patient.state || !locationInList(patient.state, targetStates)) {
      return false;
    }
  }

  const targetLgas = parseJsonArray(campaign.targetLgas);
  if (targetLgas.length > 0) {
    if (!patient.city || !locationInList(patient.city, targetLgas)) {
      return false;
    }
  }

  return true;
}

function targetingScore(patient: PatientContext, campaign: CampaignRow): number {
  let score = 0;

  if (campaign.targetIndividualId === patient.userId) score += 1000;
  if (campaign.targetPhone && campaign.targetPhone === patient.phone) score += 1000;
  if (campaign.targetAssociationId === patient.associationId) score += 500;
  if (campaign.targetGroupId === patient.groupId) score += 500;

  const patientAge = calculateAge(patient.dateOfBirth);
  if (patientAge != null && campaign.targetAgeRange) {
    const [ageMin, ageMax] = parseAgeRange(campaign.targetAgeRange);
    if (patientAge >= ageMin && patientAge <= ageMax) score += 10;
  }

  if (campaign.targetGender && patient.gender === campaign.targetGender) {
    score += 15;
  }

  const targetStates = parseJsonArray(campaign.targetStates);
  if (patient.state && locationInList(patient.state, targetStates)) score += 20;

  const targetLgas = parseJsonArray(campaign.targetLgas);
  if (patient.city && locationInList(patient.city, targetLgas)) score += 25;

  return score;
}

function selectBestCampaign(
  patient: PatientContext,
  campaigns: CampaignRow[],
  generalPool: CampaignRow | null,
  price: number,
  rank: number,
  enableTargeting: boolean
): CampaignRow | null {
  const eligible = campaigns.filter(
    (campaign) =>
      campaign.id !== GENERAL_POOL_ID &&
      patientMatchesCampaign(patient, campaign, enableTargeting) &&
      campaign.availableAmount >= price
  );

  if (eligible.length > 0) {
    eligible.sort((a, b) => {
      const scoreDiff = targetingScore(b, patient) - targetingScore(a, patient);
      if (scoreDiff !== 0) return scoreDiff;

      const specificity =
        a.screeningTypeIds.length - b.screeningTypeIds.length;
      if (specificity !== 0) return specificity;

      if (b.availableAmount !== a.availableAmount) {
        return b.availableAmount - a.availableAmount;
      }

      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
    return eligible[0];
  }

  if (
    generalPool &&
    generalPool.availableAmount >= price &&
    rank <= GENERAL_POOL_MAX_RANK
  ) {
    return generalPool;
  }

  return null;
}

export async function runWaitlistMatching(
  c: Context,
  customConfig?: TtriggerMatchingParams
) {
  const supabase = getSupabaseClient(c);
  const db = getDB(c);
  const { WAITLIST_MAX_TOTAL } = env<TEnvs>(c);

  const maxMatches =
    customConfig?.maxTotalPatients ??
    parseInt(WAITLIST_MAX_TOTAL || "500", 10);
  const enableTargeting = customConfig?.enableDemographicTargeting ?? true;

  const { data: waitlists, error: waitlistError } = await supabase
    .from("Waitlist")
    .select("id, patientId, screeningTypeId, status, joinedAt, enrolledByCenterId")
    .eq("status", "PENDING")
    .order("joinedAt", { ascending: true });

  if (waitlistError) throw waitlistError;

  const pendingWaitlists = (waitlists || []) as WaitlistRow[];
  if (pendingWaitlists.length === 0) {
    return { ok: true, matched: 0, message: "No pending waitlist entries" };
  }

  const patientIds = [...new Set(pendingWaitlists.map((w) => w.patientId))];
  const screeningTypeIds = [
    ...new Set(pendingWaitlists.map((w) => w.screeningTypeId)),
  ];
  const waitlistIds = pendingWaitlists.map((w) => w.id);

  const [
    { data: profiles },
    { data: users },
    { data: screeningTypes },
    { data: allocations },
    { data: existingByWaitlist },
    { data: campaigns },
    { data: campaignLinks },
    { data: centers },
  ] = await Promise.all([
    supabase.from("PatientProfile").select("*").in("userId", patientIds),
    supabase.from("User").select("id, phone").in("id", patientIds),
    supabase.from("ScreeningType").select("id, name, agreedPrice").in("id", screeningTypeIds),
    supabase
      .from("DonationAllocation")
      .select("id, patientId, claimedAt")
      .in("patientId", patientIds)
      .is("claimedAt", null),
    supabase
      .from("DonationAllocation")
      .select("waitlistId")
      .in("waitlistId", waitlistIds),
    supabase
      .from("DonationCampaign")
      .select("*")
      .eq("status", "ACTIVE")
      .gt("availableAmount", 0),
    supabase.from("_DonationCampaignScreeningTypes").select("A, B"),
    supabase
      .from("ServiceCenter")
      .select("id, centerName")
      .eq("status", "ACTIVE"),
  ]);

  const profileByUserId = new Map(
    (profiles || []).map((p: Record<string, unknown>) => [p.userId, p])
  );
  const phoneByUserId = new Map(
    (users || []).map((u: { id: string; phone: string | null }) => [u.id, u.phone])
  );
  const screeningById = new Map(
    (screeningTypes || []).map((s: ScreeningTypeRow) => [s.id, s])
  );
  const centerNameById = new Map(
    (centers || []).map((center: { id: string; centerName: string }) => [
      center.id,
      center.centerName,
    ])
  );

  const unclaimedByPatient = new Map<string, number>();
  for (const alloc of allocations || []) {
    const patientId = (alloc as { patientId: string }).patientId;
    unclaimedByPatient.set(
      patientId,
      (unclaimedByPatient.get(patientId) || 0) + 1
    );
  }

  const allocatedWaitlistIds = new Set(
    (existingByWaitlist || []).map(
      (row: { waitlistId: string }) => row.waitlistId
    )
  );

  const linksByCampaign = new Map<string, string[]>();
  for (const link of campaignLinks || []) {
    const campaignId = (link as { A: string; B: string }).A;
    const screeningId = (link as { A: string; B: string }).B;
    const existing = linksByCampaign.get(campaignId) || [];
    existing.push(screeningId);
    linksByCampaign.set(campaignId, existing);
  }

  const campaignRows: CampaignRow[] = (campaigns || []).map(
    (campaign: Record<string, unknown>) => ({
      id: String(campaign.id),
      donorId: String(campaign.donorId),
      title: String(campaign.title),
      availableAmount: Number(campaign.availableAmount) || 0,
      targetGender: (campaign.targetGender as string | null) ?? null,
      targetAgeRange: (campaign.targetAgeRange as string | null) ?? null,
      targetStates: String(campaign.targetStates ?? "[]"),
      targetLgas: String(campaign.targetLgas ?? "[]"),
      targetAssociationId:
        (campaign.targetAssociationId as string | null) ?? null,
      targetGroupId: (campaign.targetGroupId as string | null) ?? null,
      targetIndividualId:
        (campaign.targetIndividualId as string | null) ?? null,
      targetPhone: (campaign.targetPhone as string | null) ?? null,
      createdAt: String(campaign.createdAt),
      screeningTypeIds: linksByCampaign.get(String(campaign.id)) || [],
    })
  );

  const generalPool =
    campaignRows.find((campaign) => campaign.id === GENERAL_POOL_ID) ?? null;

  const campaignsByScreening = new Map<string, CampaignRow[]>();
  for (const campaign of campaignRows) {
    if (campaign.id === GENERAL_POOL_ID) continue;
    for (const screeningId of campaign.screeningTypeIds) {
      const list = campaignsByScreening.get(screeningId) || [];
      list.push(campaign);
      campaignsByScreening.set(screeningId, list);
    }
  }

  const whatsapp = new WhatsAppService(c);
  let matched = 0;

  for (let index = 0; index < pendingWaitlists.length; index += 1) {
    if (matched >= maxMatches) break;

    const waitlist = pendingWaitlists[index];
    const rank = index + 1;

    if (allocatedWaitlistIds.has(waitlist.id)) continue;

    const profile = profileByUserId.get(waitlist.patientId) as
      | Record<string, unknown>
      | undefined;
    if (!profile) continue;

    const patient: PatientContext = {
      userId: waitlist.patientId,
      phone: phoneByUserId.get(waitlist.patientId) ?? null,
      gender: (profile.gender as string | null) ?? null,
      dateOfBirth: (profile.dateOfBirth as string | null) ?? null,
      city: (profile.city as string | null) ?? null,
      state: (profile.state as string | null) ?? null,
      associationId: (profile.associationId as string | null) ?? null,
      groupId: (profile.groupId as string | null) ?? null,
      assignedCenterId: (profile.assignedCenterId as string | null) ?? null,
      unclaimedAllocations: unclaimedByPatient.get(waitlist.patientId) || 0,
    };

    if (patient.unclaimedAllocations >= MAX_UNCLAIMED_ALLOCATIONS) continue;

    const screening = screeningById.get(waitlist.screeningTypeId);
    if (!screening) continue;

    const price = Number(screening.agreedPrice) || 10000;
    const eligibleCampaigns =
      campaignsByScreening.get(waitlist.screeningTypeId) || [];

    const selectedCampaign = selectBestCampaign(
      patient,
      eligibleCampaigns,
      generalPool,
      price,
      rank,
      enableTargeting
    );

    if (!selectedCampaign) continue;

    try {
      const allocation = await db.donationAllocation.create({
        data: {
          waitlistId: waitlist.id,
          patientId: waitlist.patientId,
          campaignId: selectedCampaign.id,
          amountAllocated: price,
          createdViaMatching: true,
        },
      });

      try {
        await db.waitlist.update({
          where: { id: waitlist.id },
          data: { status: "MATCHED" },
        });

        await db.donationCampaign.update({
          where: { id: selectedCampaign.id },
          data: { availableAmount: { decrement: price } },
        });
      } catch (persistError) {
        await supabase
          .from("DonationAllocation")
          .delete()
          .eq("id", allocation.id);
        throw persistError;
      }

      selectedCampaign.availableAmount -= price;
      patient.unclaimedAllocations += 1;
      unclaimedByPatient.set(waitlist.patientId, patient.unclaimedAllocations);
      allocatedWaitlistIds.add(waitlist.id);
      matched += 1;

      const centerId =
        waitlist.enrolledByCenterId ||
        patient.assignedCenterId ||
        null;
      const centerName = centerId
        ? centerNameById.get(centerId) || "your assigned center"
        : "your assigned center";

      const patientMessage = `Good news! Funding now covers your ${screening.name} screening at ${centerName}. Open your dashboard to book your appointment.`;

      await createNotificationForUsers(
        c,
        {
          type: "MATCHED",
          title: "Your screening is now funded!",
          message: patientMessage,
          userIds: [waitlist.patientId],
          data: {
            waitlistId: waitlist.id,
            campaignId: selectedCampaign.id,
            screeningTypeId: waitlist.screeningTypeId,
            centerId,
          },
        },
        true
      );

      if (patient.phone) {
        try {
          await whatsapp.sendDonationNotification(
            patient.phone,
            selectedCampaign.title,
            price,
            screening.name
          );
        } catch (whatsappError) {
          console.error(
            "[MATCHING] WhatsApp notification failed:",
            whatsappError
          );
        }
      }

      if (selectedCampaign.id !== GENERAL_POOL_ID) {
        await createNotificationForUsers(c, {
          type: "PATIENT_MATCHED",
          title: "A patient has been matched to your campaign!",
          message: `A patient at ${centerName} has been matched for ${screening.name}.`,
          userIds: [selectedCampaign.donorId],
          data: {
            screeningTypeId: waitlist.screeningTypeId,
            patientId: waitlist.patientId,
            campaignId: selectedCampaign.id,
          },
        });
      }
    } catch (matchError) {
      console.error(
        `[MATCHING] Failed to match waitlist ${waitlist.id}:`,
        matchError
      );
    }
  }

  console.log(`[MATCHING] Completed: ${matched} patients matched`);
  return {
    ok: true,
    matched,
    message: `Matching completed: ${matched} patients matched`,
  };
}
