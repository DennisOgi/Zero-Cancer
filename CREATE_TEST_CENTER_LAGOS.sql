-- Create a test center in Lagos for testing non-funded screening results
-- This center will be used to test the "Book Screening" functionality

-- Generate a UUID for the center (you'll need to replace this with actual UUID)
-- For PostgreSQL/Supabase, we can use gen_random_uuid()

-- Insert the test center
INSERT INTO "ServiceCenter" (
    id,
    email,
    "passwordHash",
    "centerName",
    address,
    state,
    lga,
    phone,
    status,
    "createdAt"
) VALUES (
    gen_random_uuid(),
    'test.lagos.center@zerocancer.org',
    '$2a$10$YourHashedPasswordHere', -- You'll need to hash a password
    'Lagos Test Screening Center',
    '123 Ikeja Road, Ikeja',
    'Lagos',
    'Ikeja',
    '+234 801 234 5678',
    'ACTIVE',
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Get the center ID for reference
SELECT id, "centerName", email, state, lga, status 
FROM "ServiceCenter" 
WHERE email = 'test.lagos.center@zerocancer.org';

-- Add screening types to this center (assuming screening types already exist)
-- You'll need to replace the UUIDs with actual IDs from your database

-- Example: Add Cervical Cancer Screening service
INSERT INTO "ServiceCenterScreeningType" (
    id,
    "centerId",
    "screeningTypeId",
    amount
)
SELECT 
    gen_random_uuid(),
    sc.id,
    st.id,
    15000.00 -- Retail price
FROM "ServiceCenter" sc
CROSS JOIN "ScreeningType" st
WHERE sc.email = 'test.lagos.center@zerocancer.org'
  AND st.name LIKE '%Cervical%'
  AND NOT EXISTS (
    SELECT 1 FROM "ServiceCenterScreeningType" scst
    WHERE scst."centerId" = sc.id AND scst."screeningTypeId" = st.id
  );

-- Add more screening types if needed
INSERT INTO "ServiceCenterScreeningType" (
    id,
    "centerId",
    "screeningTypeId",
    amount
)
SELECT 
    gen_random_uuid(),
    sc.id,
    st.id,
    12000.00 -- Retail price
FROM "ServiceCenter" sc
CROSS JOIN "ScreeningType" st
WHERE sc.email = 'test.lagos.center@zerocancer.org'
  AND st.name LIKE '%Breast%'
  AND NOT EXISTS (
    SELECT 1 FROM "ServiceCenterScreeningType" scst
    WHERE scst."centerId" = sc.id AND scst."screeningTypeId" = st.id
  );

-- Verify the center and its services
SELECT 
    sc.id,
    sc."centerName",
    sc.email,
    sc.state,
    sc.lga,
    sc.status,
    st.name as "screeningType",
    scst.amount as "retailPrice"
FROM "ServiceCenter" sc
LEFT JOIN "ServiceCenterScreeningType" scst ON sc.id = scst."centerId"
LEFT JOIN "ScreeningType" st ON scst."screeningTypeId" = st.id
WHERE sc.email = 'test.lagos.center@zerocancer.org';
