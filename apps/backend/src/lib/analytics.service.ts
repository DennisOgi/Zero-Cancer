import { PrismaClient } from "@prisma/client";

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

// ============================================================================
// MAIN EXPORTED FUNCTIONS
// ============================================================================

export async function getDashboardMetrics(
  prisma: PrismaClient
): Promise<AdminDashboardMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    newUsersThisMonth,
    totalAppointments,
    completedAppointments,
    pendingAppointments,
    activeCampaigns,
    activeCenters,
    totalWaitlistUsers,
    totalRevenue,
    monthlyRevenue,
    totalDonationAmount,
  ] = await Promise.all([
    // User metrics
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    }),

    // Appointment metrics
    prisma.appointment.count(),
    prisma.appointment.count({
      where: { status: "COMPLETED" },
    }),
    prisma.appointment.count({
      where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
    }),

    // Campaign metrics
    prisma.donationCampaign.count({
      where: { status: "ACTIVE" },
    }),

    // Center metrics
    prisma.serviceCenter.count({
      where: { status: "ACTIVE" },
    }),

    // Waitlist metrics
    prisma.waitlist.count({
      where: { status: "PENDING" },
    }),

    // Financial metrics
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: "COMPLETED",
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "DONATION" },
    }),
  ]);

  // Calculate derived metrics
  const appointmentCompletionRate =
    totalAppointments > 0
      ? (completedAppointments / totalAppointments) * 100
      : 0;

  const averageTransactionValue = await getAverageTransactionValue(prisma);
  const activePatients = await getActivePatients(prisma);
  const activeDonors = await getActiveDonors(prisma);
  const averageCampaignFunding = await getAverageCampaignFunding(prisma);
  const centerUtilizationRate = await getCenterUtilizationRate(prisma);
  const averageWaitTime = await getAverageWaitTime(prisma);
  const matchingSuccessRate = await getMatchingSuccessRate(prisma);

  return {
    // Financial Metrics
    totalRevenue: Number(totalRevenue._sum.amount) || 0,
    monthlyRevenue: Number(monthlyRevenue._sum.amount) || 0,
    averageTransactionValue,

    // User Metrics
    totalUsers,
    newUsersThisMonth,
    activePatients,
    activeDonors,

    // Appointment Metrics
    totalAppointments,
    completedAppointments,
    pendingAppointments,
    appointmentCompletionRate,

    // Campaign Metrics
    activeCampaigns,
    totalDonationAmount: Number(totalDonationAmount._sum.amount) || 0,
    averageCampaignFunding,

    // Center Metrics
    activeCenters,
    centerUtilizationRate,

    // Waitlist Metrics
    totalWaitlistUsers,
    averageWaitTime,
    matchingSuccessRate,
  };
}

export async function getTimeBasedReport(
  prisma: PrismaClient,
  period: "daily" | "weekly" | "monthly" | "yearly",
  dateRange: { from: Date; to: Date }
): Promise<TimeBasedReport> {
  const { from, to } = dateRange;

  // Get revenue by day
  const revenueByDay = await getRevenueByPeriod(prisma, period, from, to);

  // Get appointments by day
  const appointmentsByDay = await getAppointmentsByPeriod(
    prisma,
    period,
    from,
    to
  );

  // Get registrations by day
  const registrationsByDay = await getRegistrationsByPeriod(
    prisma,
    period,
    from,
    to
  );

  // Calculate growth rates
  const userGrowthRate = await calculateUserGrowthRate(prisma, from, to);
  const revenueGrowthRate = await calculateRevenueGrowthRate(prisma, from, to);
  const appointmentGrowthRate = await calculateAppointmentGrowthRate(
    prisma,
    from,
    to
  );

  return {
    period,
    dateRange,
    revenueByDay,
    appointmentsByDay,
    registrationsByDay,
    userGrowthRate,
    revenueGrowthRate,
    appointmentGrowthRate,
  };
}

export async function getGeographicReport(
  prisma: PrismaClient
): Promise<GeographicReport> {
  const [
    usersByState,
    centersByState,
    appointmentsByState,
    revenueByState,
    waitlistHotZones,
  ] = await Promise.all([
    getUsersByState(prisma),
    getCentersByState(prisma),
    getAppointmentsByState(prisma),
    getRevenueByState(prisma),
    getWaitlistHotZones(prisma),
  ]);

  return {
    usersByState,
    centersByState,
    appointmentsByState,
    revenueByState,
    waitlistHotZones,
  };
}

