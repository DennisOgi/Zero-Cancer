import { getDB } from "./db";
import { locationsMatch } from "./location-utils";
import { triggerWaitlistMatching } from "./utils";

export type RecommendedCenter = {
  id: string;
  centerName: string;
  address: string;
  state: string;
  lga: string;
  services: Array<{ id: string; name: string }>;
  distanceTier: "same_lga" | "same_state" | "fallback";
};

function formatRecommendedCenter(
  center: any,
  distanceTier: "same_lga" | "same_state" | "fallback"
): RecommendedCenter {
  return {
    id: center.id,
    centerName: center.centerName,
    address: center.address,
    state: center.state,
    lga: center.lga,
    services: (center.services || []).map((service: any) => ({
      id: service.id,
      name: service.name,
    })),
    distanceTier,
  };
}

export async function findRecommendedCenters(
  db: ReturnType<typeof getDB>,
  state: string,
  localGovernment: string,
  limit = 5
): Promise<RecommendedCenter[]> {
  const centers = await db.serviceCenter.findMany({
    where: { status: "ACTIVE" },
  });

  const rankedCenters = centers
    .filter((center) => (center.services?.length || 0) > 0)
    .map((center) => {
      const sameState = locationsMatch(center.state, state);
      const sameLga = locationsMatch(center.lga, localGovernment);

      let score = 0;
      let distanceTier: RecommendedCenter["distanceTier"] = "fallback";

      if (sameLga && sameState) {
        score = 100;
        distanceTier = "same_lga";
      } else if (sameState) {
        score = 50;
        distanceTier = "same_state";
      } else {
        score = 1;
        distanceTier = "fallback";
      }

      return { center, score, distanceTier };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.center.services?.length || 0) - (a.center.services?.length || 0);
    })
    .slice(0, limit)
    .map(({ center, distanceTier }) => formatRecommendedCenter(center, distanceTier));

  return rankedCenters;
}

export function isCenterRecommendedForPatient(
  recommendedCenters: RecommendedCenter[],
  centerId: string
) {
  return recommendedCenters.some((center) => center.id === centerId);
}

export async function assignPatientToCenter(
  c: any,
  patientId: string,
  centerId: string
): Promise<
  | { error: string }
  | { center: RecommendedCenter; enrolledCount: number }
> {
  const db = getDB(c);
  const profile = await db.patientProfile.findUnique({
    where: { userId: patientId },
  });

  if (!profile?.state || !profile?.city) {
    return { error: "Patient location is required before assigning a center" };
  }

  const recommendedCenters = await findRecommendedCenters(
    db,
    profile.state,
    profile.city,
    50
  );

  if (!isCenterRecommendedForPatient(recommendedCenters, centerId)) {
    return { error: "Selected center is not available for your location" };
  }

  const matchedCenter = recommendedCenters.find((center) => center.id === centerId)!;

  if (profile.assignedCenterId === centerId) {
    return { center: matchedCenter, enrolledCount: 0 };
  }

  const centerRecord = await db.serviceCenter.findUnique({
    where: { id: centerId },
  });

  if (!centerRecord || centerRecord.status !== "ACTIVE") {
    return { error: "Center not found or inactive" };
  }

  const serviceLinks = await db.serviceCenterScreeningType.findMany({
    where: { centerId },
    include: {
      screeningType: {
        select: { id: true, name: true },
      },
    },
  });

  const services = (serviceLinks || [])
    .filter((link: any) => link.screeningType?.id)
    .map((link: any) => ({
      id: link.screeningType.id as string,
      name: link.screeningType.name as string,
    }));

  if (services.length === 0) {
    return { error: "This center has no services available yet" };
  }

  await db.patientProfile.update({
    where: { userId: patientId },
    data: { assignedCenterId: centerId },
  });

  let enrolledCount = 0;
  for (const service of services) {
    const existing = await db.waitlist.findFirst({
      where: {
        patientId,
        screeningTypeId: service.id,
        status: { in: ["PENDING", "MATCHED"] },
      },
    });

    if (!existing) {
      await db.waitlist.create({
        data: {
          patientId,
          screeningTypeId: service.id,
          status: "PENDING",
          enrolledByCenterId: centerId,
        },
      });
      enrolledCount += 1;
    }
  }

  try {
    await triggerWaitlistMatching(c);
  } catch (error) {
    console.error("Waitlist matching failed after center assignment:", error);
  }

  return {
    center: {
      id: centerRecord.id,
      centerName: centerRecord.centerName,
      address: centerRecord.address,
      state: centerRecord.state,
      lga: centerRecord.lga,
      services,
      distanceTier: matchedCenter.distanceTier,
    },
    enrolledCount,
  };
}

export function pickAutoAssignedCenter(
  recommendedCenters: RecommendedCenter[]
): RecommendedCenter | null {
  return recommendedCenters[0] ?? null;
}
