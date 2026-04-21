-- ZeroCancer Production Database Cleanup Script
-- WARNING: This script will DELETE ALL TEST DATA
-- Only run this on a production database after backing up any real data

-- ============================================
-- STEP 1: DELETE TEST ACCOUNTS
-- ============================================

-- Delete test patients
DELETE FROM "User" WHERE email IN (
  'testpatient1@example.com',
  'testpatient2@example.com', 
  'testpatient3@example.com',
  'patient@zerocancer.com'
);

-- Delete test donors  
DELETE FROM "User" WHERE email IN (
  'testdonor1@example.com',
  'testdonor2@example.com',
  'testdonor3@example.com', 
  'donor@zerocancer.com'
);

-- Delete general public donor (test account)
DELETE FROM "User" WHERE id = 'general-public';

-- Delete test admins
DELETE FROM "Admins" WHERE email IN (
  'admin@zerocancer.com',
  'ttaiwo4910@gmail.com',
  'raphaelgbaorun@gmail.com'
);

-- ============================================
-- STEP 2: DELETE TEST CENTERS AND STAFF
-- ============================================

-- Delete test center staff
DELETE FROM "CenterStaff" WHERE email LIKE '%@zerocancer.org' OR email LIKE '%@zerocancer.africa';

-- Delete test center staff invites
DELETE FROM "CenterStaffInvite" WHERE email LIKE '%@zerocancer.org' OR email LIKE '%@zerocancer.africa';

-- Delete test service centers
DELETE FROM "ServiceCenter" WHERE email IN (
  'center1@zerocancer.org',
  'center2@zerocancer.org',
  'center3@zerocancer.org',
  'center4@zerocancer.org', 
  'center5@zerocancer.org',
  'center6@zerocancer.org',
  'center7@zerocancer.org',
  'center@zerocancer.com'
);

-- ============================================
-- STEP 3: DELETE TEST CAMPAIGNS AND ALLOCATIONS
-- ============================================

-- Delete general donation campaign (test)
DELETE FROM "DonationCampaign" WHERE id = 'general-donor-pool';

-- Delete all donation campaigns (they're all test data)
DELETE FROM "DonationCampaign";

-- Delete all donation allocations (they reference test data)
DELETE FROM "DonationAllocation";

-- ============================================
-- STEP 4: DELETE TEST APPOINTMENTS AND RESULTS
-- ============================================

-- Delete all appointments (they reference test accounts)
DELETE FROM "Appointment";

-- Delete all screening results (they reference test appointments)
DELETE FROM "ScreeningResult";

-- Delete all screening result files
DELETE FROM "ScreeningResultFile";

-- ============================================
-- STEP 5: DELETE TEST WAITLISTS
-- ============================================

-- Delete all waitlist entries (they reference test accounts)
DELETE FROM "Waitlist";

-- ============================================
-- STEP 6: DELETE TEST TRANSACTIONS
-- ============================================

-- Delete all transactions (they reference test data)
DELETE FROM "Transaction";

-- Delete all receipts
DELETE FROM "Receipt";

-- ============================================
-- STEP 7: DELETE TEST NOTIFICATIONS
-- ============================================

-- Delete all notifications and recipients (they reference test accounts)
DELETE FROM "NotificationRecipient";
DELETE FROM "Notification";

-- ============================================
-- STEP 8: DELETE TEST PAYOUTS
-- ============================================

-- Delete all payouts (they reference test centers)
DELETE FROM "Payout";
DELETE FROM "PayoutItem";
DELETE FROM "PaystackRecipient";

-- ============================================
-- STEP 9: DELETE TEST MATCHING EXECUTIONS
-- ============================================

-- Delete all matching execution data (test data)
DELETE FROM "MatchingExecution";
DELETE FROM "MatchingScreeningTypeResult";
DELETE FROM "MatchingExecutionLog";

-- ============================================
-- STEP 10: RESET SEQUENCES (PostgreSQL)
-- ============================================

-- Reset any auto-incrementing sequences if needed
-- (Most IDs are UUIDs, so this may not be necessary)

-- ============================================
-- STEP 11: VERIFY CLEANUP
-- ============================================

-- Check remaining data counts
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Admins', COUNT(*) FROM "Admins"  
UNION ALL
SELECT 'ServiceCenter', COUNT(*) FROM "ServiceCenter"
UNION ALL
SELECT 'CenterStaff', COUNT(*) FROM "CenterStaff"
UNION ALL
SELECT 'DonationCampaign', COUNT(*) FROM "DonationCampaign"
UNION ALL
SELECT 'Appointment', COUNT(*) FROM "Appointment"
UNION ALL
SELECT 'Waitlist', COUNT(*) FROM "Waitlist"
UNION ALL
SELECT 'Transaction', COUNT(*) FROM "Transaction";

-- ============================================
-- NOTES FOR PRODUCTION SETUP
-- ============================================

/*
After running this cleanup script, you should:

1. Create a secure admin account:
   INSERT INTO "Admins" (id, "fullName", email, "passwordHash", "createdAt") 
   VALUES (
     gen_random_uuid(),
     'Production Admin',
     'admin@yourdomain.com',
     '$2a$10$[SECURE_BCRYPT_HASH]',
     NOW()
   );

2. Keep the screening types and categories (they're not test data):
   - The ScreeningType and ScreeningTypeCategory tables contain real medical data
   - These should be preserved and used in production

3. Verify environment variables are set correctly:
   - DATABASE_URL (production database)
   - JWT_TOKEN_SECRET (strong random secret)
   - SMTP credentials (production email service)
   - PAYSTACK keys (live keys, not test)
   - CLOUDINARY credentials (production account)

4. Test the application thoroughly after cleanup:
   - Admin login should work
   - Center registration should work
   - Patient/donor registration should work
   - All core functionality should be accessible

5. Set up monitoring and backups:
   - Database backups
   - Error tracking
   - Performance monitoring
   - Security monitoring
*/