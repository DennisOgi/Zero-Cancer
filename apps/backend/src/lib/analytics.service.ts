import type { SupabaseClient } from "./supabase";

export interface AdminDashboardMetrics {
  // Financial Metrics
  totalRevenue: number;
  monthlyRevenue: number;
  averageTransactionValue: number;

  // User Metrics
  totalUsers: number;
  newUsersThisMonth: number;
  activePatients: number;
  activeDonors: number;

  // Appointment Metrics
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  appointmentCompletionRate: number;

  // Campaign Metrics
  activeCampaigns: number;
  totalDonationAmount: number;
  averageCampaignFunding: number;

  // Center Metrics
  activeCenters: number;
  centerUtilizationRate: number;

  // Waitlist Metrics
  totalWaitlistUsers: number;
  averageWaitTime: number;
  matchingSuccessRate: number;
}

export interface TimeBasedReport {
  period: "daily" | "weekly" | "monthly" | "yearly";
  dateRange: { from: Date; to: Date };

  // Revenue tracking
  revenueByDay: Array<{ date: string; amount: number }>;
  appointmentsByDay: Array<{ date: string; count: number }>;
  registrationsByDay: Array<{ date: string; count: number }>;

  // Growth metrics
  userGrowthRate: number;
  revenueGrowthRate: number;
  appointmentGrowthRate: number;
}

export interface GeographicReport {
  usersByState: Array<{ state: string; count: number }>;
  centersByState: Array<{ state: string; count: number }>;
  appointmentsByState: Array<{ state: string; count: number }>;
  revenueByState: Array<{ state: string; amount: number }>;

  // Hot zones for waitlist
  waitlistHotZones: Array<{
    state: string;
    waitlistCount: number;
    averageWaitTime: number;
  }>;
}

export interface CenterPerformanceReport {
  centerId: string;
  centerName: string;

  // Performance metrics
  totalAppointments: number;
  completedAppointments: number;
  completionRate: number;
  averageRating: number;

  // Financial metrics
  totalRevenue: number;
  averageAppointmentValue: number;
  payoutsPending: number;

  // Efficiency metrics
  averageProcessingTime: number;
  resultUploadRate: number;
}

export interface CampaignAnalytics {
  campaignId: string;
  title: string;

  // Funding metrics
  targetAmount: number;
  currentAmount: number;
  fundingPercentage: number;
  donorCount: number;
  averageDonation: number;

  // Usage metrics
  patientsMatched: number;
  appointmentsCompleted: number;
  utilizationRate: number;

  // Time metrics
  daysSinceCreated: number;
  estimatedDepletion: number | null;
}

type Period = TimeBasedReport["period"];

const DAY_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// QUERY HELPERS
// ============================================================================

async function rows<T = any>(
  promise: PromiseLike<{ data: unknown; error: unknown }>
): Promise<T[]> {
  const { data, error } = await promise;
  if (error) throw error;
  return (data as T[]) || [];
}

async function count(
  promise: PromiseLike<{ count: number | null; error: unknown }>
): Promise<number> {
  const { count: total, error } = await promise;
  if (error) throw error;
  return total || 0;
}

const head = { count: "exact" as const, head: true };

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const percent = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

const growth = (current: number, previous: number) =>
  previous > 0 ? ((current - previous) / previous) * 100 : 0;

