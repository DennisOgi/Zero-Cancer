import type {
  TAvailabilityDay,
  TAvailabilityException,
  TAvailabilityRule,
  TCenterAvailability,
} from "@zerocancer/shared/types";
import { getSupabaseClient } from "./supabase";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DEFAULT_WEEKLY_RULES: TAvailabilityRule[] = [0, 1, 2, 3, 4, 5, 6].map(
  (weekday) => ({
    weekday,
    isOpen: weekday >= 1 && weekday <= 5,
    startTime: "09:00",
    endTime: "17:00",
    slotMinutes: 60,
    maxBookingsPerSlot: 4,
  })
);

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function minutesFromHm(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function hmFromMinutes(total: number) {
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${pad(hours)}:${pad(minutes)}`;
}

export function lagosParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: weekdayMap[get("weekday")] ?? 0,
    minutes: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute") || "0", 10),
  };
}

export function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

export function weekdayFromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function slotStarts(startTime: string, endTime: string, slotMinutes: number) {
  const start = minutesFromHm(startTime);
  const end = minutesFromHm(endTime);
  const times: string[] = [];
  if (end < start || slotMinutes <= 0) return times;
  for (let minutes = start; minutes <= end; minutes += slotMinutes) {
    times.push(hmFromMinutes(minutes));
  }
  return times;
}

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
  return DEFAULT_WEEKLY_RULES.map((fallback) => byWeekday.get(fallback.weekday) || fallback);
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

function hoursForDate(
  dateKey: string,
  weekly: TAvailabilityRule[],
  exceptions: TAvailabilityException[]
) {
  const exception = exceptions.find((item) => item.date === dateKey);
  if (exception?.type === "CLOSED") {
    return { isOpen: false, startTime: "09:00", endTime: "17:00", slotMinutes: 60, maxBookingsPerSlot: 4 };
  }
  if (exception?.type === "OPEN") {
    const weekday = weekdayFromDateKey(dateKey);
    const rule = weekly.find((item) => item.weekday === weekday) || DEFAULT_WEEKLY_RULES[weekday];
    return {
      isOpen: true,
      startTime: exception.startTime || rule.startTime,
      endTime: exception.endTime || rule.endTime,
      slotMinutes: exception.slotMinutes || rule.slotMinutes,
      maxBookingsPerSlot: exception.maxBookingsPerSlot || rule.maxBookingsPerSlot,
    };
  }
  const weekday = weekdayFromDateKey(dateKey);
  const rule = weekly.find((item) => item.weekday === weekday) || DEFAULT_WEEKLY_RULES[weekday];
  return {
    isOpen: rule.isOpen,
    startTime: rule.startTime,
    endTime: rule.endTime,
    slotMinutes: rule.slotMinutes,
    maxBookingsPerSlot: rule.maxBookingsPerSlot,
  };
}

async function loadAvailabilityRows(c: any, centerId: string) {
  const supabase = getSupabaseClient(c);
  const [{ data: rules }, { data: exceptions }] = await Promise.all([
    supabase.from("CenterAvailabilityRule").select("*").eq("centerId", centerId),
    supabase.from("CenterAvailabilityException").select("*").eq("centerId", centerId),
  ]);
  return {
    weekly: normalizeWeekly(rules || []),
    exceptions: normalizeExceptions(exceptions || []),
    hasCustomHours: (rules || []).length > 0,
  };
}

async function loadBookedCounts(
  c: any,
  centerId: string,
  from: string,
  to: string,
  ignoreAppointmentId?: string
) {
  const supabase = getSupabaseClient(c);
  const { data } = await supabase
    .from("Appointment")
    .select("id, appointmentDateTime, status")
    .eq("centerId", centerId)
    .in("status", ["PENDING", "SCHEDULED", "IN_PROGRESS"]);

  const counts = new Map<string, number>();
  for (const row of data || []) {
    if (ignoreAppointmentId && row.id === ignoreAppointmentId) continue;
    const parts = lagosParts(new Date(String(row.appointmentDateTime)));
    if (parts.dateKey < from || parts.dateKey > to) continue;
    const key = `${parts.dateKey}|${hmFromMinutes(parts.minutes)}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

export function buildDays(
  from: string,
  to: string,
  weekly: TAvailabilityRule[],
  exceptions: TAvailabilityException[],
  bookedCounts: Map<string, number>
): TAvailabilityDay[] {
  const days: TAvailabilityDay[] = [];
  for (let dateKey = from; dateKey <= to; dateKey = addDays(dateKey, 1)) {
    const hours = hoursForDate(dateKey, weekly, exceptions);
    if (!hours.isOpen) {
      days.push({ date: dateKey, isOpen: false, slots: [] });
      continue;
    }
    const slots = slotStarts(hours.startTime, hours.endTime, hours.slotMinutes).map((time) => {
      const booked = bookedCounts.get(`${dateKey}|${time}`) || 0;
      return {
        time,
        remaining: Math.max(0, hours.maxBookingsPerSlot - booked),
        capacity: hours.maxBookingsPerSlot,
      };
    });
    days.push({
      date: dateKey,
      isOpen: slots.some((slot) => slot.remaining > 0),
      slots,
    });
  }
  return days;
}

export async function getCenterAvailability(
  c: any,
  centerId: string,
  range?: { from?: string; to?: string }
): Promise<TCenterAvailability> {
  const today = lagosParts(new Date()).dateKey;
  const from = range?.from || today;
  const to = range?.to || addDays(from, 60);
  const { weekly, exceptions, hasCustomHours } = await loadAvailabilityRows(c, centerId);
  const bookedCounts = await loadBookedCounts(c, centerId, from, to);
  return {
    centerId,
    hasCustomHours,
    weekly,
    exceptions,
    days: buildDays(from, to, weekly, exceptions, bookedCounts),
  };
}

export async function saveCenterAvailability(
  c: any,
  centerId: string,
  weekly: TAvailabilityRule[],
  exceptions: TAvailabilityException[]
) {
  const supabase = getSupabaseClient(c);
  const uniqueWeekly = DEFAULT_WEEKLY_RULES.map((fallback) => {
    const match = weekly.find((item) => item.weekday === fallback.weekday);
    return match || { ...fallback, isOpen: false };
  });

  await supabase.from("CenterAvailabilityRule").delete().eq("centerId", centerId);
  await supabase.from("CenterAvailabilityException").delete().eq("centerId", centerId);

  const { error: ruleError } = await supabase.from("CenterAvailabilityRule").insert(
    uniqueWeekly.map((rule) => ({
      centerId,
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
      .from("CenterAvailabilityException")
      .insert(
        exceptions.map((item) => ({
          centerId,
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

  return getCenterAvailability(c, centerId);
}

export async function assertSlotAvailable(
  c: any,
  centerId: string,
  appointmentDateTime: Date,
  ignoreAppointmentId?: string
) {
  const parts = lagosParts(appointmentDateTime);
  const time = hmFromMinutes(parts.minutes);
  const { weekly, exceptions } = await loadAvailabilityRows(c, centerId);
  const hours = hoursForDate(parts.dateKey, weekly, exceptions);
  if (!hours.isOpen) {
    return {
      ok: false as const,
      error: `${WEEKDAY_NAMES[parts.weekday]} ${parts.dateKey} is not an open screening day at this facility.`,
    };
  }
  const openTimes = slotStarts(hours.startTime, hours.endTime, hours.slotMinutes);
  if (!openTimes.includes(time)) {
    return {
      ok: false as const,
      error: `${time} is not an available appointment time. Choose one of the open slots.`,
    };
  }
  const bookedCounts = await loadBookedCounts(
    c,
    centerId,
    parts.dateKey,
    parts.dateKey,
    ignoreAppointmentId
  );
  const booked = bookedCounts.get(`${parts.dateKey}|${time}`) || 0;
  if (booked >= hours.maxBookingsPerSlot) {
    return {
      ok: false as const,
      error: `That time is fully booked. Please pick another available slot.`,
    };
  }
  return { ok: true as const };
}

export { WEEKDAY_NAMES };