export async function getCenterPerformanceReport(
  prisma: PrismaClient,
  centerId?: string
): Promise<CenterPerformanceReport[]> {
  const whereClause = centerId ? { id: centerId } : {};

  const centers = await prisma.serviceCenter.findMany({
    where: whereClause,
    include: {
      appointments: {
        include: {
          transaction: true,
        },
      },
    },
  });

  return Promise.all(
    centers.map(async (center) => {
      const totalAppointments = center.appointments.length;
      const completedAppointments = center.appointments.filter(
        (app) => app.status === "COMPLETED"
      ).length;

      const totalRevenue = center.appointments.reduce((sum, app) => {
        return sum + (app.transaction ? Number(app.transaction.amount) : 0);
      }, 0);

      const completionRate =
        totalAppointments > 0
          ? (completedAppointments / totalAppointments) * 100
          : 0;

      const averageAppointmentValue =
        totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

      // Additional metrics
      const averageRating = 4.5; // Placeholder - implement rating system
      const payoutsPending = 0; // Placeholder - implement payout system
      const averageProcessingTime = 24; // Placeholder - hours
      const resultUploadRate = 95; // Placeholder - percentage

      return {
        centerId: center.id,
        centerName: center.centerName,
        totalAppointments,
        completedAppointments,
        completionRate,
        averageRating,
        totalRevenue,
        averageAppointmentValue,
        payoutsPending,
        averageProcessingTime,
        resultUploadRate,
      };
    })
  );
}

export async function getCampaignAnalytics(
  prisma: PrismaClient
): Promise<CampaignAnalytics[]> {
  const campaigns = await prisma.donationCampaign.findMany({
    include: {
      transactions: true,
      allocations: {
        include: {
          appointment: true,
        },
      },
    },
  });

  return campaigns.map((campaign) => {
    const targetAmount = Number(campaign.availableAmount);
    const currentAmount = campaign.transactions.reduce(
      (sum: number, transaction) => sum + Number(transaction.amount),
      0
    );

    const fundingPercentage =
      targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const donorCount = new Set(campaign.transactions.map((t) => t.id)).size; // Using transaction count as proxy
    const averageDonation = donorCount > 0 ? currentAmount / donorCount : 0;

    const patientsMatched = campaign.allocations.length;
    const appointmentsCompleted = campaign.allocations.filter(
      (allocation) => allocation.appointment?.status === "COMPLETED"
    ).length;

    const utilizationRate =
      patientsMatched > 0 ? (appointmentsCompleted / patientsMatched) * 100 : 0;

    const daysSinceCreated = Math.floor(
      (Date.now() - campaign.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Estimate depletion based on current usage rate (simplified)
    const estimatedDepletion =
      utilizationRate > 0
        ? Math.floor(currentAmount / (appointmentsCompleted * 100))
        : null;

    return {
      campaignId: campaign.id,
      title: campaign.title || "Donation Campaign",
      targetAmount,
      currentAmount,
      fundingPercentage,
      donorCount,
      averageDonation,
      patientsMatched,
      appointmentsCompleted,
      utilizationRate,
      daysSinceCreated,
      estimatedDepletion,
    };
  });
}

// Helper functions
async function getAverageTransactionValue(
  prisma: PrismaClient
): Promise<number> {
  const result = await prisma.transaction.aggregate({
    _avg: { amount: true },
    where: { status: "COMPLETED" },
  });
  return Number(result._avg?.amount) || 0;
}

async function getActivePatients(prisma: PrismaClient): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await prisma.user.count({
    where: {
      patientProfile: { isNot: null },
      appointments: {
        some: {
          createdAt: { gte: thirtyDaysAgo },
        },
      },
    },
  });
}

async function getActiveDonors(prisma: PrismaClient): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return await prisma.user.count({
    where: {
      donorProfile: { isNot: null },
      donationCampaigns: {
        some: {
          createdAt: { gte: thirtyDaysAgo },
        },
      },
    },
  });
}

async function getAverageCampaignFunding(
  prisma: PrismaClient
): Promise<number> {
  const campaigns = await prisma.donationCampaign.findMany({
    include: {
      transactions: true,
    },
  });

  if (campaigns.length === 0) return 0;

  const totalFunding = campaigns.reduce((sum, campaign) => {
    const campaignFunding = campaign.transactions.reduce(
      (campaignSum: number, transaction) =>
        campaignSum + Number(transaction.amount),
      0
    );
    return sum + campaignFunding;
  }, 0);

  return totalFunding / campaigns.length;
}

