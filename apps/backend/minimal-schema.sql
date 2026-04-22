-- Minimal schema for ZeroCancer demo
-- Essential tables only

-- Users table
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
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
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

-- Service Centers
CREATE TABLE IF NOT EXISTS "ServiceCenter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "centerName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
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
    FOREIGN KEY ("screeningTypeCategoryId") REFERENCES "ScreeningTypeCategory" ("id")
);

-- Donation Campaigns
CREATE TABLE IF NOT EXISTS "DonationCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "availableAmount" REAL NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("donorId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Waitlists
CREATE TABLE IF NOT EXISTS "Waitlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "screeningTypeId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("screeningTypeId") REFERENCES "ScreeningType" ("id"),
    FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE CASCADE
);