-- ZeroCancer Production Database Schema
-- Complete production-ready schema for D1 SQLite database

-- Users table (core authentication)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Patient profiles
CREATE TABLE IF NOT EXISTS "PatientProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "gender" TEXT,
    "dateOfBirth" DATETIME NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "emailVerified" DATETIME,
    "associationId" TEXT,
    "groupId" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("associationId") REFERENCES "Association" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL
);

-- Donor profiles
CREATE TABLE IF NOT EXISTS "DonorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "organizationName" TEXT,
    "country" TEXT,
    "emailVerified" DATETIME,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Admins
CREATE TABLE IF NOT EXISTS "Admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Admin reset tokens
CREATE TABLE IF NOT EXISTS "AdminResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("adminId") REFERENCES "Admins" ("id") ON DELETE CASCADE
);

-- Service Centers
CREATE TABLE IF NOT EXISTS "ServiceCenter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "centerName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "phone" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "bankCode" TEXT,
    "accountName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Center Staff
CREATE TABLE IF NOT EXISTS "CenterStaff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT DEFAULT 'admin',
    "status" TEXT DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE CASCADE,
    UNIQUE("centerId", "email")
);

-- Center Staff Reset Tokens
CREATE TABLE IF NOT EXISTS "CenterStaffResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" DATETIME NOT NULL,
    FOREIGN KEY ("staffId") REFERENCES "CenterStaff" ("id") ON DELETE CASCADE
);

-- Center Staff Invites
CREATE TABLE IF NOT EXISTS "CenterStaffInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" DATETIME,
    "acceptedAt" DATETIME,
    FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE CASCADE
);

-- Screening Type Categories
CREATE TABLE IF NOT EXISTS "ScreeningTypeCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- Screening Types
CREATE TABLE IF NOT EXISTS "ScreeningType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "screeningTypeCategoryId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "agreedPrice" REAL NOT NULL DEFAULT 10000.0,
    FOREIGN KEY ("screeningTypeCategoryId") REFERENCES "ScreeningTypeCategory" ("id") ON DELETE RESTRICT
);

-- Service Center Screening Types (pricing)
CREATE TABLE IF NOT EXISTS "ServiceCenterScreeningType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "screeningTypeId" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 10000.0,
    FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE RESTRICT,
    UNIQUE("centerId", "screeningTypeId")
);

-- Donation Campaigns
CREATE TABLE IF NOT EXISTS "DonationCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "availableAmount" REAL NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT,
    "targetGender" TEXT,
    "targetAgeRange" TEXT,
    "targetStates" TEXT NOT NULL DEFAULT '[]',
    "targetLgas" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL,
    "expiryDate" DATETIME,
    "targetAssociationId" TEXT,
    "targetGroupId" TEXT,
    "targetIndividualId" TEXT,
    "targetPhone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("donorId") REFERENCES "User" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("targetAssociationId") REFERENCES "Association" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("targetGroupId") REFERENCES "Group" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("targetIndividualId") REFERENCES "User" ("id") ON DELETE SET NULL
);

-- Waitlists
CREATE TABLE IF NOT EXISTS "Waitlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "screeningTypeId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" DATETIME,
    "expiredAt" DATETIME,
    FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Donation Allocations
CREATE TABLE IF NOT EXISTS "DonationAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitlistId" TEXT NOT NULL UNIQUE,
    "appointmentId" TEXT,
    "patientId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "claimedAt" DATETIME,
    "matchingExecutionId" TEXT,
    "amountAllocated" REAL,
    "createdViaMatching" BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY ("waitlistId") REFERENCES "Waitlist" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("campaignId") REFERENCES "DonationCampaign" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("matchingExecutionId") REFERENCES "matching_executions" ("id") ON DELETE SET NULL
);

-- Transactions
CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "relatedDonationId" TEXT,
    "paymentReference" TEXT,
    "paymentChannel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("relatedDonationId") REFERENCES "DonationCampaign" ("id") ON DELETE SET NULL
);