/** "Lagos State", "lagos" and "Lagos" are the same state; Abuja is the FCT. */
function normalizeState(state: string | null | undefined): string | null {
  const name = state?.trim().replace(/\s+state$/i, "");
  if (!name) return null;
  if (/^(fct|abuja|federal capital territory)$/i.test(name)) return "FCT";
  return name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function countBy<T>(items: T[], key: (item: T) => string | null | undefined) {
  const totals = new Map<string, number>();
  for (const item of items) {
    const value = normalizeState(key(item));
    if (value) totals.set(value, (totals.get(value) || 0) + 1);
  }
  return Array.from(totals, ([state, total]) => ({ state, count: total }));
}

/** Start of the bucket a timestamp falls in, as YYYY-MM-DD. */
function bucket(value: string, period: Period): string {
  const date = new Date(value);
  if (period === "weekly") {
    const day = (date.getUTCDay() + 6) % 7; // Monday = 0
    date.setUTCDate(date.getUTCDate() - day);
  } else if (period === "monthly") {
    date.setUTCDate(1);
  } else if (period === "yearly") {
    date.setUTCMonth(0, 1);
  }
  return date.toISOString().slice(0, 10);
}

function groupByPeriod<T>(
  items: T[],
  period: Period,
  timestamp: (item: T) => string,
  weight: (item: T) => number
) {
  const totals = new Map<string, number>();
  for (const item of items) {
    const key = bucket(timestamp(item), period);
    totals.set(key, (totals.get(key) || 0) + weight(item));
  }
  return Array.from(totals).sort(([a], [b]) => a.localeCompare(b));
}

function previousRange(from: Date, to: Date) {
  return { from: new Date(from.getTime() - (to.getTime() - from.getTime())), to: from };
}

async function completedRevenue(supabase: SupabaseClient, from?: Date, to?: Date) {
  let query = supabase.from("Transaction").select("amount").eq("status", "COMPLETED");
  if (from) query = query.gte("createdAt", from.toISOString());
  if (to) query = query.lte("createdAt", to.toISOString());
  return (await rows<{ amount: number }>(query)).map((tx) => Number(tx.amount) || 0);
}

async function createdInRange(
  supabase: SupabaseClient,
  table: "User" | "Appointment",
  from: Date,
  to: Date
) {
  return count(
    supabase
      .from(table)
      .select("id", head)
      .gte("createdAt", from.toISOString())
      .lte("createdAt", to.toISOString())
  );
}

// ============================================================================
// MAIN EXPORTED FUNCTIONS
// ============================================================================

export async function getDashboardMetrics(
  supabase: SupabaseClient
): Promise<AdminDashboardMetrics> {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [
    totalUsers,
    newUsersThisMonth,
    totalAppointments,
    completedAppointments,
    pendingAppointments,
    activeCampaigns,
    activeCenters,
    totalCenters,
    totalWaitlistUsers,
    totalWaitlistEntries,
    matchedWaitlistEntries,
    revenue,
    monthlyRevenue,
    donations,
    campaigns,
    recentAppointments,
    recentCampaigns,
    centersWithAppointments,
    claimedEntries,
  ] = await Promise.all([
    count(supabase.from("User").select("id", head)),
    count(supabase.from("User").select("id", head).gte("createdAt", startOfMonth.toISOString())),
    count(supabase.from("Appointment").select("id", head)),
    count(supabase.from("Appointment").select("id", head).eq("status", "COMPLETED")),
    count(
      supabase.from("Appointment").select("id", head).in("status", ["SCHEDULED", "IN_PROGRESS"])
    ),
    count(supabase.from("DonationCampaign").select("id", head).eq("status", "ACTIVE")),
    count(supabase.from("ServiceCenter").select("id", head).eq("status", "ACTIVE")),
    count(supabase.from("ServiceCenter").select("id", head)),
    count(supabase.from("Waitlist").select("id", head).eq("status", "PENDING")),
    count(supabase.from("Waitlist").select("id", head)),
    count(supabase.from("Waitlist").select("id", head).eq("status", "MATCHED")),
    completedRevenue(supabase),
    completedRevenue(supabase, startOfMonth),
    rows<{ amount: number }>(
      supabase.from("Transaction").select("amount").eq("type", "DONATION").eq("status", "COMPLETED")
    ),
    rows<{ totalAmount: number }>(supabase.from("DonationCampaign").select("totalAmount")),
    rows<{ patientId: string }>(
      supabase.from("Appointment").select("patientId").gte("createdAt", thirtyDaysAgo.toISOString())
    ),
    rows<{ donorId: string }>(
      supabase
        .from("DonationCampaign")
        .select("donorId")
        .gte("createdAt", thirtyDaysAgo.toISOString())
    ),
    rows<{ centerId: string }>(supabase.from("Appointment").select("centerId")),
    rows<{ joinedAt: string; claimedAt: string }>(
      supabase.from("Waitlist").select("joinedAt, claimedAt").not("claimedAt", "is", null)
    ),
  ]);

  const totalRevenue = sum(revenue);
  const waitDays = claimedEntries.map(
    (entry) => (new Date(entry.claimedAt).getTime() - new Date(entry.joinedAt).getTime()) / DAY_MS
  );

  return {
    totalRevenue,
    monthlyRevenue: sum(monthlyRevenue),
    averageTransactionValue: revenue.length ? totalRevenue / revenue.length : 0,

    totalUsers,
    newUsersThisMonth,
    activePatients: new Set(recentAppointments.map((a) => a.patientId)).size,
    activeDonors: new Set(recentCampaigns.map((c) => c.donorId)).size,

    totalAppointments,
    completedAppointments,
    pendingAppointments,
    appointmentCompletionRate: percent(completedAppointments, totalAppointments),

    activeCampaigns,
    totalDonationAmount: sum(donations.map((d) => Number(d.amount) || 0)),
    averageCampaignFunding: campaigns.length
      ? sum(campaigns.map((c) => Number(c.totalAmount) || 0)) / campaigns.length
      : 0,

    activeCenters,
    centerUtilizationRate: percent(
      new Set(centersWithAppointments.map((a) => a.centerId)).size,
      totalCenters
    ),

    totalWaitlistUsers,
    averageWaitTime: waitDays.length ? sum(waitDays) / waitDays.length : 0,
    matchingSuccessRate: percent(matchedWaitlistEntries, totalWaitlistEntries),
  };
}

export async function getTimeBasedReport(
  supabase: SupabaseClient,
  period: Period,
  dateRange: { from: Date; to: Date }
): Promise<TimeBasedReport> {
  const { from, to } = dateRange;
  const previous = previousRange(from, to);
  const inRange = <T extends { gte: Function }>(query: T) =>
    (query as any).gte("createdAt", from.toISOString()).lte("createdAt", to.toISOString());

  const [
    transactions,
    appointments,
    users,
    previousRevenue,
    usersNow,
    usersBefore,
    appointmentsNow,
    appointmentsBefore,
  ] = await Promise.all([
    rows<{ amount: number; createdAt: string }>(
      inRange(supabase.from("Transaction").select("amount, createdAt").eq("status", "COMPLETED"))
    ),
    rows<{ createdAt: string }>(inRange(supabase.from("Appointment").select("createdAt"))),
    rows<{ createdAt: string }>(inRange(supabase.from("User").select("createdAt"))),
    completedRevenue(supabase, previous.from, previous.to),
    createdInRange(supabase, "User", from, to),
    createdInRange(supabase, "User", previous.from, previous.to),
    createdInRange(supabase, "Appointment", from, to),
    createdInRange(supabase, "Appointment", previous.from, previous.to),
  ]);

  return {
    period,
    dateRange,
    revenueByDay: groupByPeriod(
      transactions,
      period,
      (tx) => tx.createdAt,
      (tx) => Number(tx.amount) || 0
    ).map(([date, amount]) => ({ date, amount })),
    appointmentsByDay: groupByPeriod(appointments, period, (a) => a.createdAt, () => 1).map(
      ([date, total]) => ({ date, count: total })
    ),
    registrationsByDay: groupByPeriod(users, period, (u) => u.createdAt, () => 1).map(
      ([date, total]) => ({ date, count: total })
    ),
    userGrowthRate: growth(usersNow, usersBefore),
    revenueGrowthRate: growth(
      sum(transactions.map((tx) => Number(tx.amount) || 0)),
      sum(previousRevenue)
    ),
    appointmentGrowthRate: growth(appointmentsNow, appointmentsBefore),
  };
}

export async function getGeographicReport(
  supabase: SupabaseClient
): Promise<GeographicReport> {
  const [profiles, centers, appointments, transactions, waitlist] = await Promise.all([
    rows<{ userId: string; state: string | null }>(
      supabase.from("PatientProfile").select("userId, state")
    ),
    rows<{ id: string; state: string | null }>(supabase.from("ServiceCenter").select("id, state")),
    rows<{ centerId: string; transactionId: string | null }>(
      supabase.from("Appointment").select("centerId, transactionId")
    ),
    rows<{ id: string; amount: number }>(
      supabase.from("Transaction").select("id, amount").eq("status", "COMPLETED")
    ),
    rows<{ patientId: string; status: string; joinedAt: string; claimedAt: string | null }>(
      supabase.from("Waitlist").select("patientId, status, joinedAt, claimedAt")
    ),
  ]);

  const centerState = new Map(centers.map((center) => [center.id, normalizeState(center.state)]));
  const patientState = new Map(
    profiles.map((profile) => [profile.userId, normalizeState(profile.state)])
  );

  // A transaction's state is the state of the first center it paid for.
  const transactionState = new Map<string, string>();
  for (const appointment of appointments) {
    const state = centerState.get(appointment.centerId);
    if (appointment.transactionId && state && !transactionState.has(appointment.transactionId)) {
      transactionState.set(appointment.transactionId, state);
    }
  }
  const revenue = new Map<string, number>();
  for (const transaction of transactions) {
    const state = transactionState.get(transaction.id);
    if (state) revenue.set(state, (revenue.get(state) || 0) + (Number(transaction.amount) || 0));
  }

  const hotZones = new Map<string, { count: number; matched: number; waitMs: number }>();
  for (const entry of waitlist) {
    const state = patientState.get(entry.patientId);
    if (!state) continue;
    const zone = hotZones.get(state) || { count: 0, matched: 0, waitMs: 0 };
    zone.count += 1;
    if (entry.status === "MATCHED" && entry.claimedAt) {
      zone.matched += 1;
      zone.waitMs += new Date(entry.claimedAt).getTime() - new Date(entry.joinedAt).getTime();
    }
    hotZones.set(state, zone);
  }

  return {
    usersByState: countBy(profiles, (profile) => profile.state),
    centersByState: countBy(centers, (center) => center.state),
    appointmentsByState: countBy(appointments, (a) => centerState.get(a.centerId)),
    revenueByState: Array.from(revenue, ([state, amount]) => ({ state, amount })),
    waitlistHotZones: Array.from(hotZones, ([state, zone]) => ({
      state,
      waitlistCount: zone.count,
      averageWaitTime: zone.matched > 0 ? zone.waitMs / zone.matched / DAY_MS : 0,
    })),
  };
}

export async function getCenterPerformanceReport(
  supabase: SupabaseClient,
  centerId?: string
): Promise<CenterPerformanceReport[]> {
  let centerQuery = supabase.from("ServiceCenter").select("id, centerName");
  let appointmentQuery = supabase
    .from("Appointment")
    .select("id, centerId, status, transactionId");
  let payoutQuery = supabase.from("payouts").select("centerId, amount").eq("status", "PENDING");
  if (centerId) {
    centerQuery = centerQuery.eq("id", centerId);
    appointmentQuery = appointmentQuery.eq("centerId", centerId);
    payoutQuery = payoutQuery.eq("centerId", centerId);
  }

  const [centers, appointments, pendingPayouts] = await Promise.all([
    rows<{ id: string; centerName: string }>(centerQuery),
    rows<{ id: string; centerId: string; status: string; transactionId: string | null }>(
      appointmentQuery
    ),
    rows<{ centerId: string; amount: number }>(payoutQuery),
  ]);

  const transactionIds = [
    ...new Set(appointments.map((a) => a.transactionId).filter(Boolean) as string[]),
  ];
  const completedIds = appointments.filter((a) => a.status === "COMPLETED").map((a) => a.id);
  const [transactions, results] = await Promise.all([
    transactionIds.length
      ? rows<{ id: string; amount: number }>(
          supabase
            .from("Transaction")
            .select("id, amount")
            .eq("status", "COMPLETED")
            .in("id", transactionIds)
        )
      : Promise.resolve([]),
    completedIds.length
      ? rows<{ appointmentId: string }>(
          supabase.from("ScreeningResult").select("appointmentId").in("appointmentId", completedIds)
        )
      : Promise.resolve([]),
  ]);
  const amountById = new Map(transactions.map((tx) => [tx.id, Number(tx.amount) || 0]));
  const withResults = new Set(results.map((result) => result.appointmentId));

  return centers.map((center) => {
    const own = appointments.filter((a) => a.centerId === center.id);
    const completed = own.filter((a) => a.status === "COMPLETED");
    const totalRevenue = sum(own.map((a) => (a.transactionId ? amountById.get(a.transactionId) || 0 : 0)));

    return {
      centerId: center.id,
      centerName: center.centerName,
      totalAppointments: own.length,
      completedAppointments: completed.length,
      completionRate: percent(completed.length, own.length),
      averageRating: 0, // No rating system yet
      totalRevenue,
      averageAppointmentValue: own.length ? totalRevenue / own.length : 0,
      payoutsPending: sum(
        pendingPayouts.filter((p) => p.centerId === center.id).map((p) => Number(p.amount) || 0)
      ),
      averageProcessingTime: 0, // Not tracked yet
      resultUploadRate: percent(
        completed.filter((a) => withResults.has(a.id)).length,
        completed.length
      ),
    };
  });
}

export async function getCampaignAnalytics(
  supabase: SupabaseClient
): Promise<CampaignAnalytics[]> {
  const campaigns = await rows<{
    id: string;
    title: string | null;
    totalAmount: number;
    availableAmount: number;
    createdAt: string;
  }>(supabase.from("DonationCampaign").select("id, title, totalAmount, availableAmount, createdAt"));
  if (!campaigns.length) return [];

  const campaignIds = campaigns.map((campaign) => campaign.id);
  const [transactions, allocations] = await Promise.all([
    rows<{ relatedDonationId: string; amount: number }>(
      supabase
        .from("Transaction")
        .select("relatedDonationId, amount")
        .eq("status", "COMPLETED")
        .in("relatedDonationId", campaignIds)
    ),
    rows<{ campaignId: string; appointment: { status: string } | null }>(
      supabase
        .from("DonationAllocation")
        .select("campaignId, appointment:Appointment(status)")
        .in("campaignId", campaignIds)
    ),
  ]);

  return campaigns.map((campaign) => {
    const payments = transactions
      .filter((tx) => tx.relatedDonationId === campaign.id)
      .map((tx) => Number(tx.amount) || 0);
    const matched = allocations.filter((a) => a.campaignId === campaign.id);
    const completed = matched.filter((a) => a.appointment?.status === "COMPLETED").length;
    const targetAmount = Number(campaign.totalAmount) || 0;
    const currentAmount = sum(payments);
    const spent = targetAmount - (Number(campaign.availableAmount) || 0);
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(campaign.createdAt).getTime()) / DAY_MS
    );
    const spendPerDay = daysSinceCreated > 0 ? spent / daysSinceCreated : 0;

    return {
      campaignId: campaign.id,
      title: campaign.title || "Donation Campaign",
      targetAmount,
      currentAmount,
      fundingPercentage: percent(currentAmount, targetAmount),
      donorCount: payments.length,
      averageDonation: payments.length ? currentAmount / payments.length : 0,
      patientsMatched: matched.length,
      appointmentsCompleted: completed,
      utilizationRate: percent(completed, matched.length),
      daysSinceCreated,
      estimatedDepletion:
        spendPerDay > 0
          ? Math.floor((Number(campaign.availableAmount) || 0) / spendPerDay)
          : null,
    };
  });
}
