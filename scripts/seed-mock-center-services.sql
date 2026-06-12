-- Seed screening services for mock demo centers that have none.
-- Safe to re-run: skips existing centerId + screeningTypeId pairs.

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
  'center7@zerocancer.org'
)
AND (
  (sc.email = 'center1@zerocancer.org' AND st.name IN ('Cervical Cancer Screening','Breast Cancer Screening','Prostate Cancer Screening','Diabetes Screening','Hepatitis B Screening')) OR
  (sc.email = 'center2@zerocancer.org' AND st.name IN ('Cervical Cancer Screening','Breast Cancer Screening','Colorectal Cancer Screening','Diabetes Screening','HPV Vaccination')) OR
  (sc.email = 'center3@zerocancer.org' AND st.name IN ('Cervical Cancer Screening','Breast Cancer Screening','Prostate Cancer Screening','Lung Cancer Screening','HIV Screening')) OR
  (sc.email = 'center4@zerocancer.org' AND st.name IN ('Cervical Cancer Screening','Breast Cancer Screening','Hepatitis B Screening','HIV Screening','Diabetes Screening')) OR
  (sc.email = 'center5@zerocancer.org' AND st.name IN ('Cervical Cancer Screening','Breast Cancer Screening','Prostate Cancer Screening','Diabetes Screening','HIV Screening')) OR
  (sc.email = 'center6@zerocancer.org' AND st.name IN ('Cervical Cancer Screening','Breast Cancer Screening','Colorectal Cancer Screening','Prostate Cancer Screening','Diabetes Screening')) OR
  (sc.email = 'center7@zerocancer.org' AND st.name IN ('Cervical Cancer Screening','Breast Cancer Screening','Lung Cancer Screening','Hepatitis B Screening','HIV Screening'))
)
AND NOT EXISTS (
  SELECT 1 FROM "ServiceCenterScreeningType" existing
  WHERE existing."centerId" = sc.id AND existing."screeningTypeId" = st.id
);

-- Verify
SELECT sc."centerName", sc.email, COUNT(scst.id) AS services
FROM "ServiceCenter" sc
LEFT JOIN "ServiceCenterScreeningType" scst ON sc.id = scst."centerId"
WHERE sc.email LIKE 'center%@zerocancer.org'
GROUP BY sc.id, sc."centerName", sc.email
ORDER BY sc."centerName";
