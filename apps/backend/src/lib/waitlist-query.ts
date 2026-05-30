import type { Context } from "hono";
import { getSupabaseClient } from "./supabase";
import {
  matchesServiceTypeFilter,
  type ServiceTypeKey,
} from "./service-type-utils";

export type WaitlistFilterParams = {
  serviceType?: ServiceTypeKey;
  state?: string;
  lga?: string;
};

export type PendingWaitlistEntry = {
  id: string;
  patientId: string;
  screeningTypeId: string;
  joinedAt: string;
  status: string;
  screeningType: {
    id: string;
    name: string;
    screeningTypeCategoryId?: string | null;
  };
  patientProfile?: {
    userId: string;
    state?: string | null;
    city?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
  } | null;
};

export async function fetchPendingWaitlistEntries(
  c: Context,
  filters: WaitlistFilterParams = {}
): Promise<PendingWaitlistEntry[]> {
  const supabase = getSupabaseClient(c);

  const { data: waitlists, error } = await supabase
    .from("Waitlist")
    .select("id, patientId, screeningTypeId, joinedAt, status")
    .eq("status", "PENDING");

  if (error) throw error;
  if (!waitlists?.length) return [];

  const screeningTypeIds = [
    ...new Set(waitlists.map((entry) => entry.screeningTypeId)),
  ];
  const { data: screeningTypes, error: screeningTypesError } = await supabase
    .from("ScreeningType")
    .select("id, name, screeningTypeCategoryId")
    .in("id", screeningTypeIds);

  if (screeningTypesError) throw screeningTypesError;

  const screeningTypeMap = new Map(
    (screeningTypes || []).map((screeningType) => [
      screeningType.id,
      screeningType,
    ])
  );

  const patientIds = [...new Set(waitlists.map((entry) => entry.patientId))];
  const { data: profiles, error: profilesError } = await supabase
    .from("PatientProfile")
    .select("userId, state, city, gender, dateOfBirth")
    .in("userId", patientIds);

  if (profilesError) throw profilesError;

  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.userId, profile])
  );

  return waitlists
    .filter((entry) => {
      const screeningType = screeningTypeMap.get(entry.screeningTypeId);
      if (!screeningType) return false;

      if (
        filters.serviceType &&
        !matchesServiceTypeFilter(screeningType, filters.serviceType)
      ) {
        return false;
      }

      const profile = profileMap.get(entry.patientId);
      if (filters.state && profile?.state !== filters.state) return false;

      if (filters.lga) {
        const city = String(profile?.city || "").toLowerCase();
        if (!city.includes(filters.lga.toLowerCase())) return false;
      }

      return true;
    })
    .map((entry) => ({
      ...entry,
      screeningType: screeningTypeMap.get(entry.screeningTypeId)!,
      patientProfile: profileMap.get(entry.patientId) || null,
    }));
}

export function aggregateWaitlistByScreeningType(
  entries: PendingWaitlistEntry[],
  demandOrder: "asc" | "desc" = "desc"
) {
  const counts = new Map<string, { count: number; screeningType: PendingWaitlistEntry["screeningType"] }>();

  for (const entry of entries) {
    const existing = counts.get(entry.screeningTypeId);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(entry.screeningTypeId, {
        count: 1,
        screeningType: entry.screeningType,
      });
    }
  }

  const sortDirection = demandOrder === "asc" ? 1 : -1;

  return [...counts.entries()]
    .map(([screeningTypeId, value]) => ({
      screeningTypeId,
      screeningType: value.screeningType,
      pendingCount: value.count,
      totalCount: value.count,
      demand: value.count,
    }))
    .sort((a, b) => (a.pendingCount - b.pendingCount) * sortDirection);
}

export function toDonorWaitlistPatients(
  entries: PendingWaitlistEntry[],
  page: number,
  pageSize: number
) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
  );
  const total = sorted.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const slice = sorted.slice((page - 1) * pageSize, page * pageSize);

  const patients = slice.map((entry, index) => ({
    waitlistId: entry.id,
    patientId: entry.patientId,
    screeningTypeId: entry.screeningTypeId,
    screeningTypeName: entry.screeningType.name,
    state: entry.patientProfile?.state || "Unknown",
    city: entry.patientProfile?.city || null,
    joinedAt: entry.joinedAt,
    label: `Patient #${(page - 1) * pageSize + index + 1}`,
  }));

  return { patients, page, pageSize, total, totalPages };
}