-- Appointments
CREATE TABLE IF NOT EXISTS "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "screeningTypeId" TEXT NOT NULL,
    "donationId" TEXT,
    "isDonation" BOOLEAN NOT NULL DEFAULT false,
    "appointmentDateTime" DATETIME NOT NULL,
    "transactionId" TEXT,
    "status" TEXT NOT NULL,
    "cancellationReason" TEXT,
    "cancellationDate" DATETIME,
    "checkInCode" TEXT UNIQUE,
    "checkInCodeExpiresAt" DATETIME,
    "kitId" TEXT UNIQUE,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("kitId") REFERENCES "Kit" ("id") ON DELETE SET NULL
);

-- Appointment Verification
CREATE TABLE IF NOT EXISTS "AppointmentVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL UNIQUE,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME NOT NULL,
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("verifiedBy") REFERENCES "CenterStaff" ("id") ON DELETE SET NULL
);

-- Screening Results
CREATE TABLE IF NOT EXISTS "ScreeningResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL UNIQUE,
    "notes" TEXT,
    "uploadedBy" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("uploadedBy") REFERENCES "CenterStaff" ("id") ON DELETE SET NULL
);

-- Screening Result Files
CREATE TABLE IF NOT EXISTS "ScreeningResultFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resultId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "cloudinaryId" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "deletionReason" TEXT,
    FOREIGN KEY ("resultId") REFERENCES "ScreeningResult" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("deletedBy") REFERENCES "CenterStaff" ("id") ON DELETE SET NULL
);

-- Kits
CREATE TABLE IF NOT EXISTS "Kit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL UNIQUE,
    "batchNumber" TEXT,
    "screeningTypeId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT
);

-- Receipts
CREATE TABLE IF NOT EXISTS "Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL UNIQUE,
    "receiptNumber" TEXT NOT NULL UNIQUE,
    "receiptData" TEXT NOT NULL,
    "pdfPath" TEXT,
    "emailSentAt" DATETIME,
    "emailRecipient" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE
);

-- Paystack Recipients
CREATE TABLE IF NOT EXISTS "paystack_recipients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL UNIQUE,
    "recipientCode" TEXT NOT NULL UNIQUE,
    "reference" TEXT NOT NULL UNIQUE,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT
);

-- Payouts
CREATE TABLE IF NOT EXISTS "payouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchReference" TEXT NOT NULL,
    "payoutNumber" TEXT NOT NULL UNIQUE,
    "centerId" TEXT NOT NULL,
    "recipientId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paystackFee" REAL NOT NULL DEFAULT 10.00,
    "netAmount" REAL NOT NULL,
    "transferReference" TEXT UNIQUE,
    "paystackTransferId" TEXT UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL DEFAULT 'MANUAL',
    "initiatedBy" TEXT,
    "processedAt" DATETIME,
    "completedAt" DATETIME,
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("recipientId") REFERENCES "paystack_recipients" ("id") ON DELETE SET NULL
);

-- Payout Items
CREATE TABLE IF NOT EXISTS "payout_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payoutId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL UNIQUE,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "serviceDate" DATETIME NOT NULL,
    "appointmentId" TEXT,
    FOREIGN KEY ("payoutId") REFERENCES "payouts" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" DATETIME NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Email Verification Tokens
CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "profileType" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notification Recipients
CREATE TABLE IF NOT EXISTS "NotificationRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    FOREIGN KEY ("notificationId") REFERENCES "Notification" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Matching Executions
CREATE TABLE IF NOT EXISTS "matching_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionReference" TEXT NOT NULL UNIQUE,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "screeningTypesProcessed" INTEGER NOT NULL DEFAULT 0,
    "patientsEvaluated" INTEGER NOT NULL DEFAULT 0,
    "successfulMatches" INTEGER NOT NULL DEFAULT 0,
    "skippedDueToLimits" INTEGER NOT NULL DEFAULT 0,
    "skippedDueToNoFunding" INTEGER NOT NULL DEFAULT 0,
    "skippedDueToExistingMatch" INTEGER NOT NULL DEFAULT 0,
    "totalFundsAllocated" REAL NOT NULL DEFAULT 0,
    "generalPoolFundsUsed" REAL NOT NULL DEFAULT 0,
    "campaignsUsedCount" INTEGER NOT NULL DEFAULT 0,
    "processingTimeMs" INTEGER,
    "dbQueriesCount" INTEGER NOT NULL DEFAULT 0,
    "notificationsSent" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "warnings" TEXT,
    "batchConfig" TEXT
);

