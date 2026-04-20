import { PrismaClient } from "@prisma/client";
import { TDonationCampaign } from "@zerocancer/shared/types";
import { getDB } from "./db";
import { createNotificationForUsers } from "./utils";
import { WhatsAppService } from "./whatsapp";

// Type definitions for Prisma "Enums" (which are Strings in SQLite)
type CampaignStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "DELETED"
  | "PENDING"
  | "SUSPENDED";
type Gender = "MALE" | "FEMALE";

// Enhanced waitlist matching types and interfaces
interface BatchConfig {
  patientsPerScreeningType: number;
  maxTotalPatients: number;
  enableParallelProcessing: boolean;
  maxConcurrentScreeningTypes: number;
  enableDemographicTargeting: boolean;
  enableGeographicTargeting: boolean;
  allocationExpiryDays: number;
}

// Extended campaign type for matching algorithm with database relations
interface MatchingCampaign {
  id: string;
  donorId: string;
  donor?: {
    fullName: string;
    donorProfile?: {
      organizationName: string | null;
    };
  };
  totalAmount: number;
  availableAmount: number;
  title: string;
  purpose?: string | null;
  targetGender?: Gender | null;
  targetAgeRange?: string | null;
  targetStates: string[];
  targetLgas: string[];
  status: CampaignStatus;
  expiryDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  targetAssociationId?: string | null;
  targetGroupId?: string | null;
  targetIndividualId?: string | null;
  targetPhone?: string | null;

  // Additional computed fields for targeting
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetIncomeMin?: number;
  targetIncomeMax?: number;

  // Relations
  screeningTypes: Array<{
    id: string;
    name: string;
    description: string | null;
    screeningTypeCategoryId: string;
    active: boolean;
    agreedPrice: number;
  }>;
}

interface MatchingMetrics {
  screeningTypesProcessed: number;
  patientsEvaluated: number;
  successfulMatches: number;
  skippedDueToLimits: number;
  skippedDueToNoFunding: number;
  skippedDueToExistingMatch: number;
  processingTimeMs: number;
  totalFundsAllocated: number;
  campaignsUsed: Set<string>;
  generalPoolUsageCount: number;
  generalPoolFundsUsed: number;
  dbQueriesCount: number;
  notificationsSent: number;
  transactionBatches: number;
  targetingMatches: number;
  targetingMismatches: number;
  screeningTypeBreakdown: Map<
    string,
    {
      name: string;
      patientsProcessed: number;
      matchesCreated: number;
      fundsUsed: number;
      campaignsInvolved: string[];
    }
  >;
  errors: any[];
  warnings: any[];
  // Expiry tracking
  expiredAllocations: number;
  fundsReturnedFromExpiry: number;
}

interface PatientWithProfile {
  id: string;
  patientId: string;
  screeningTypeId: string;
  status: string;
  joinedAt: Date;
  patient: {
    id: string;
    age?: number;
    gender?: string;
    state?: string;
    lga?: string;
    phone?: string | null;
    monthlyIncome?: number;
    patientProfile?: {
      gender?: string;
      dateOfBirth: Date;
      state?: string;
      city?: string;
      associationId?: string | null;
      groupId?: string | null;
    };
    donationAllocations: Array<{
      id: string;
      campaignId: string;
      claimedAt: Date | null;
      waitlist?: {
        status: string;
      };
    }>;
  };
  screening: {
    id: string;
    name: string;
    agreedPrice: number;
    campaigns: MatchingCampaign[];
  };
}

// Helper functions for demographic/geographic targeting

/**
 * Parses an age range string (e.g., "18-65") into min and max values.
 * Used for campaign age targeting criteria.
 *
 * @param ageRange - String in format "min-max" (e.g., "18-65")
 * @returns Tuple of [min, max] where missing values default to 0 and 999
 */
function parseAgeRange(ageRange: string): [number, number] {
  const [min, max] = ageRange.split("-").map(Number);
  return [min || 0, max || 999];
}

/**
 * Determines if a patient matches a campaign's targeting criteria.
 * This is the core targeting logic that evaluates demographic and geographic compatibility.
 *
 * Targeting criteria checked:
 * - Age range (with fallback to calculated age from date of birth)
 * - Gender (supports multiple target genders)
 * - Geographic location (state and LGA targeting)
 * - Income range (monthly income targeting)
 *
 * @param patient - Patient with profile data including demographics
 * @param campaign - Campaign with targeting criteria
 * @param config - Configuration that can disable targeting globally
 * @returns true if patient matches all campaign targeting criteria
 */
function doesPatientMatchCampaign(
  patient: PatientWithProfile,
  campaign: MatchingCampaign,
  config: BatchConfig
): boolean {
  if (!config.enableDemographicTargeting) {
    return true; // If targeting disabled, all patients match
  }

  // 1. SPECIFIC INDIVIDUAL TARGETING (Highest Priority)
  // Check if campaign is targeted to this specific user (by ID or Phone)
  if (campaign.targetIndividualId) {
    if (campaign.targetIndividualId !== patient.patientId) return false;
  }

  if (campaign.targetPhone) {
    const patientPhone = patient.patient?.phone; // We might need to select phone in the query
    if (patientPhone !== campaign.targetPhone) return false;
  }

  // 2. COMMUNITY TARGETING (Associations/Groups)
  if (campaign.targetAssociationId) {
    if (patient.patient.patientProfile?.associationId !== campaign.targetAssociationId) return false;
  }

  if (campaign.targetGroupId) {
    if (patient.patient.patientProfile?.groupId !== campaign.targetGroupId) return false;
  }

  // Existing demographic targeting
  const patientAge =
    patient.patient.age ||
    calculateAgeFromProfile(patient.patient.patientProfile?.dateOfBirth);

  if (campaign.targetAgeRange) {
    // Parse age range string (e.g., "18-65")
    const [ageMin, ageMax] = parseAgeRange(campaign.targetAgeRange);
    if (patientAge && (patientAge < ageMin || patientAge > ageMax)) {
      return false;
    }
  } else if (campaign.targetAgeMin || campaign.targetAgeMax) {
    // Use individual min/max values
    if (!patientAge) return true; // If age unknown, allow match
    if (campaign.targetAgeMin && patientAge < campaign.targetAgeMin)
      return false;
    if (campaign.targetAgeMax && patientAge > campaign.targetAgeMax)
      return false;
  }

  // Gender targeting
  if (campaign.targetGender) {
    const patientGender =
      patient.patient.gender || patient.patient.patientProfile?.gender;
    if (!patientGender || campaign.targetGender !== patientGender) return false;
  }

  // State targeting
  if (campaign.targetStates && campaign.targetStates.length > 0) {
    const patientState =
      patient.patient.state || patient.patient.patientProfile?.state;
    if (!patientState || !campaign.targetStates.includes(patientState))
      return false;
  }

  // LGA targeting
  if (campaign.targetLgas && campaign.targetLgas.length > 0) {
    if (
      !patient.patient.lga ||
      !campaign.targetLgas.includes(patient.patient.lga)
    )
      return false;
  }

  // Income targeting
  if (campaign.targetIncomeMin || campaign.targetIncomeMax) {
    const patientIncome = patient.patient.monthlyIncome || 0;
    if (campaign.targetIncomeMin && patientIncome < campaign.targetIncomeMin)
      return false;
    if (campaign.targetIncomeMax && patientIncome > campaign.targetIncomeMax)
      return false;
  }

  return true;
}

