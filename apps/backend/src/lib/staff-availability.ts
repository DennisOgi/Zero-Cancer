import type {
  TAvailabilityDay,
  TAvailabilityException,
  TAvailabilityRule,
} from "@zerocancer/shared/types";
import {
  DEFAULT_WEEKLY_RULES,
  addDays,
  buildDays,
  hmFromMinutes,
  lagosParts,
  minutesFromHm,
  WEEKDAY_NAMES,
} from "./center-availability";
import { getSupabaseClient } from "./supabase";

function normalizeWeekly(rows: any[]): TAvailabilityRule[] {
  const byWeekday = new Map<number, TAvailabilityRule>();
  for (const row of rows || []) {
    const weekday = Number(row.weekday);
    if (weekday < 0 || weekday > 6) continue;
    byWeekday.set(weekday, {
      weekday,
      isOpen: Boolean(row.isOpen),
      startTime: row.startTime || "09:00",
      endTime: row.endTime || "17:00",
      slotMinutes: Number(row.slotMinutes) || 60,
      maxBookingsPerSlot: Number(row.maxBookingsPerSlot) || 4,
    });
  }
  return DEFAULT_WEEKLY_RULES.map(
    (fallback) => byWeekday.get(fallback.weekday) || fallback
  );
}

function normalizeExceptions(rows: any[]): TAvailabilityException[] {
  return (rows || []).map((row) => ({
    date: String(row.date),
    type: row.type === "OPEN" ? "OPEN" : "CLOSED",
    startTime: row.startTime || null,
    endTime: row.endTime || null,
    slotMinutes: row.slotMinutes == null ? null : Number(row.slotMinutes),
    maxBookingsPerSlot:
      row.maxBookingsPerSlot == null ? null : Number(row.maxBookingsPerSlot),
    reason: row.reason || null,
  }));
}

export async function loadStaffAvailabilityRows(c: any, staffId: string) {
  const supabase = getSupabaseClient(c);
  const [{ data: rules }, { data: exceptions }] = await Promise.all([
    supabase.from("StaffAvailabilityRule").select("*").eq("staffId", staffId),
    supabase
      .from("StaffAvailabilityException")
      .select("*")
      .eq("staffId", staffId),
  ]);
  return {
    weekly: normalizeWeekly(rules || []),
    exceptions: normalizeExceptions(exceptions || []),
    hasCustomHours: (rules || []).length > 0,
  };
}

export async function getStaffAvailability(
  c: any,
  staffId: string,
  range?: { from?: string; to?: string }
) {
  const today = lagosParts(new Date()).dateKey;
  const from = range?.from || today;
  const to = range?.to || addDays(from, 60);
  const { weekly, exceptions, hasCustomHours } = await loadStaffAvailabilityRows(
    c,
    staffId
  );
  return {
    staffId,
    hasCustomHours,
    weekly,
    exceptions,
    days: buildDays(from, to, weekly, exceptions, new Map()),
  };
}

export async function saveStaffAvailability(
  c: any,
  staffId: string,
  weekly: TAvailabilityRule[],
  exceptions: TAvailabilityException[]
) {
  const supabase = getSupabaseClient(c);
  const uniqueWeekly = DEFAULT_WEEKLY_RULES.map((fallback) => {
    const match = weekly.find((item) => item.weekday === fallback.weekday);
    return match || { ...fallback, isOpen: false };
  });

  await supabase.from("StaffAvailabilityRule").delete().eq("staffId", staffId);
  await supabase
    .from("StaffAvailabilityException")
    .delete()
    .eq("staffId", staffId);

  const { error: ruleError } = await supabase
    .from("StaffAvailabilityRule")
    .insert(
      uniqueWeekly.map((rule) => ({
        staffId,
        weekday: rule.weekday,
        isOpen: rule.isOpen,
        startTime: rule.startTime,
        endTime: rule.endTime,
        slotMinutes: rule.slotMinutes,
        maxBookingsPerSlot: rule.maxBookingsPerSlot,
        updatedAt: new Date().toISOString(),
      }))
    );
  if (ruleError) throw ruleError;

  if (exceptions.length) {
    const { error: exceptionError } = await supabase
      .from("StaffAvailabilityException")
      .insert(
        exceptions.map((item) => ({
          staffId,
          date: item.date,
          type: item.type,
          startTime: item.startTime || null,
          endTime: item.endTime || null,
          slotMinutes: item.slotMinutes ?? null,
          maxBookingsPerSlot: item.maxBookingsPerSlot ?? null,
          reason: item.reason || null,
        }))
      );
    if (exceptionError) throw exceptionError;
  }

  return getStaffAvailability(c, staffId);
}