-- Matching Execution Logs
CREATE TABLE IF NOT EXISTS "matching_execution_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" TEXT,
    "patientId" TEXT,
    "campaignId" TEXT,
    "waitlistId" TEXT,
    "screeningTypeId" TEXT,
    "allocationId" TEXT,
    FOREIGN KEY ("executionId") REFERENCES "matching_executions" ("id") ON DELETE CASCADE
);

-- Matching Screening Type Results
CREATE TABLE IF NOT EXISTS "matching_screening_type_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "screeningTypeId" TEXT NOT NULL,
    "screeningTypeName" TEXT NOT NULL,
    "patientsFound" INTEGER NOT NULL,
    "patientsProcessed" INTEGER NOT NULL,
    "matchesCreated" INTEGER NOT NULL,
    "skippedDueToLimits" INTEGER NOT NULL,
    "skippedDueToNoFunding" INTEGER NOT NULL,
    "skippedDueToExisting" INTEGER NOT NULL,
    "fundsAllocated" REAL NOT NULL DEFAULT 0,
    "campaignsUsed" TEXT NOT NULL,
    "generalPoolUsed" BOOLEAN NOT NULL DEFAULT false,
    "generalPoolAmount" REAL NOT NULL DEFAULT 0,
    "targetingMatches" INTEGER NOT NULL DEFAULT 0,
    "targetingMismatches" INTEGER NOT NULL DEFAULT 0,
    "processingStarted" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingCompleted" DATETIME,
    "processingTimeMs" INTEGER,
    FOREIGN KEY ("executionId") REFERENCES "matching_executions" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE RESTRICT,
    UNIQUE("executionId", "screeningTypeId")
);

-- Associations
CREATE TABLE IF NOT EXISTS "Association" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Groups
CREATE TABLE IF NOT EXISTS "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Store Products
CREATE TABLE IF NOT EXISTS "StoreProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "stock" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "authorId" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("authorId") REFERENCES "Admins" ("id") ON DELETE CASCADE
);

-- Blog Categories
CREATE TABLE IF NOT EXISTS "blog_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "slug" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Blog Post Categories (junction table)
CREATE TABLE IF NOT EXISTS "blog_post_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    FOREIGN KEY ("postId") REFERENCES "blog_posts" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("categoryId") REFERENCES "blog_categories" ("id") ON DELETE CASCADE,
    UNIQUE("postId", "categoryId")
);

-- Many-to-many junction tables
CREATE TABLE IF NOT EXISTS "_ScreeningTypeToServiceCenter" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    FOREIGN KEY ("A") REFERENCES "ScreeningType" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("B") REFERENCES "ServiceCenter" ("id") ON DELETE CASCADE,
    UNIQUE("A", "B")
);

CREATE TABLE IF NOT EXISTS "_DonationCampaignScreeningTypes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    FOREIGN KEY ("A") REFERENCES "DonationCampaign" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("B") REFERENCES "ScreeningType" ("id") ON DELETE CASCADE,
    UNIQUE("A", "B")
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_waitlist_status_screening_joined" ON "Waitlist"("status", "screeningTypeId", "joinedAt");
CREATE INDEX IF NOT EXISTS "idx_waitlist_patient_status" ON "Waitlist"("patientId", "status");
CREATE INDEX IF NOT EXISTS "idx_donation_campaign_status_amount" ON "DonationCampaign"("status", "availableAmount");
CREATE INDEX IF NOT EXISTS "idx_donation_campaign_status_created" ON "DonationCampaign"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_screening_result_file_deleted" ON "ScreeningResultFile"("isDeleted", "resultId");
CREATE INDEX IF NOT EXISTS "idx_receipt_number" ON "Receipt"("receiptNumber");
CREATE INDEX IF NOT EXISTS "idx_receipt_transaction" ON "Receipt"("transactionId");
CREATE INDEX IF NOT EXISTS "idx_matching_logs_execution_time" ON "matching_execution_logs"("executionId", "timestamp");
CREATE INDEX IF NOT EXISTS "idx_blog_posts_published" ON "blog_posts"("published", "publishedAt");
CREATE INDEX IF NOT EXISTS "idx_blog_posts_slug" ON "blog_posts"("slug");