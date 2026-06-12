-- Seed mock demo centers with Vaccination, Screening, and Treatment services.
-- Each center gets at least one service in each category so filters work.
-- Safe to re-run: skips existing centerId + screeningTypeId pairs.

-- Step 1: Ensure platform catalog has treatment + extra vaccination types
INSERT INTO "ScreeningTypeCategory" (id, name, description)
VALUES ('44444444-4444-4444-4444-444444444444', 'Treatment', 'Cancer treatment and therapy services')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "ScreeningType" (id, name, description, "screeningTypeCategoryId", active, "agreedPrice")
VALUES
  ('55555555-5555-5555-5555-555555555551', 'Hepatitis B Vaccination', 'Hepatitis B immunization for adults and at-risk groups', '22222222-2222-2222-2222-222222222222', true, 12000),
  ('55555555-5555-5555-5555-555555555552', 'Cancer Treatment Consultation', 'Initial oncology consultation and treatment planning', '44444444-4444-4444-4444-444444444444', true, 25000),
  ('55555555-5555-5555-5555-555555555553', 'Chemotherapy Treatment', 'Chemotherapy administration and monitoring', '44444444-4444-4444-4444-444444444444', true, 80000),
  ('55555555-5555-5555-5555-555555555554', 'Radiotherapy Treatment', 'Radiation therapy sessions and follow-up care', '44444444-4444-4444-4444-444444444444', true, 120000)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Link each mock center to Vaccination + Screening + Treatment bundles
INSERT INTO "ServiceCenterScreeningType" (id, "centerId", "screeningTypeId", amount)
SELECT gen_random_uuid(), sc.id, st.id,
  CASE WHEN st."agreedPrice" > 0 THEN st."agreedPrice" ELSE 10000 END
FROM "ServiceCenter" sc
CROSS JOIN "ScreeningType" st
WHERE sc.email IN (
  'center1@zerocancer.org',
  'center2@zerocancer.org',
  'center3@zerocancer.org',
  'center4@zerocancer.org',
  'center5@zerocancer.org',
  'center6@zerocancer.org',
  'center7@zerocancer.org',
  'lagos.test.center@zerocancer.org'
)
AND (
  -- Vaccination (at least one per center)
  st.name IN ('HPV Vaccination', 'Hepatitis B Vaccination') OR
  -- Screening (core cancer + diagnostic)
  st.name IN (
    'Cervical Cancer Screening',
    'Breast Cancer Screening',
    'Prostate Cancer Screening',
    'HIV Screening',
    'Diabetes Screening'
  ) OR
  -- Treatment
  st.name IN (
    'Cancer Treatment Consultation',
    'Chemotherapy Treatment',
    'Radiotherapy Treatment'
  )
)
AND NOT EXISTS (
  SELECT 1 FROM "ServiceCenterScreeningType" existing
  WHERE existing."centerId" = sc.id AND existing."screeningTypeId" = st.id
);

-- Verify category coverage per center
SELECT
  sc."centerName",
  BOOL_OR(st.name ILIKE '%vaccin%') AS has_vaccination,
  BOOL_OR(st.name ILIKE '%screening%' OR st.name ILIKE '%screening%') AS has_screening,
  BOOL_OR(st.name ILIKE '%treatment%' OR st.name ILIKE '%therapy%') AS has_treatment,
  COUNT(scst.id) AS total_services
FROM "ServiceCenter" sc
LEFT JOIN "ServiceCenterScreeningType" scst ON sc.id = scst."centerId"
LEFT JOIN "ScreeningType" st ON scst."screeningTypeId" = st.id
WHERE sc.email LIKE 'center%@zerocancer.org' OR sc.email = 'lagos.test.center@zerocancer.org'
GROUP BY sc.id, sc."centerName"
ORDER BY sc."centerName";