/** Intersect facility bookable slots with a nurse's personal hours. */
export function intersectAvailabilityDays(
  facilityDays: TAvailabilityDay[],
  staffDays: TAvailabilityDay[]
): TAvailabilityDay[] {
  const staffByDate = new Map(staffDays.map((d) => [d.date, d]));
  return facilityDays.map((day) => {
    const staffDay = staffByDate.get(day.date);
    if (!staffDay || !staffDay.isOpen || !day.isOpen) {
      return { date: day.date, isOpen: false, slots: [] };
    }
    const staffTimes = new Map(
      staffDay.slots.map((s) => [s.time, s] as const)
    );
    const slots = day.slots
      .filter((s) => staffTimes.has(s.time) && s.remaining > 0)
      .map((s) => {
        const staffSlot = staffTimes.get(s.time)!;
        return {
          ...s,
          remaining: Math.min(s.remaining, staffSlot.remaining),
          capacity: Math.min(s.capacity, staffSlot.capacity),
        };
      })
      .filter((s) => s.remaining > 0);
    return {
      date: day.date,
      isOpen: slots.length > 0,
      slots,
    };
  });
}

export async function assertStaffSlotOpen(
  c: any,
  staffId: string,
  appointmentDateTime: Date
) {
  const parts = lagosParts(appointmentDateTime);
  const time = hmFromMinutes(parts.minutes);
  const { weekly, exceptions, hasCustomHours } =
    await loadStaffAvailabilityRows(c, staffId);
  // No personal schedule configured → allow facility hours only
  if (!hasCustomHours) return { ok: true as const };

  const weekday = parts.weekday;
  const exception = exceptions.find((item) => item.date === parts.dateKey);
  let isOpen = false;
  let startTime = "09:00";
  let endTime = "17:00";
  let slotMinutes = 60;

  if (exception?.type === "CLOSED") {
    return {
      ok: false as const,
      error: `Your referring clinician is not available on ${parts.dateKey}.`,
    };
  }
  if (exception?.type === "OPEN") {
    isOpen = true;
    startTime = exception.startTime || startTime;
    endTime = exception.endTime || endTime;
    slotMinutes = exception.slotMinutes || slotMinutes;
  } else {
    const rule =
      weekly.find((item) => item.weekday === weekday) ||
      DEFAULT_WEEKLY_RULES[weekday];
    isOpen = rule.isOpen;
    startTime = rule.startTime;
    endTime = rule.endTime;
    slotMinutes = rule.slotMinutes;
  }

  if (!isOpen) {
    return {
      ok: false as const,
      error: `${WEEKDAY_NAMES[weekday]} is outside your referring clinician's working hours.`,
    };
  }

  const start = minutesFromHm(startTime);
  const end = minutesFromHm(endTime);
  const openTimes: string[] = [];
  for (let m = start; m <= end; m += slotMinutes) {
    openTimes.push(hmFromMinutes(m));
  }
  if (!openTimes.includes(time)) {
    return {
      ok: false as const,
      error: `${time} is outside your referring clinician's available slots.`,
    };
  }
  return { ok: true as const };
}