/**
 * Calculates a targeting score for how well a patient matches a campaign.
 * Higher scores indicate better targeting matches, used for campaign prioritization.
 *
 * Scoring system:
 * - Age match: +10 points
 * - Gender match: +15 points
 * - State match: +20 points
 * - LGA match: +25 points (most specific)
 * - Income match: +10 points
 *
 * Maximum possible score: 80 points
 *
 * @param campaign - Campaign with targeting criteria
 * @param patient - Patient with demographic data
 * @returns Numerical score (0-80) representing targeting quality
 */
function calculateTargetingScore(
  campaign: MatchingCampaign,
  patient: PatientWithProfile
): number {
  let score = 0;

  // 1. SPECIFIC TARGETING BONUSES (Highest Priority)
  if (campaign.targetIndividualId && campaign.targetIndividualId === patient.patientId) {
    score += 1000; // Guaranteed match if funding exists
  }
  
  if (campaign.targetPhone && patient.patient?.phone === campaign.targetPhone) {
    score += 1000;
  }

  if (campaign.targetAssociationId && patient.patient.patientProfile?.associationId === campaign.targetAssociationId) {
    score += 500;
  }

  if (campaign.targetGroupId && patient.patient.patientProfile?.groupId === campaign.targetGroupId) {
    score += 500;
  }

  // Higher score = better match
  // Age match bonus - handle both age range and individual min/max
  const patientAge =
    patient.patient.age ||
    calculateAgeFromProfile(patient.patient.patientProfile?.dateOfBirth);

  if (patientAge) {
    if (campaign.targetAgeRange) {
      // Parse age range string (e.g., "18-65")
      const [ageMin, ageMax] = parseAgeRange(campaign.targetAgeRange);
      if (patientAge >= ageMin && patientAge <= ageMax) {
        score += 10;
      }
    } else if (campaign.targetAgeMin || campaign.targetAgeMax) {
      // Use individual min/max values
      const minAge = campaign.targetAgeMin || 0;
      const maxAge = campaign.targetAgeMax || 150;
      if (patientAge >= minAge && patientAge <= maxAge) {
        score += 10;
      }
    }
  }

  // Gender match bonus
  const patientGender =
    patient.patient.gender || patient.patient.patientProfile?.gender;
  if (
    campaign.targetGender &&
    patientGender &&
    campaign.targetGender === patientGender
  ) {
    score += 15;
  }

  // Geographic match bonuses
  const patientState =
    patient.patient.state || patient.patient.patientProfile?.state;
  if (
    campaign.targetStates &&
    patientState &&
    campaign.targetStates.includes(patientState)
  ) {
    score += 20;
  }

  if (
    campaign.targetLgas &&
    patient.patient.lga &&
    campaign.targetLgas.includes(patient.patient.lga)
  ) {
    score += 25; // More specific = higher score
  }

  // Income match bonus
  if (campaign.targetIncomeMin || campaign.targetIncomeMax) {
    const patientIncome = patient.patient.monthlyIncome || 0;
    if (
      patientIncome >= (campaign.targetIncomeMin || 0) &&
      patientIncome <= (campaign.targetIncomeMax || Infinity)
    ) {
      score += 10;
    }
  }

  return score;
}

// Progress tracking utilities

/**
 * Displays a visual progress bar in the console for long-running operations.
 * Helps monitor algorithm progress in real-time.
 *
 * @param current - Current progress count
 * @param total - Total items to process
 * @param context - Description of what is being processed
 */
function updateProgress(current: number, total: number, context: string) {
  const percentage = Math.round((current / total) * 100);
  const progressBar =
    "█".repeat(Math.floor(percentage / 5)) +
    "░".repeat(20 - Math.floor(percentage / 5));
  console.log(
    `📊 ${context}: [${progressBar}] ${percentage}% (${current}/${total})`
  );
}

/**
 *  FOR FRIDAY
 * - Deal with the waitlistMatcherAlg
 * - Deal with results functionality
 */

/**
 * Rules for waitlistMatcherAlg:
  ZeroCancer Matching Algorithm (Finalized)
    - For each screening type, get the first 10 PENDING waitlist entries (FCFS).
    - For each patient:
      - Skip if the patient already has 3 unclaimed (MATCHED, not CLAIMED) allocations.
      - Skip if the patient already has a MATCHED allocation for this screening type.
      - Find all ACTIVE campaigns that support this screening type (via the many-to-many relation).
    - Prioritize campaigns:
      - Most specific (campaigns with only this screening type > campaigns with multiple types).
      - If tied, pick the one with the highest availableAmount.
      - If still tied, pick the earliest created.
      - If no campaign matches, and the general pool campaign (id = 'general-donor-pool') exists and has availableAmount, match to the general pool.
      - Skip if no campaign (including general pool) can fund the screening.
    - If matched:
      - Update waitlist status to MATCHED.
      - Create a DonationAllocation.
      - Decrement availableAmount and increment reservedAmount on the campaign.
 */

/**
 * Matches patients on the waitlist to available donation campaigns.
 * Should be called periodically (e.g., every hour by a scheduler).
 *
 * Can be triggered via webhook endpoints:
 * - POST /api/v1/waitlist/trigger-matching (with optional signature verification)
 * - POST /api/v1/waitlist/manual-trigger (with admin API key)
 * - GET /api/v1/waitlist/matching-status (health check)
 *
 * Environment variables for webhook security:
 * - WAITLIST_WEBHOOK_SECRET: Secret for signature verification (optional)
 * - ADMIN_API_KEY: API key for manual admin triggers (optional)
 *
 * - For each screening type, get all PENDING waitlist entries (FCFS order).
 * - For each, try to match to an ACTIVE campaign for that screening type.
 * - If matched, update waitlist status and create allocation.
 * - Honors max 3 unclaimed allocations per patient, skips if already matched for this screening type.
 * - Prioritizes most specific campaign, then highest availableAmount, then earliest created.
 * - Falls back to general pool if no specific campaign matches.
 */