async function getCenterUtilizationRate(prisma: PrismaClient): Promise<number> {
  const totalCenters = await prisma.serviceCenter.count();
  const centersWithAppointments = await prisma.serviceCenter.count({
    where: {
      appointments: {
        some: {},
      },
    },
  });

  return totalCenters > 0 ? (centersWithAppointments / totalCenters) * 100 : 0;
}

async function getAverageWaitTime(prisma: PrismaClient): Promise<number> {
  const waitlistEntries = await prisma.waitlist.findMany({
    where: {
      status: "MATCHED",
      claimedAt: { not: null },
    },
  });

  if (waitlistEntries.length === 0) return 0;

  const totalWaitTime = waitlistEntries.reduce((sum: number, entry) => {
    if (entry.claimedAt) {
      const waitTime = entry.claimedAt.getTime() - entry.joinedAt.getTime();
      return sum + waitTime;
    }
    return sum;
  }, 0);

  // Convert to days
  return totalWaitTime / (waitlistEntries.length * 1000 * 60 * 60 * 24);
}

async function getMatchingSuccessRate(prisma: PrismaClient): Promise<number> {
  const totalWaitlistEntries = await prisma.waitlist.count();
  const matchedEntries = await prisma.waitlist.count({
    where: { status: "MATCHED" },
  });

  return totalWaitlistEntries > 0
    ? (matchedEntries / totalWaitlistEntries) * 100
    : 0;
}

// Time-based report helpers
async function getRevenueByPeriod(
  prisma: PrismaClient,
  period: string,
  from: Date,
  to: Date
): Promise<Array<{ date: string; amount: number }>> {
  const transactions = await prisma.transaction.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: from, lte: to },
    },
  });

  const groupedData = new Map<string, number>();

  transactions.forEach((transaction) => {
    const date = transaction.createdAt.toISOString().split("T")[0];
    const amount = Number(transaction.amount);
    groupedData.set(date, (groupedData.get(date) || 0) + amount);
  });

  return Array.from(groupedData.entries())
    .map(([date, amount]) => ({
      date,
      amount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getAppointmentsByPeriod(
  prisma: PrismaClient,
  period: string,
  from: Date,
  to: Date
): Promise<Array<{ date: string; count: number }>> {
  const appointments = await prisma.appointment.findMany({
    where: {
      createdAt: { gte: from, lte: to },
    },
  });

  const groupedData = new Map<string, number>();

  appointments.forEach((appointment) => {
    const date = appointment.createdAt.toISOString().split("T")[0];
    groupedData.set(date, (groupedData.get(date) || 0) + 1);
  });

  return Array.from(groupedData.entries())
    .map(([date, count]) => ({
      date,
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getRegistrationsByPeriod(
  prisma: PrismaClient,
  period: string,
  from: Date,
  to: Date
): Promise<Array<{ date: string; count: number }>> {
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: from, lte: to },
    },
  });

  const groupedData = new Map<string, number>();

  users.forEach((user) => {
    const date = user.createdAt.toISOString().split("T")[0];
    groupedData.set(date, (groupedData.get(date) || 0) + 1);
  });

  return Array.from(groupedData.entries())
    .map(([date, count]) => ({
      date,
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Growth rate calculations
async function calculateUserGrowthRate(
  prisma: PrismaClient,
  from: Date,
  to: Date
): Promise<number> {
  const previousPeriodStart = new Date(from);
  const periodLength = to.getTime() - from.getTime();
  previousPeriodStart.setTime(from.getTime() - periodLength);

  const [currentPeriodUsers, previousPeriodUsers] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: from, lte: to } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: previousPeriodStart, lte: from } },
    }),
  ]);

  return previousPeriodUsers > 0
    ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100
    : 0;
}

async function calculateRevenueGrowthRate(
  prisma: PrismaClient,
  from: Date,
  to: Date
): Promise<number> {
  const previousPeriodStart = new Date(from);
  const periodLength = to.getTime() - from.getTime();
  previousPeriodStart.setTime(from.getTime() - periodLength);

  const [currentRevenue, previousRevenue] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: "COMPLETED",
        createdAt: { gte: from, lte: to },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: "COMPLETED",
        createdAt: { gte: previousPeriodStart, lte: from },
      },
    }),
  ]);

  const current = Number(currentRevenue._sum?.amount) || 0;
  const previous = Number(previousRevenue._sum?.amount) || 0;

  return previous > 0 ? ((current - previous) / previous) * 100 : 0;
}

