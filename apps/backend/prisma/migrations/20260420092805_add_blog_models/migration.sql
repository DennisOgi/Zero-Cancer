-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gender" TEXT,
    "dateOfBirth" DATETIME NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "emailVerified" DATETIME,
    "associationId" TEXT,
    "groupId" TEXT,
    CONSTRAINT "PatientProfile_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PatientProfile_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DonorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationName" TEXT,
    "country" TEXT,
    "emailVerified" DATETIME,
    CONSTRAINT "DonorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdminResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminResetToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admins" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceCenter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" TEXT,
    "centerName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "bankCode" TEXT,
    "accountName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE'
);

-- CreateTable
CREATE TABLE "ServiceCenterScreeningType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "screeningTypeId" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 10000.0,
    CONSTRAINT "ServiceCenterScreeningType_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceCenterScreeningType_screeningTypeId_fkey" FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScreeningType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "screeningTypeCategoryId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "agreedPrice" REAL NOT NULL DEFAULT 10000.0,
    CONSTRAINT "ScreeningType_screeningTypeCategoryId_fkey" FOREIGN KEY ("screeningTypeCategoryId") REFERENCES "ScreeningTypeCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScreeningTypeCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "screeningTypeId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" DATETIME,
    "expiredAt" DATETIME,
    CONSTRAINT "Waitlist_screeningTypeId_fkey" FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Waitlist_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DonationCampaign" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "targetAssociationId" TEXT,
    "targetGroupId" TEXT,
    "targetIndividualId" TEXT,
    "targetPhone" TEXT,
    CONSTRAINT "DonationCampaign_targetAssociationId_fkey" FOREIGN KEY ("targetAssociationId") REFERENCES "Association" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DonationCampaign_targetGroupId_fkey" FOREIGN KEY ("targetGroupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DonationCampaign_targetIndividualId_fkey" FOREIGN KEY ("targetIndividualId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DonationCampaign_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DonationAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "waitlistId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "patientId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "claimedAt" DATETIME,
    "matchingExecutionId" TEXT,
    "amountAllocated" REAL,
    "createdViaMatching" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DonationAllocation_waitlistId_fkey" FOREIGN KEY ("waitlistId") REFERENCES "Waitlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DonationAllocation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DonationAllocation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DonationAllocation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DonationCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DonationAllocation_matchingExecutionId_fkey" FOREIGN KEY ("matchingExecutionId") REFERENCES "matching_executions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "screeningTypeId" TEXT NOT NULL,
    "donationId" TEXT,
    "isDonation" BOOLEAN NOT NULL DEFAULT false,
    "appointmentDateTime" DATETIME NOT NULL,
    "transactionId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancellationReason" TEXT,
    "cancellationDate" DATETIME,
    "checkInCode" TEXT,
    "checkInCodeExpiresAt" DATETIME,
    "kitId" TEXT,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_screeningTypeId_fkey" FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppointmentVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME NOT NULL,
    CONSTRAINT "AppointmentVerification_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AppointmentVerification_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "CenterStaff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScreeningResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "notes" TEXT,
    "uploadedBy" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScreeningResult_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScreeningResult_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "CenterStaff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScreeningResultFile" (
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
    CONSTRAINT "ScreeningResultFile_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "ScreeningResult" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScreeningResultFile_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "CenterStaff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "stock" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "receiptData" TEXT NOT NULL,
    "pdfPath" TEXT,
    "emailSentAt" DATETIME,
    "emailRecipient" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Receipt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "relatedDonationId" TEXT,
    "paymentReference" TEXT,
    "paymentChannel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_relatedDonationId_fkey" FOREIGN KEY ("relatedDonationId") REFERENCES "DonationCampaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "paystack_recipients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "recipientCode" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "paystack_recipients_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchReference" TEXT NOT NULL,
    "payoutNumber" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "recipientId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "paystackFee" REAL NOT NULL DEFAULT 10.00,
    "netAmount" REAL NOT NULL,
    "transferReference" TEXT,
    "paystackTransferId" TEXT,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payouts_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payouts_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "paystack_recipients" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payout_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payoutId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "serviceDate" DATETIME NOT NULL,
    "appointmentId" TEXT,
    CONSTRAINT "payout_items_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "payouts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payout_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "profileType" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CenterStaff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CenterStaff_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CenterStaffInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "acceptedAt" DATETIME,
    CONSTRAINT "CenterStaffInvite_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CenterStaffResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "CenterStaffResetToken_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "CenterStaff" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "matching_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionReference" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "matching_execution_logs" (
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
    CONSTRAINT "matching_execution_logs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "matching_executions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "matching_screening_type_results" (
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
    CONSTRAINT "matching_screening_type_results_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "matching_executions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "matching_screening_type_results_screeningTypeId_fkey" FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Association" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Kit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serialNumber" TEXT NOT NULL,
    "batchNumber" TEXT,
    "screeningTypeId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME,
    CONSTRAINT "Kit_screeningTypeId_fkey" FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Kit_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "ServiceCenter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "authorId" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "blog_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Admins" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "blog_post_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "blog_post_categories_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blog_post_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ScreeningTypeToServiceCenter" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ScreeningTypeToServiceCenter_A_fkey" FOREIGN KEY ("A") REFERENCES "ScreeningType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ScreeningTypeToServiceCenter_B_fkey" FOREIGN KEY ("B") REFERENCES "ServiceCenter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DonationCampaignScreeningTypes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DonationCampaignScreeningTypes_A_fkey" FOREIGN KEY ("A") REFERENCES "DonationCampaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DonationCampaignScreeningTypes_B_fkey" FOREIGN KEY ("B") REFERENCES "ScreeningType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DonorProfile_userId_key" ON "DonorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Admins_email_key" ON "Admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminResetToken_token_key" ON "AdminResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCenter_email_key" ON "ServiceCenter"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCenterScreeningType_centerId_screeningTypeId_key" ON "ServiceCenterScreeningType"("centerId", "screeningTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ScreeningType_name_key" ON "ScreeningType"("name");

-- CreateIndex
CREATE INDEX "Waitlist_status_screeningTypeId_joinedAt_idx" ON "Waitlist"("status", "screeningTypeId", "joinedAt");

-- CreateIndex
CREATE INDEX "Waitlist_patientId_status_idx" ON "Waitlist"("patientId", "status");

-- CreateIndex
CREATE INDEX "DonationCampaign_status_availableAmount_idx" ON "DonationCampaign"("status", "availableAmount");

-- CreateIndex
CREATE INDEX "DonationCampaign_status_createdAt_idx" ON "DonationCampaign"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DonationAllocation_waitlistId_key" ON "DonationAllocation"("waitlistId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_checkInCode_key" ON "Appointment"("checkInCode");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_kitId_key" ON "Appointment"("kitId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentVerification_appointmentId_key" ON "AppointmentVerification"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ScreeningResult_appointmentId_key" ON "ScreeningResult"("appointmentId");

-- CreateIndex
CREATE INDEX "ScreeningResultFile_isDeleted_resultId_idx" ON "ScreeningResultFile"("isDeleted", "resultId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_transactionId_key" ON "Receipt"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "Receipt_receiptNumber_idx" ON "Receipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "Receipt_transactionId_idx" ON "Receipt"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "paystack_recipients_centerId_key" ON "paystack_recipients"("centerId");

-- CreateIndex
CREATE UNIQUE INDEX "paystack_recipients_recipientCode_key" ON "paystack_recipients"("recipientCode");

-- CreateIndex
CREATE UNIQUE INDEX "paystack_recipients_reference_key" ON "paystack_recipients"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_payoutNumber_key" ON "payouts"("payoutNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_transferReference_key" ON "payouts"("transferReference");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_paystackTransferId_key" ON "payouts"("paystackTransferId");

-- CreateIndex
CREATE UNIQUE INDEX "payout_items_transactionId_key" ON "payout_items"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CenterStaff_centerId_email_key" ON "CenterStaff"("centerId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "CenterStaffInvite_token_key" ON "CenterStaffInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CenterStaffResetToken_token_key" ON "CenterStaffResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "matching_executions_executionReference_key" ON "matching_executions"("executionReference");

-- CreateIndex
CREATE INDEX "matching_execution_logs_executionId_timestamp_idx" ON "matching_execution_logs"("executionId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "matching_screening_type_results_executionId_screeningTypeId_key" ON "matching_screening_type_results"("executionId", "screeningTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Association_name_key" ON "Association"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Kit_serialNumber_key" ON "Kit"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_published_publishedAt_idx" ON "blog_posts"("published", "publishedAt");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_name_key" ON "blog_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_categories_postId_categoryId_key" ON "blog_post_categories"("postId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "_ScreeningTypeToServiceCenter_AB_unique" ON "_ScreeningTypeToServiceCenter"("A", "B");

-- CreateIndex
CREATE INDEX "_ScreeningTypeToServiceCenter_B_index" ON "_ScreeningTypeToServiceCenter"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DonationCampaignScreeningTypes_AB_unique" ON "_DonationCampaignScreeningTypes"("A", "B");

-- CreateIndex
CREATE INDEX "_DonationCampaignScreeningTypes_B_index" ON "_DonationCampaignScreeningTypes"("B");