/**
 * Enhanced Waitlist Matching Algorithm (Version 2.0)
 *
 * This is the main entry point for the waitlist matching system. It efficiently matches
 * patients on waitlists with available donation campaigns using advanced targeting and
 * batch processing techniques.
 *
 * Key Features:
 * - Single optimized database query to eliminate N+1 problems
 * - Demographic and geographic targeting for better matches
 * - Configurable batch processing for performance optimization
 * - Comprehensive execution tracking and metrics collection
 * - Parallel processing support for large datasets
 * - Intelligent campaign prioritization system
 * - Fallback to general donor pool when no targeted campaigns match
 *
 * Algorithm Flow:
 * 1. Initialize configuration and metrics tracking
 * 2. Create execution record for audit trail
 * 3. Fetch all waitlist data with single comprehensive query
 * 4. Group waitlists by screening type for efficient processing
 * 5. Process each screening type (sequential or parallel)
 * 6. For each eligible patient, find best matching campaign
 * 7. Create allocations in batched database transactions
 * 8. Send notifications to patients and donors
 * 9. Update metrics and complete execution tracking
 *
 * @param customConfig - Optional configuration overrides for batch processing
 * @returns Promise<{success: boolean, executionRef?: string, metrics?: object, error?: string}>
 */
export async function waitlistMatcherAlg(
  c: any,
  customConfig?: Partial<BatchConfig>
) {
  const startTime = Date.now();
  const db = getDB(c);

  // Default configuration
  const defaultConfig: BatchConfig = {
    patientsPerScreeningType: parseInt(c.env.WAITLIST_BATCH_SIZE || "50"),
    maxTotalPatients: parseInt(c.env.WAITLIST_MAX_TOTAL || "500"),
    enableParallelProcessing: c.env.WAITLIST_PARALLEL === "true",
    maxConcurrentScreeningTypes: parseInt(
      c.env.WAITLIST_CONCURRENT || "5"
    ),
    enableDemographicTargeting:
      c.env.WAITLIST_DEMOGRAPHIC_TARGETING !== "false",
    enableGeographicTargeting:
      c.env.WAITLIST_GEOGRAPHIC_TARGETING !== "false",
    allocationExpiryDays: parseInt(c.env.WAITLIST_EXPIRY_DAYS || "30"),
  };

  const config = { ...defaultConfig, ...customConfig };
  const executionRef = generateExecutionReference();

  // Initialize metrics
  const metrics: MatchingMetrics = {
    screeningTypesProcessed: 0,
    patientsEvaluated: 0,
    successfulMatches: 0,
    skippedDueToLimits: 0,
    skippedDueToNoFunding: 0,
    skippedDueToExistingMatch: 0,
    processingTimeMs: 0,
    totalFundsAllocated: 0,
    campaignsUsed: new Set<string>(),
    generalPoolUsageCount: 0,
    generalPoolFundsUsed: 0,
    dbQueriesCount: 0,
    notificationsSent: 0,
    transactionBatches: 0,
    targetingMatches: 0,
    targetingMismatches: 0,
    screeningTypeBreakdown: new Map(),
    errors: [],
    warnings: [],
    // Expiry tracking
    expiredAllocations: 0,
    fundsReturnedFromExpiry: 0,
  };

  // Create execution record
  let executionRecord;
  try {
    executionRecord = await db.matchingExecution.create({
      data: {
        executionReference: executionRef,
        batchConfig: config as any,
        status: "RUNNING",
      },
    });
    metrics.dbQueriesCount++;
  } catch (error) {
    console.error("Failed to create execution record:", error);
    return { success: false, error: "Failed to initialize execution tracking" };
  }

  console.log(`🔄 Starting enhanced waitlist matching algorithm...`);
  console.log(`📋 Execution Reference: ${executionRef}`);
  console.log(`⚙️  Configuration:`, config);

  // STEP 1: Expire old allocations before processing new matches
  console.log(`🕐 Step 1: Checking for expired allocations...`);
  const expiryResults = await expireOldAllocations(
    c,
    db,
    config.allocationExpiryDays,
    executionRecord.id
  );

  if (expiryResults.expired > 0) {
    console.log(
      `⏰ Expired ${
        expiryResults.expired
      } old allocations, returned ₦${expiryResults.fundsReturned.toLocaleString()} to campaigns`
    );

    // Update metrics with expiry results
    metrics.expiredAllocations = expiryResults.expired;
    metrics.fundsReturnedFromExpiry = expiryResults.fundsReturned;
    if (expiryResults.errors.length > 0) {
      metrics.warnings.push(...expiryResults.errors);
    }

    // Update execution record with expiry metrics
    await db.matchingExecution.update({
      where: { id: executionRecord.id },
      data: {
        warnings:
          expiryResults.errors.length > 0
            ? JSON.stringify(expiryResults.errors)
            : undefined,
      },
    });
  }

  try {
    // OPTIMIZATION 1: Single comprehensive query to get all waitlist data
    console.log(`🔍 Fetching waitlist data with single optimized query...`);
    const queryStart = Date.now();

    const waitlistData = (await db.waitlist.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        patient: {
          include: {
            patientProfile: {
              select: {
                gender: true,
                dateOfBirth: true,
                city: true,
                state: true,
                // @ts-ignore - Ignore stale prisma client types
                associationId: true,
                // @ts-ignore - Ignore stale prisma client types
                groupId: true,
              },
            },
            phone: true,
            donationAllocations: {
              where: { claimedAt: null },
              select: {
                id: true,
                campaignId: true,
                claimedAt: true,
                waitlist: {
                  select: { status: true },
                },
              },
            },
          },
        },
        screening: {
          include: {
            campaigns: {
              where: {
                status: "ACTIVE",
                availableAmount: { gt: 0 },
              },
              include: {
                screeningTypes: true,
                donor: {
                  select: {
                    fullName: true,
                    donorProfile: {
                      select: { organizationName: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    })) as unknown as PatientWithProfile[];

    // Assign global ranks to patients
    waitlistData.forEach((w, index) => {
      // @ts-ignore
      w.rank = index + 1;
    });

    metrics.dbQueriesCount++;
    const queryTime = Date.now() - queryStart;
    console.log(
      `⚡ Query completed in ${queryTime}ms, found ${waitlistData.length} waitlist entries`
    );

    // Group waitlists by screening type for efficient processing
    const waitlistsByScreening = waitlistData.reduce((acc, waitlist) => {
      if (!acc[waitlist.screeningTypeId]) acc[waitlist.screeningTypeId] = [];
      acc[waitlist.screeningTypeId].push(waitlist);
      return acc;
    }, {} as Record<string, PatientWithProfile[]>);

    console.log(
      `📊 Found ${
        Object.keys(waitlistsByScreening).length
      } screening types with pending waitlists`
    );

    // Get general pool campaign once for reuse
    const generalPoolQuery = await db.donationCampaign.findFirst({
      where: {
        id: "general-donor-pool",
        status: "ACTIVE",
        availableAmount: { gt: 0 },
      },
      include: {
        screeningTypes: true,
        donor: {
          select: {
            fullName: true,
            donorProfile: {
              select: { organizationName: true },
            },
          },
        },
      },
    });
    const generalPoolCampaign: MatchingCampaign | null =
      generalPoolQuery as MatchingCampaign | null;
    metrics.dbQueriesCount++;

    // Process screening types (with optional parallel processing)
    const screeningTypeIds = Object.keys(waitlistsByScreening);

    if (config.enableParallelProcessing && screeningTypeIds.length > 1) {
      console.log(
        `🔄 Processing ${screeningTypeIds.length} screening types in parallel (max ${config.maxConcurrentScreeningTypes} concurrent)`
      );

      // Process in batches to avoid overwhelming the database
      for (
        let i = 0;
        i < screeningTypeIds.length;
        i += config.maxConcurrentScreeningTypes
      ) {
        const batch = screeningTypeIds.slice(
          i,
          i + config.maxConcurrentScreeningTypes
        );
        const promises = batch.map((screeningTypeId) =>
          processScreeningTypeBatch(
            screeningTypeId,
            waitlistsByScreening[screeningTypeId],
            generalPoolCampaign,
            config,
            metrics,
            executionRecord.id,
            db,
            c
          )
        );

        await Promise.allSettled(promises);
      }
    } else {
      // Sequential processing
      console.log(
        `🔄 Processing ${screeningTypeIds.length} screening types sequentially`
      );

      for (const screeningTypeId of screeningTypeIds) {
        await processScreeningTypeBatch(
          screeningTypeId,
          waitlistsByScreening[screeningTypeId],
          generalPoolCampaign,
          config,
          metrics,
          executionRecord.id,
          db,
          c
        );
      }
    }

    // Update final execution metrics
    const totalTime = Date.now() - startTime;
    metrics.processingTimeMs = totalTime;

    await db.matchingExecution.update({
      where: { id: executionRecord.id },
      data: {
        completedAt: new Date(),
        status: "COMPLETED",
        screeningTypesProcessed: metrics.screeningTypesProcessed,
        patientsEvaluated: metrics.patientsEvaluated,
        successfulMatches: metrics.successfulMatches,
        skippedDueToLimits: metrics.skippedDueToLimits,
        skippedDueToNoFunding: metrics.skippedDueToNoFunding,
        skippedDueToExistingMatch: metrics.skippedDueToExistingMatch,
        totalFundsAllocated: metrics.totalFundsAllocated,
        generalPoolFundsUsed: metrics.generalPoolFundsUsed,
        campaignsUsedCount: metrics.campaignsUsed.size,
        processingTimeMs: totalTime,
        dbQueriesCount: metrics.dbQueriesCount,
        notificationsSent: metrics.notificationsSent,
        errors: metrics.errors.length > 0 ? metrics.errors : undefined,
        warnings: metrics.warnings.length > 0 ? metrics.warnings : undefined,
      },
    });

    console.log(`🏁 Waitlist matching algorithm completed successfully!`);
    console.log(`📊 Final Metrics:`, {
      executionRef,
      totalTime: `${totalTime}ms`,
      screeningTypesProcessed: metrics.screeningTypesProcessed,
      patientsEvaluated: metrics.patientsEvaluated,
      successfulMatches: metrics.successfulMatches,
      totalFundsAllocated: `₦${metrics.totalFundsAllocated.toLocaleString()}`,
      expiredAllocations: metrics.expiredAllocations,
      fundsReturnedFromExpiry: `₦${metrics.fundsReturnedFromExpiry.toLocaleString()}`,
      campaignsUsed: metrics.campaignsUsed.size,
      dbQueries: metrics.dbQueriesCount,
      notificationsSent: metrics.notificationsSent,
    });

    return {
      success: true,
      executionRef,
      metrics: {
        ...metrics,
        campaignsUsed: Array.from(metrics.campaignsUsed),
        screeningTypeBreakdown: Object.fromEntries(
          metrics.screeningTypeBreakdown
        ),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(
      "❌ Fatal error in waitlist matching algorithm:",
      errorMessage
    );

    // Update execution record with error
    await db.matchingExecution
      .update({
        where: { id: executionRecord.id },
        data: {
          completedAt: new Date(),
          status: "FAILED",
          processingTimeMs: Date.now() - startTime,
          errors:
            metrics.errors.length > 0
              ? JSON.stringify(metrics.errors)
              : undefined,
          warnings:
            metrics.warnings.length > 0
              ? JSON.stringify(metrics.warnings)
              : undefined,
        },
      })
      .catch(console.error);

    return { success: false, error: errorMessage, executionRef };
  }
}

/**
 * Process a single screening type batch with enhanced logic
 *
 * This function handles the matching logic for all patients waitlisted for a specific
 * screening type. It implements intelligent patient selection, campaign matching,
 * and batch transaction processing for optimal performance.
 *
 * Processing Steps:
 * 1. Initialize tracking for this screening type
 * 2. Filter patients to find eligible candidates (respecting limits)
 * 3. For each eligible patient:
 *    - Check demographic/geographic targeting
 *    - Find best matching campaign using scoring system
 *    - Prepare batch operations (avoid individual transactions)
 * 4. Execute all operations in a single database transaction
 * 5. Send notifications in parallel
 * 6. Update screening type metrics and completion status
 *
 * Eligibility Criteria:
 * - Patient has fewer than 3 unclaimed allocations
 * - Patient not already matched for this screening type
 * - Patient meets campaign targeting criteria
 *
 * Campaign Selection Priority:
 * 1. Targeted campaigns (based on demographic/geographic matching)
 * 2. Campaign specificity (fewer screening types = higher priority)
 * 3. Available funding amount (higher = better)
 * 4. Creation date (older campaigns = higher priority)
 * 5. General pool as fallback
 *
 * @param screeningTypeId - ID of the screening type being processed
 * @param waitlists - Array of waitlist entries for this screening type
 * @param generalPoolCampaign - General donor pool campaign for fallback
 * @param config - Batch processing configuration
 * @param metrics - Global metrics object to update
 * @param executionId - Execution ID for tracking and logging
 * @param db - Database client for operations
 */
async function processScreeningTypeBatch(
  screeningTypeId: string,
  waitlists: PatientWithProfile[],
  generalPoolCampaign: MatchingCampaign | null,
  config: BatchConfig,
  metrics: MatchingMetrics,
  executionId: string,
  db: PrismaClient,
  c: any
) {
  const batchStart = Date.now();
  const screeningTypeName = waitlists[0]?.screening?.name || "Unknown";

  console.log(
    `\n🩺 Processing screening type: "${screeningTypeName}" (${waitlists.length} waitlists)`
  );

  // Initialize screening type metrics
  const screeningMetrics = {
    name: screeningTypeName,
    patientsProcessed: 0,
    matchesCreated: 0,
    fundsUsed: 0,
    campaignsInvolved: [] as string[],
  };

  // Create screening type result record
      const screeningResult = await db.matchingScreeningTypeResult.create({
        data: {
          executionId,
          screeningTypeId,
          screeningTypeName,
          patientsFound: waitlists.length,
          patientsProcessed: 0,
          matchesCreated: 0,
          skippedDueToLimits: 0,
          skippedDueToNoFunding: 0,
          skippedDueToExisting: 0,
          campaignsUsed: JSON.stringify([]),
          processingStarted: new Date(),
        },
      });
  metrics.dbQueriesCount++;

  // IMPROVEMENT: Get eligible patients up to batch limit (instead of just first N)
  const eligiblePatients = getEligiblePatientBatch(
    waitlists,
    config.patientsPerScreeningType
  );
  console.log(
    `👥 Found ${eligiblePatients.length} eligible patients from ${waitlists.length} total`
  );

  if (eligiblePatients.length === 0) {
    console.log(`⏭️  Skipping ${screeningTypeName} - no eligible patients`);
    await updateScreeningResult(
      screeningResult.id,
      screeningMetrics,
      batchStart,
      db
    );
    return;
  }

  // Batch operations for better performance
  const batchOperations = {
    campaignUpdates: [] as any[],
    waitlistUpdates: [] as any[],
    allocationsToCreate: [] as any[],
    notificationPromises: [] as Promise<any>[],
  };

  // Process each eligible patient
  for (const waitlist of eligiblePatients) {
    try {
      screeningMetrics.patientsProcessed++;
      metrics.patientsEvaluated++;

      console.log(
        `\n👤 Processing patient ${
          waitlist.patientId
        } (joined: ${waitlist.joinedAt.toISOString()})`
      );

      // Log patient processing
      await createExecutionLog(
        executionId,
        "INFO",
        `Processing patient ${waitlist.patientId}`,
        {
          patientId: waitlist.patientId,
          waitlistId: waitlist.id,
          screeningTypeId,
          joinedAt: waitlist.joinedAt,
        },
        db
      );

      // Find best campaign with demographic/geographic targeting
      const availableCampaigns = waitlist.screening.campaigns || [];
      const matchedCampaign = findBestCampaignForPatient(
        waitlist,
        availableCampaigns,
        generalPoolCampaign,
        config,
        // @ts-ignore
        waitlist.rank || 9999
      );

      if (!matchedCampaign) {
        console.log(
          `💸 No funding available for patient ${waitlist.patientId} - skipping`
        );
        screeningMetrics.patientsProcessed--; // Don't count as processed if no match
        metrics.skippedDueToNoFunding++;

        await createExecutionLog(
          executionId,
          "WARNING",
          `No funding available for patient ${waitlist.patientId}`,
          {
            patientId: waitlist.patientId,
            screeningTypeId,
            reason: "No suitable campaigns with available funding",
          },
          db
        );
        continue;
      }

      const isGeneralPool = matchedCampaign.id === "general-donor-pool";
      const amountToAllocate = waitlist.screening.agreedPrice;

      console.log(
        `✅ Creating match: Patient ${waitlist.patientId} → Campaign "${matchedCampaign.title}" for ${screeningTypeName}`
      );

      // Add to batch operations
      batchOperations.campaignUpdates.push(
        db.donationCampaign.update({
          where: { id: matchedCampaign.id },
          data: {
            availableAmount: { decrement: amountToAllocate },
          },
        })
      );

      batchOperations.waitlistUpdates.push(
        db.waitlist.update({
          where: { id: waitlist.id },
          data: { status: "MATCHED" },
        })
      );

      batchOperations.allocationsToCreate.push({
        waitlistId: waitlist.id,
        patientId: waitlist.patientId,
        campaignId: matchedCampaign.id,
        matchingExecutionId: executionId,
        amountAllocated: amountToAllocate,
        createdViaMatching: true,
      });

      // Prepare notifications
      batchOperations.notificationPromises.push(
        createNotificationForUsers(
          c,
          {
            type: "MATCHED",
            title: "You have been matched to a donation campaign!",
            message: `You have been matched for a free screening: ${screeningTypeName}. Please check your appointments for details.`,
            userIds: [waitlist.patientId],
            data: {
              screeningTypeId,
              campaignId: matchedCampaign.id,
              executionRef: executionId,
            },
          },
          true
        )
      );

      // WhatsApp Notification
      const whatsapp = new WhatsAppService(c);
      const patientPhone = waitlist.patient?.phone;
      if (patientPhone) {
        const donorName =
          matchedCampaign.donor?.donorProfile?.organizationName ||
          matchedCampaign.donor?.fullName ||
          matchedCampaign.title;

        batchOperations.notificationPromises.push(
          whatsapp.sendDonationNotification(
            patientPhone,
            donorName,
            amountToAllocate,
            screeningTypeName
          )
        );
      }

      batchOperations.notificationPromises.push(
        createNotificationForUsers(c, {
          type: "PATIENT_MATCHED",
          title: "A patient has been matched to your campaign!",
          message: `A patient has been matched for a screening: ${screeningTypeName}.`,
          userIds: [matchedCampaign.donorId],
          data: {
            screeningTypeId,
            patientId: waitlist.patientId,
            allocation: true,
            executionRef: executionId,
          },
        })
      );

      // Update metrics
      screeningMetrics.matchesCreated++;
      screeningMetrics.fundsUsed += amountToAllocate;

      if (!screeningMetrics.campaignsInvolved.includes(matchedCampaign.id)) {
        screeningMetrics.campaignsInvolved.push(matchedCampaign.id);
      }

      metrics.successfulMatches++;
      metrics.totalFundsAllocated += amountToAllocate;
      metrics.campaignsUsed.add(matchedCampaign.id);

      if (isGeneralPool) {
        metrics.generalPoolUsageCount++;
        metrics.generalPoolFundsUsed += amountToAllocate;
      }

      // Log successful match
      await createExecutionLog(
        executionId,
        "INFO",
        `Successfully matched patient ${waitlist.patientId}`,
        {
          patientId: waitlist.patientId,
          campaignId: matchedCampaign.id,
          campaignTitle: matchedCampaign.title,
          amountToAllocate,
          isGeneralPool,
          screeningTypeId,
        },
        db
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(
        `❌ Error processing patient ${waitlist.patientId}:`,
        errorMessage
      );
      metrics.errors.push({
        patientId: waitlist.patientId,
        screeningTypeId,
        error: errorMessage,
        timestamp: new Date(),
      });

      await createExecutionLog(
        executionId,
        "ERROR",
        `Error processing patient ${waitlist.patientId}: ${errorMessage}`,
        {
          patientId: waitlist.patientId,
          screeningTypeId,
          error: errorMessage,
          stack: errorStack,
        },
        db
      );
    }
  }

  // Execute batch operations in transaction
  if (batchOperations.allocationsToCreate.length > 0) {
    try {
      console.log(
        `📦 Executing batch transaction for ${batchOperations.allocationsToCreate.length} matches...`
      );

      await db.$transaction([
        ...batchOperations.campaignUpdates,
        ...batchOperations.waitlistUpdates,
        db.donationAllocation.createMany({
          data: batchOperations.allocationsToCreate,
        }),
      ]);

      metrics.transactionBatches++;
      metrics.dbQueriesCount +=
        batchOperations.campaignUpdates.length +
        batchOperations.waitlistUpdates.length +
        1;

      console.log(
        `📧 Sending ${batchOperations.notificationPromises.length} notifications...`
      );
      await Promise.allSettled(batchOperations.notificationPromises);
      metrics.notificationsSent += batchOperations.notificationPromises.length;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `❌ Batch transaction failed for ${screeningTypeName}:`,
        errorMessage
      );
      metrics.errors.push({
        screeningTypeId,
        error: `Batch transaction failed: ${errorMessage}`,
        timestamp: new Date(),
      });
    }
  }

  // Update screening type result
  await updateScreeningResult(
    screeningResult.id,
    screeningMetrics,
    batchStart,
    db
  );

  // Update global metrics
  metrics.screeningTypesProcessed++;
  metrics.screeningTypeBreakdown.set(screeningTypeId, screeningMetrics);

  console.log(
    `✨ Completed processing ${screeningTypeName} - ${screeningMetrics.matchesCreated} matches created`
  );
}

/**
 * Utility function to check if a patient can join a waitlist for a screening type.
 *
 * Business Rules:
 * - Patient cannot have multiple active waitlist entries for the same screening type
 * - Active statuses are PENDING (waiting for match) and MATCHED (allocation created)
 * - Patient can rejoin waitlist if previous entries are CLAIMED or EXPIRED
 *
 * @param db - Database client
 * @param patientId - ID of the patient
 * @param screeningTypeId - ID of the screening type
 * @returns Promise<boolean> true if patient can join waitlist
 */
export async function canJoinWaitlist(
  db: PrismaClient,
  patientId: string,
  screeningTypeId: string
) {
  // No active (PENDING or MATCHED) waitlist for this screening type
  // EXPIRED and CLAIMED statuses allow rejoining
  const active = await db.waitlist.findFirst({
    where: {
      patientId,
      screeningTypeId,
      status: { in: ["PENDING", "MATCHED"] },
    },
  });
  return !active;
}

/**
 * Helper function to get eligible patients with smart batch selection.
 *
 * This function implements intelligent patient filtering to ensure only eligible
 * patients are processed, respecting business rules and system limits.
 *
 * Eligibility Checks:
 * 1. Patient hasn't exceeded 3 unclaimed allocations (business rule)
 * 2. Patient doesn't already have MATCHED allocation for this screening type
 * 3. Respects batch size limits for performance
 * 4. Deduplicates patients (same patient can't appear multiple times)
 *
 * Performance Optimizations:
 * - Processes patients in FCFS order (based on joinedAt timestamp)
 * - Stops processing once batch size is reached
 * - Uses Set for O(1) duplicate checking
 * - Early exits for ineligible patients
 *
 * @param waitlists - Array of all waitlist entries for a screening type
 * @param batchSize - Maximum number of patients to process in this batch
 * @returns Array of eligible patients (up to batchSize)
 */
function getEligiblePatientBatch(
  waitlists: PatientWithProfile[],
  batchSize: number
): PatientWithProfile[] {
  const eligible = [];
  const processed = new Set<string>(); // Track patients we've already checked

  for (const waitlist of waitlists) {
    if (eligible.length >= batchSize) break;
    if (processed.has(waitlist.patientId)) continue;

    processed.add(waitlist.patientId);

    // Check eligibility criteria - count only active (unclaimed, non-expired) allocations
    const activeAllocations = waitlist.patient.donationAllocations.filter(
      (allocation) => !isAllocationExpiredOrClaimed(allocation)
    );
    const unclaimedCount = activeAllocations.length;

    if (unclaimedCount >= 3) {
      console.log(
        `⚠️  Skipping patient ${waitlist.patientId} - already has ${unclaimedCount} active unclaimed allocations`
      );
      continue;
    }

    // Check if already matched for this screening type (in memory)
    const alreadyMatchedForType = waitlists.some(
      (w) =>
        w.patientId === waitlist.patientId &&
        w.screeningTypeId === waitlist.screeningTypeId &&
        w.status === "MATCHED"
    );

    if (alreadyMatchedForType) {
      console.log(
        `⚠️  Skipping patient ${waitlist.patientId} - already has MATCHED allocation for this screening type`
      );
      continue;
    }

    eligible.push(waitlist);
  }

  return eligible;
}

/**
 * Enhanced campaign selection with targeting and intelligent prioritization.
 *
 * This function implements the core campaign selection logic, prioritizing campaigns
 * that best match the patient's demographic and geographic profile.
 *
 * Selection Algorithm:
 * 1. Filter campaigns by targeting criteria (demographic/geographic matching)
 * 2. Ensure campaign has sufficient funding for the screening
 * 3. Sort eligible campaigns by priority:
 *    - Targeting score (higher = better demographic match)
 *    - Campaign specificity (fewer screening types = more specific)
 *    - Available funding (higher amounts preferred)
 *    - Creation date (older campaigns get priority)
 * 4. Fallback to general pool if no targeted campaigns qualify
 *
 * Targeting Criteria:
 * - Age range compatibility
 * - Gender matching
 * - State/LGA geographic matching
 * - Income range compatibility
 *
 * @param patient - Patient with complete profile data
 * @param campaigns - Array of available campaigns for this screening type
 * @param generalPoolCampaign - General donor pool for fallback matching
 * @param config - Configuration including targeting enable/disable flags
 * @returns Selected campaign object or null if no suitable campaign found
 */
function findBestCampaignForPatient(
  patient: PatientWithProfile,
  campaigns: MatchingCampaign[],
  generalPoolCampaign: MatchingCampaign | null,
  config: BatchConfig,
  rank: number // Add global rank
): MatchingCampaign | null {
  // Filter campaigns by targeting criteria
  const eligibleCampaigns = campaigns.filter(
    (campaign) =>
      doesPatientMatchCampaign(patient, campaign, config) &&
      campaign.availableAmount >= patient.screening.agreedPrice
  );

  if (eligibleCampaigns.length > 0) {
    // Sort by targeting score, specificity, amount, and creation date
    eligibleCampaigns.sort((a, b) => {
      // Prioritize campaigns with better targeting match
      const aTargetingScore = calculateTargetingScore(a, patient);
      const bTargetingScore = calculateTargetingScore(b, patient);

      if (aTargetingScore !== bTargetingScore) {
        return bTargetingScore - aTargetingScore;
      }

      // Existing logic: specificity, amount, creation date
      if (a.screeningTypes.length !== b.screeningTypes.length) {
        return a.screeningTypes.length - b.screeningTypes.length;
      }

      if (b.availableAmount !== a.availableAmount) {
        return b.availableAmount - a.availableAmount;
      }

      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    console.log(
      `🎯 Selected targeted campaign: "${eligibleCampaigns[0].title}"`
    );
    return eligibleCampaigns[0];
  }

  // Try general pool as fallback
  if (
    generalPoolCampaign &&
    generalPoolCampaign.availableAmount >= patient.screening.agreedPrice
  ) {
    // ENFORCE FIRST 1000 RULE FOR GENERAL POOL
    if (rank > 1000) {
      console.log(`⏳ Patient ${patient.patientId} (rank ${rank}) is outside the first 1000 for general pool - skipping`);
      return null;
    }

    console.log(
      `🏦 Using general pool campaign (₦${generalPoolCampaign.availableAmount} available)`
    );
    return generalPoolCampaign;
  }

  return null;
}

/**
 * Create execution log entry for detailed audit trail.
 *
 * This function creates detailed log entries for every significant operation
 * in the matching algorithm, enabling comprehensive debugging and audit capabilities.
 *
 * Log Levels:
 * - INFO: Normal operations (patient processing, successful matches)
 * - WARNING: Important notifications (no funding, skipped patients)
 * - ERROR: Processing failures (individual patient errors, transaction failures)
 *
 * Context Information:
 * - Patient ID (for patient-specific operations)
 * - Campaign ID (for campaign-related operations)
 * - Waitlist ID (for waitlist updates)
 * - Screening Type ID (for screening-specific operations)
 * - Allocation ID (for donation allocation operations)
 *
 * @param executionId - ID of the current algorithm execution
 * @param level - Log level indicating severity/type
 * @param message - Human-readable description of the operation
 * @param context - Structured data with operation details
 * @param db - Database client for log persistence
 */
async function createExecutionLog(
  executionId: string,
  level: "INFO" | "WARNING" | "ERROR",
  message: string,
  context: any,
  db: PrismaClient
) {
  try {
    await db.matchingExecutionLog.create({
      data: {
        executionId,
        level,
        message,
        context,
        patientId: context.patientId || null,
        campaignId: context.campaignId || null,
        waitlistId: context.waitlistId || null,
        screeningTypeId: context.screeningTypeId || null,
        allocationId: context.allocationId || null,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to create execution log:", errorMessage);
  }
}

/**
 * Update screening type result with final metrics and processing time.
 *
 * This function updates the detailed results record for a specific screening type
 * with final processing metrics, enabling per-screening-type performance analysis.
 *
 * Metrics Updated:
 * - Patients processed count
 * - Successful matches created
 * - Total funds allocated
 * - Number of campaigns utilized
 * - Processing completion timestamp
 * - Total processing time in milliseconds
 *
 * This data is used for:
 * - Performance monitoring and optimization
 * - Screening type effectiveness analysis
 * - Resource utilization tracking
 * - Historical trend analysis
 *
 * @param resultId - ID of the screening type result record to update
 * @param metrics - Metrics object containing processing statistics
 * @param startTime - Processing start timestamp for duration calculation
 * @param db - Database client for update operation
 */
async function updateScreeningResult(
  resultId: string,
  metrics: any,
  startTime: number,
  db: PrismaClient
) {
  const processingTime = Date.now() - startTime;

  try {
    await db.matchingScreeningTypeResult.update({
      where: { id: resultId },
      data: {
        patientsProcessed: metrics.patientsProcessed,
        matchesCreated: metrics.matchesCreated,
        fundsAllocated: metrics.fundsUsed,
        campaignsUsed: JSON.stringify(metrics.campaignsInvolved),
        processingCompleted: new Date(),
        processingTimeMs: processingTime,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Failed to update screening result:", errorMessage);
  }
}

/**
 * Utility function to calculate age from date of birth.
 *
 * This function provides accurate age calculation considering leap years
 * and exact birth dates. Used as fallback when direct age field is not available.
 *
 * Calculation Logic:
 * - Compares current date with birth date
 * - Accounts for whether birthday has occurred this year
 * - Handles leap years and month/day differences correctly
 *
 * @param dateOfBirth - Date of birth from patient profile
 * @returns Calculated age in years, or null if date not provided
 */
function calculateAgeFromProfile(dateOfBirth?: Date): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Generate unique execution reference for tracking algorithm runs.
 *
 * Creates a unique identifier for each algorithm execution to enable:
 * - Tracking specific algorithm runs in logs and metrics
 * - Correlating related operations across database tables
 * - Debugging specific execution instances
 * - Audit trail maintenance
 *
 * Format: EXEC_YYYYMMDDHHMMSS_RANDOM
 * Example: EXEC_20250711143025_A1B2C3
 *
 * Components:
 * - EXEC prefix for easy identification
 * - Timestamp (year/month/day/hour/minute/second)
 * - 6-character random suffix for uniqueness
 *
 * @returns Unique execution reference string
 */
function generateExecutionReference(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:\-T]/g, "")
    .slice(0, 14);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EXEC_${timestamp}_${random}`;
}

/**
 * Expires old MATCHED but unclaimed allocations based on configuration.
 *
 * This function implements the allocation expiry business rule by:
 * 1. Finding MATCHED allocations older than the expiry threshold
 * 2. Transitioning waitlist status from MATCHED to EXPIRED
 * 3. Returning funds to the original campaigns
 * 4. Sending expiry notifications to affected patients
 * 5. Logging all expiry operations for audit trail
 *
 * Business Rules:
 * - Only MATCHED allocations with claimedAt = null are eligible for expiry
 * - Expiry threshold is based on allocation creation date + expiryDays
 * - Funds are returned to campaign availableAmount
 * - EXPIRED allocations don't count toward 3-allocation limit
 *
 * @param db - Database client for operations
 * @param expiryDays - Number of days after which unclaimed allocations expire
 * @param executionId - Current execution ID for tracking (optional)
 * @returns Promise<{expired: number, fundsReturned: number, errors: any[]}>
 */
async function expireOldAllocations(
  c: any,
  db: PrismaClient,
  expiryDays: number,
  executionId?: string
): Promise<{ expired: number; fundsReturned: number; errors: any[] }> {
  const startTime = Date.now();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - expiryDays);

  console.log(
    `🕐 Checking for allocations older than ${expiryDays} days (before ${cutoffDate.toISOString()})`
  );

  const results = {
    expired: 0,
    fundsReturned: 0,
    errors: [] as any[],
  };

  try {
    // Find MATCHED waitlists that have expired (check waitlist creation date, not allocation)
    const expiredWaitlists = await db.waitlist.findMany({
      where: {
        status: "MATCHED",
        joinedAt: { lt: cutoffDate }, // Check when patient joined waitlist
      },
      include: {
        allocation: true,
        screening: {
          select: { name: true, agreedPrice: true, id: true },
        },
        patient: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (expiredWaitlists.length === 0) {
      console.log(`✨ No expired allocations found`);
      return results;
    }

    console.log(
      `⏰ Found ${expiredWaitlists.length} expired allocations to process`
    );

    // Process each expired waitlist
    for (const waitlist of expiredWaitlists) {
      try {
        if (!waitlist.allocation) {
          console.log(
            `⚠️ Skipping waitlist ${waitlist.id} - no allocation found`
          );
          continue;
        }

        const amountToReturn =
          waitlist.allocation.amountAllocated || waitlist.screening.agreedPrice;

        // Get campaign details for logging
        const campaign = await db.donationCampaign.findUnique({
          where: { id: waitlist.allocation.campaignId },
          select: { title: true, availableAmount: true },
        });

        if (!campaign) {
          console.log(
            `⚠️ Skipping waitlist ${waitlist.id} - campaign not found`
          );
          continue;
        }

        await db.$transaction(async (tx) => {
          // Update waitlist status to EXPIRED
          await tx.waitlist.update({
            where: { id: waitlist.id },
            data: {
              status: "EXPIRED",
            },
          });

          // Return funds to campaign
          await tx.donationCampaign.update({
            where: { id: waitlist.allocation!.campaignId },
            data: {
              availableAmount: { increment: amountToReturn },
            },
          });

          console.log(
            `💰 Returned ₦${amountToReturn.toLocaleString()} to campaign "${
              campaign.title
            }"`
          );
        });

        // Send expiry notification to patient
        await createNotificationForUsers(
          c,
          {
            type: "ALLOCATION_EXPIRED",
            title: "Your screening allocation has expired",
            message: `Your allocation for ${waitlist.screening.name} has expired due to inactivity. You can rejoin the waitlist if you're still interested.`,
            userIds: [waitlist.patientId],
            data: {
              screeningTypeName: waitlist.screening.name,
              screeningTypeId: waitlist.screening.id,
              campaignTitle: campaign.title,
              amountReturned: amountToReturn,
              expiredAt: new Date().toISOString(),
              executionRef: executionId,
            },
          },
          true
        ); // Send email notification

        // Log the expiry operation
        if (executionId) {
          await createExecutionLog(
            executionId,
            "INFO",
            `Expired allocation for patient ${waitlist.patientId}`,
            {
              patientId: waitlist.patientId,
              campaignId: waitlist.allocation.campaignId,
              waitlistId: waitlist.id,
              screeningTypeId: waitlist.screeningTypeId,
              amountReturned: amountToReturn,
              allocationAge: Math.floor(
                (Date.now() - waitlist.joinedAt.getTime()) /
                  (1000 * 60 * 60 * 24)
              ),
              reason: "Allocation expired due to inactivity",
            },
            db
          );
        }

        results.expired++;
        results.fundsReturned += amountToReturn;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `❌ Error expiring waitlist ${waitlist.id}:`,
          errorMessage
        );

        results.errors.push({
          waitlistId: waitlist.id,
          patientId: waitlist.patientId,
          error: errorMessage,
          timestamp: new Date(),
        });

        // Log the error
        if (executionId) {
          await createExecutionLog(
            executionId,
            "ERROR",
            `Failed to expire waitlist ${waitlist.id}: ${errorMessage}`,
            {
              waitlistId: waitlist.id,
              patientId: waitlist.patientId,
              error: errorMessage,
            },
            db
          );
        }
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(
      `✅ Allocation expiry completed: ${
        results.expired
      } expired, ₦${results.fundsReturned.toLocaleString()} returned (${processingTime}ms)`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `🚨 Critical error in allocation expiry process:`,
      errorMessage
    );

    results.errors.push({
      type: "SYSTEM_ERROR",
      error: errorMessage,
      timestamp: new Date(),
    });
  }

  return results;
}

/**
 * Check if allocation should be excluded from patient limits due to expiry.
 * This helper function determines if an allocation counts toward the 3-allocation limit.
 *
 * @param allocation - Allocation object with status information
 * @returns true if allocation should be excluded from limits
 */
function isAllocationExpiredOrClaimed(allocation: {
  claimedAt: Date | null;
  waitlist?: { status: string };
}): boolean {
  // If claimed, it doesn't count toward limit
  if (allocation.claimedAt !== null) {
    return true;
  }

  // If waitlist status is EXPIRED, it doesn't count toward limit
  if (allocation.waitlist?.status === "EXPIRED") {
    return true;
  }

  return false;
}