async function calculateAppointmentGrowthRate(
  prisma: PrismaClient,
  from: Date,
  to: Date
): Promise<number> {
  const previousPeriodStart = new Date(from);
  const periodLength = to.getTime() - from.getTime();
  previousPeriodStart.setTime(from.getTime() - periodLength);

  const [currentPeriodAppointments, previousPeriodAppointments] =
    await Promise.all([
      prisma.appointment.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      prisma.appointment.count({
        where: { createdAt: { gte: previousPeriodStart, lte: from } },
      }),
    ]);

  return previousPeriodAppointments > 0
    ? ((currentPeriodAppointments - previousPeriodAppointments) /
        previousPeriodAppointments) *
        100
    : 0;
}

// Geographic report helpers
async function getUsersByState(
  prisma: PrismaClient
): Promise<Array<{ state: string; count: number }>> {
  const users = await prisma.user.findMany({
    include: {
      patientProfile: { select: { state: true } },
    },
  });

  const stateCount = new Map<string, number>();
  users.forEach((user) => {
    const state = user.patientProfile?.state;
    if (state) {
      stateCount.set(state, (stateCount.get(state) || 0) + 1);
    }
  });

  return Array.from(stateCount.entries()).map(([state, count]) => ({
    state,
    count,
  }));
}

async function getCentersByState(
  prisma: PrismaClient
): Promise<Array<{ state: string; count: number }>> {
  const centers = await prisma.serviceCenter.findMany({
    select: { state: true },
  });

  const stateCount = new Map<string, number>();
  centers.forEach((center) => {
    if (center.state) {
      stateCount.set(center.state, (stateCount.get(center.state) || 0) + 1);
    }
  });

  return Array.from(stateCount.entries()).map(([state, count]) => ({
    state,
    count,
  }));
}

async function getAppointmentsByState(
  prisma: PrismaClient
): Promise<Array<{ state: string; count: number }>> {
  const appointments = await prisma.appointment.findMany({
    include: {
      center: { select: { state: true } },
    },
  });

  const stateCount = new Map<string, number>();
  appointments.forEach((appointment) => {
    if (appointment.center.state) {
      stateCount.set(
        appointment.center.state,
        (stateCount.get(appointment.center.state) || 0) + 1
      );
    }
  });

  return Array.from(stateCount.entries()).map(([state, count]) => ({
    state,
    count,
  }));
}

async function getRevenueByState(
  prisma: PrismaClient
): Promise<Array<{ state: string; amount: number }>> {
  const transactions = await prisma.transaction.findMany({
    where: { status: "COMPLETED" },
    include: {
      appointments: {
        include: {
          center: { select: { state: true } },
        },
      },
    },
  });

  const stateRevenue = new Map<string, number>();
  transactions.forEach((transaction) => {
    if (transaction.appointments && transaction.appointments.length > 0) {
      const state = transaction.appointments[0].center.state;
      if (state) {
        stateRevenue.set(
          state,
          (stateRevenue.get(state) || 0) + Number(transaction.amount)
        );
      }
    }
  });

  return Array.from(stateRevenue.entries()).map(([state, amount]) => ({
    state,
    amount,
  }));
}

async function getWaitlistHotZones(prisma: PrismaClient): Promise<
  Array<{
    state: string;
    waitlistCount: number;
    averageWaitTime: number;
  }>
> {
  const waitlistEntries = await prisma.waitlist.findMany({
    include: {
      patient: {
        include: {
          patientProfile: { select: { state: true } },
        },
      },
    },
  });

  const stateData = new Map<
    string,
    { count: number; totalWaitTime: number; matched: number }
  >();

  waitlistEntries.forEach((entry) => {
    const state = entry.patient.patientProfile?.state;
    if (state) {
      const data = stateData.get(state) || {
        count: 0,
        totalWaitTime: 0,
        matched: 0,
      };
      data.count += 1;

      if (entry.status === "MATCHED" && entry.claimedAt) {
        data.matched += 1;
        data.totalWaitTime +=
          entry.claimedAt.getTime() - entry.joinedAt.getTime();
      }

      stateData.set(state, data);
    }
  });

  return Array.from(stateData.entries()).map(([state, data]) => ({
    state,
    waitlistCount: data.count,
    averageWaitTime:
      data.matched > 0
        ? data.totalWaitTime / (data.matched * 1000 * 60 * 60 * 24) // Convert to days
        : 0,
  }));
}
