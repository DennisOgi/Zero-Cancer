-- ZeroCancer Production Database Seed Script
-- Comprehensive test data for all user types and scenarios

-- ============================================
-- SCREENING TYPE CATEGORIES & TYPES
-- ============================================

INSERT OR IGNORE INTO "ScreeningTypeCategory" (id, name, description) VALUES
('cancer-screening', 'Cancer Screening', 'Cancer detection and prevention screenings'),
('preventive-care', 'Preventive Care', 'General preventive health screenings'),
('diagnostic-tests', 'Diagnostic Tests', 'Diagnostic and laboratory tests');

INSERT OR IGNORE INTO "ScreeningType" (id, name, description, screeningTypeCategoryId, active, agreedPrice) VALUES
('cervical-cancer', 'Cervical Cancer Screening', 'Pap smear and HPV testing for cervical cancer detection', 'cancer-screening', 1, 15000.0),
('breast-cancer', 'Breast Cancer Screening', 'Mammography and clinical breast examination', 'cancer-screening', 1, 25000.0),
('prostate-cancer', 'Prostate Cancer Screening', 'PSA blood test and digital rectal examination', 'cancer-screening', 1, 18000.0),
('colorectal-cancer', 'Colorectal Cancer Screening', 'Colonoscopy and fecal occult blood test', 'cancer-screening', 1, 35000.0),
('lung-cancer', 'Lung Cancer Screening', 'Low-dose CT scan for high-risk individuals', 'cancer-screening', 1, 45000.0),
('blood-pressure', 'Blood Pressure Check', 'Hypertension screening and monitoring', 'preventive-care', 1, 5000.0),
('diabetes-screening', 'Diabetes Screening', 'Blood glucose and HbA1c testing', 'preventive-care', 1, 8000.0),
('cholesterol-test', 'Cholesterol Test', 'Lipid profile and cardiovascular risk assessment', 'preventive-care', 1, 12000.0),
('hepatitis-b', 'Hepatitis B Screening', 'HBsAg and anti-HBs testing', 'diagnostic-tests', 1, 10000.0),
('hiv-screening', 'HIV Screening', 'HIV antibody and antigen testing', 'diagnostic-tests', 1, 8000.0);

-- ============================================
-- ADMIN ACCOUNTS
-- ============================================

INSERT OR IGNORE INTO "Admins" (id, fullName, email, passwordHash, createdAt) VALUES
('admin-main', 'ZeroCancer Admin', 'ttaiwo4910@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now')),
('admin-demo', 'Demo Administrator', 'admin@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now'));

-- ============================================
-- SERVICE CENTERS (7 centers across Nigeria)
-- ============================================

INSERT OR IGNORE INTO "ServiceCenter" (id, email, passwordHash, centerName, address, state, lga, phone, status, createdAt) VALUES
('center-lagos-1', 'center1@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lagos General Health Center', '15 Marina Street, Lagos Island', 'Lagos', 'Lagos Island', '08012345001', 'ACTIVE', datetime('now')),
('center-lagos-2', 'center2@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ikeja Medical Center', '45 Allen Avenue, Ikeja', 'Lagos', 'Ikeja', '08012345002', 'ACTIVE', datetime('now')),
('center-abuja', 'center3@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Abuja Central Hospital', '12 Independence Avenue, Central Area', 'FCT', 'Municipal', '08012345003', 'ACTIVE', datetime('now')),
('center-kano', 'center4@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kano State Health Center', '8 Bompai Road, Nassarawa', 'Kano', 'Nassarawa', '08012345004', 'ACTIVE', datetime('now')),
('center-portharcourt', 'center5@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Port Harcourt Medical Hub', '22 Aba Road, Port Harcourt', 'Rivers', 'Port Harcourt', '08012345005', 'ACTIVE', datetime('now')),
('center-ibadan', 'center6@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ibadan University Teaching Hospital', '1 Queen Elizabeth Road, Ibadan', 'Oyo', 'Ibadan North', '08012345006', 'ACTIVE', datetime('now')),
('center-enugu', 'center7@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Enugu State Specialist Hospital', '5 Park Avenue, GRA Enugu', 'Enugu', 'Enugu North', '08012345007', 'ACTIVE', datetime('now'));

-- ============================================
-- CENTER STAFF (Admin staff for each center)
-- ============================================

INSERT OR IGNORE INTO "CenterStaff" (id, centerId, email, passwordHash, role, status, createdAt) VALUES
('staff-lagos-1', 'center-lagos-1', 'center1@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ACTIVE', datetime('now')),
('staff-lagos-2', 'center-lagos-2', 'center2@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ACTIVE', datetime('now')),
('staff-abuja', 'center-abuja', 'center3@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ACTIVE', datetime('now')),
('staff-kano', 'center-kano', 'center4@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ACTIVE', datetime('now')),
('staff-portharcourt', 'center-portharcourt', 'center5@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ACTIVE', datetime('now')),
('staff-ibadan', 'center-ibadan', 'center6@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ACTIVE', datetime('now')),
('staff-enugu', 'center-enugu', 'center7@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ACTIVE', datetime('now'));

-- ============================================
-- SERVICE CENTER SCREENING TYPES (Pricing)
-- ============================================

-- Lagos General Health Center
INSERT OR IGNORE INTO "ServiceCenterScreeningType" (id, centerId, screeningTypeId, amount) VALUES
('pricing-lagos1-cervical', 'center-lagos-1', 'cervical-cancer', 15000.0),
('pricing-lagos1-breast', 'center-lagos-1', 'breast-cancer', 25000.0),
('pricing-lagos1-prostate', 'center-lagos-1', 'prostate-cancer', 18000.0),
('pricing-lagos1-bp', 'center-lagos-1', 'blood-pressure', 5000.0),
('pricing-lagos1-diabetes', 'center-lagos-1', 'diabetes-screening', 8000.0);

-- Ikeja Medical Center
INSERT OR IGNORE INTO "ServiceCenterScreeningType" (id, centerId, screeningTypeId, amount) VALUES
('pricing-lagos2-cervical', 'center-lagos-2', 'cervical-cancer', 14000.0),
('pricing-lagos2-breast', 'center-lagos-2', 'breast-cancer', 24000.0),
('pricing-lagos2-colorectal', 'center-lagos-2', 'colorectal-cancer', 35000.0),
('pricing-lagos2-cholesterol', 'center-lagos-2', 'cholesterol-test', 12000.0);

-- Abuja Central Hospital
INSERT OR IGNORE INTO "ServiceCenterScreeningType" (id, centerId, screeningTypeId, amount) VALUES
('pricing-abuja-cervical', 'center-abuja', 'cervical-cancer', 16000.0),
('pricing-abuja-breast', 'center-abuja', 'breast-cancer', 26000.0),
('pricing-abuja-prostate', 'center-abuja', 'prostate-cancer', 19000.0),
('pricing-abuja-lung', 'center-abuja', 'lung-cancer', 45000.0),
('pricing-abuja-hiv', 'center-abuja', 'hiv-screening', 8000.0);

-- ============================================
-- TEST USERS (Patients and Donors)
-- ============================================

-- Patient Users
INSERT OR IGNORE INTO "User" (id, fullName, email, phone, passwordHash, createdAt) VALUES
('patient-1', 'Adunni Okafor', 'patient1@example.com', '08012345678', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now')),
('patient-2', 'Chinedu Emeka', 'patient2@example.com', '08012345679', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now')),
('patient-3', 'Fatima Abdullahi', 'patient3@example.com', '08012345680', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now')),
('patient-4', 'Kemi Adebayo', 'patient4@example.com', '08012345681', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now')),
('patient-5', 'Tunde Olawale', 'patient5@example.com', '08012345682', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now'));

-- Donor Users
INSERT OR IGNORE INTO "User" (id, fullName, email, phone, passwordHash, createdAt) VALUES
('donor-1', 'Aliko Dangote Foundation', 'donor1@example.com', '08012345690', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now')),
('donor-2', 'Tony Elumelu Foundation', 'donor2@example.com', '08012345691', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now')),
('donor-3', 'Folorunsho Alakija Charity', 'donor3@example.com', '08012345692', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now')),
('donor-4', 'MTN Foundation', 'donor4@example.com', '08012345693', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now'));

-- ============================================
-- PATIENT PROFILES
-- ============================================

INSERT OR IGNORE INTO "PatientProfile" (id, userId, gender, dateOfBirth, city, state, emailVerified) VALUES
('profile-patient-1', 'patient-1', 'FEMALE', '1985-03-15', 'Lagos', 'Lagos', datetime('now')),
('profile-patient-2', 'patient-2', 'MALE', '1978-07-22', 'Abuja', 'FCT', datetime('now')),
('profile-patient-3', 'patient-3', 'FEMALE', '1992-11-08', 'Kano', 'Kano', datetime('now')),
('profile-patient-4', 'patient-4', 'FEMALE', '1988-05-30', 'Ibadan', 'Oyo', datetime('now')),
('profile-patient-5', 'patient-5', 'MALE', '1975-12-12', 'Port Harcourt', 'Rivers', datetime('now'));

-- ============================================
-- DONOR PROFILES
-- ============================================

INSERT OR IGNORE INTO "DonorProfile" (id, userId, organizationName, country, emailVerified) VALUES
('profile-donor-1', 'donor-1', 'Dangote Foundation', 'Nigeria', datetime('now')),
('profile-donor-2', 'donor-2', 'Tony Elumelu Foundation', 'Nigeria', datetime('now')),
('profile-donor-3', 'donor-3', 'Alakija Foundation', 'Nigeria', datetime('now')),
('profile-donor-4', 'donor-4', 'MTN Foundation', 'Nigeria', datetime('now'));

-- ============================================
-- DONATION CAMPAIGNS
-- ============================================

INSERT OR IGNORE INTO "DonationCampaign" (id, donorId, totalAmount, availableAmount, title, purpose, status, createdAt, updatedAt) VALUES
('campaign-1', 'donor-1', 2000000.0, 1500000.0, 'Dangote Cancer Prevention Initiative', 'Providing free cancer screenings for underserved communities', 'ACTIVE', datetime('now'), datetime('now')),
('campaign-2', 'donor-2', 1500000.0, 1200000.0, 'TEF Health Access Program', 'Supporting preventive healthcare for women and children', 'ACTIVE', datetime('now'), datetime('now')),
('campaign-3', 'donor-3', 1000000.0, 800000.0, 'Alakija Wellness Fund', 'Comprehensive health screening for rural communities', 'ACTIVE', datetime('now'), datetime('now')),
('campaign-4', 'donor-4', 3000000.0, 2500000.0, 'MTN Health Connect', 'Digital health and screening services nationwide', 'ACTIVE', datetime('now'), datetime('now'));

-- ============================================
-- WAITLISTS (Patients waiting for screenings)
-- ============================================

INSERT OR IGNORE INTO "Waitlist" (id, screeningTypeId, patientId, status, joinedAt) VALUES
('waitlist-1', 'cervical-cancer', 'patient-1', 'PENDING', datetime('now', '-5 days')),
('waitlist-2', 'breast-cancer', 'patient-1', 'PENDING', datetime('now', '-3 days')),
('waitlist-3', 'prostate-cancer', 'patient-2', 'PENDING', datetime('now', '-7 days')),
('waitlist-4', 'cervical-cancer', 'patient-3', 'PENDING', datetime('now', '-2 days')),
('waitlist-5', 'diabetes-screening', 'patient-4', 'PENDING', datetime('now', '-1 day')),
('waitlist-6', 'blood-pressure', 'patient-5', 'PENDING', datetime('now', '-4 days')),
('waitlist-7', 'breast-cancer', 'patient-4', 'PENDING', datetime('now', '-6 days'));

-- ============================================
-- DONATION ALLOCATIONS (Matched funding)
-- ============================================

INSERT OR IGNORE INTO "DonationAllocation" (id, waitlistId, patientId, campaignId, amountAllocated, createdViaMatching) VALUES
('allocation-1', 'waitlist-1', 'patient-1', 'campaign-1', 15000.0, true),
('allocation-2', 'waitlist-3', 'patient-2', 'campaign-2', 18000.0, true),
('allocation-3', 'waitlist-6', 'patient-5', 'campaign-3', 5000.0, true);

-- ============================================
-- SAMPLE APPOINTMENTS
-- ============================================

INSERT OR IGNORE INTO "Appointment" (id, patientId, centerId, screeningTypeId, isDonation, appointmentDateTime, status, createdAt) VALUES
('appointment-1', 'patient-1', 'center-lagos-1', 'cervical-cancer', true, datetime('now', '+3 days'), 'SCHEDULED', datetime('now')),
('appointment-2', 'patient-2', 'center-abuja', 'prostate-cancer', true, datetime('now', '+5 days'), 'SCHEDULED', datetime('now')),
('appointment-3', 'patient-5', 'center-portharcourt', 'blood-pressure', true, datetime('now', '+2 days'), 'SCHEDULED', datetime('now'));

-- ============================================
-- ASSOCIATIONS & GROUPS
-- ============================================

INSERT OR IGNORE INTO "Association" (id, name, description, createdAt) VALUES
('assoc-1', 'Nigerian Cancer Society', 'National organization for cancer awareness and support', datetime('now')),
('assoc-2', 'Women Health Initiative', 'Promoting women health and wellness across Nigeria', datetime('now')),
('assoc-3', 'Rural Health Network', 'Healthcare access for rural and underserved communities', datetime('now'));

INSERT OR IGNORE INTO "Group" (id, name, description, createdAt) VALUES
('group-1', 'Lagos Cancer Support Group', 'Support group for cancer patients and survivors in Lagos', datetime('now')),
('group-2', 'Abuja Wellness Circle', 'Community wellness and preventive health group', datetime('now')),
('group-3', 'Northern Nigeria Health Advocates', 'Health advocacy group for northern states', datetime('now'));

-- ============================================
-- BLOG CATEGORIES & POSTS
-- ============================================

INSERT OR IGNORE INTO "blog_categories" (id, name, slug, description, createdAt) VALUES
('cat-prevention', 'Prevention', 'prevention', 'Cancer prevention and early detection', datetime('now')),
('cat-awareness', 'Awareness', 'awareness', 'Health awareness and education', datetime('now')),
('cat-stories', 'Success Stories', 'success-stories', 'Patient success stories and testimonials', datetime('now')),
('cat-research', 'Research', 'research', 'Latest cancer research and medical advances', datetime('now'));

INSERT OR IGNORE INTO "blog_posts" (id, title, slug, excerpt, content, authorId, published, publishedAt, createdAt, updatedAt) VALUES
('post-1', 'Early Detection Saves Lives: The Importance of Regular Cancer Screening', 'early-detection-saves-lives', 'Learn why regular cancer screening is crucial for early detection and successful treatment outcomes.', '# Early Detection Saves Lives

Cancer screening is one of the most powerful tools we have in the fight against cancer. When cancer is detected early, treatment options are more effective and survival rates increase dramatically.

## Why Screen Regularly?

Regular screening can detect cancer before symptoms appear, when treatment is most likely to be successful. For many types of cancer, early detection can mean the difference between life and death.

## Available Screenings

At ZeroCancer, we offer comprehensive screening programs including:
- Cervical cancer screening (Pap smears)
- Breast cancer screening (mammograms)
- Prostate cancer screening (PSA tests)
- Colorectal cancer screening (colonoscopy)

## Getting Started

Join our waitlist today to access free or subsidized cancer screening services. Together, we can make early detection accessible to everyone.', 'admin-main', true, datetime('now', '-10 days'), datetime('now', '-10 days'), datetime('now', '-10 days')),

('post-2', 'Understanding Cervical Cancer: Prevention and Screening Guidelines', 'understanding-cervical-cancer', 'Comprehensive guide to cervical cancer prevention, risk factors, and screening recommendations.', '# Understanding Cervical Cancer

Cervical cancer is one of the most preventable types of cancer when proper screening and prevention measures are in place.

## Risk Factors

- HPV infection
- Multiple sexual partners
- Smoking
- Weakened immune system
- Family history

## Prevention Strategies

1. **HPV Vaccination**: Highly effective in preventing HPV infections
2. **Regular Screening**: Pap smears can detect precancerous changes
3. **Safe Practices**: Limiting sexual partners and using protection
4. **Healthy Lifestyle**: Not smoking and maintaining good health

## Screening Schedule

- Ages 21-29: Pap smear every 3 years
- Ages 30-65: Pap smear + HPV test every 5 years
- Over 65: Consult with healthcare provider

## ZeroCancer Support

Our network of healthcare centers provides accessible cervical cancer screening services. Contact us to schedule your screening today.', 'admin-demo', true, datetime('now', '-7 days'), datetime('now', '-7 days'), datetime('now', '-7 days')),

('post-3', 'Success Story: How Early Detection Changed Everything for Sarah', 'success-story-sarah', 'Read about Sarah journey from diagnosis to recovery, and how early detection made all the difference.', '# Success Story: Sarah Journey

*Sarah Adebayo, 34, Lagos*

When Sarah joined our cervical cancer screening program last year, she never expected it would save her life. Here is her inspiring story.

## The Beginning

"I had no symptoms, no warning signs. I only went for screening because my friend convinced me to join the ZeroCancer program," Sarah recalls.

## The Discovery

During her routine Pap smear, abnormal cells were detected. Further testing revealed early-stage cervical cancer.

## The Treatment

Because the cancer was caught early, Sarah treatment options were extensive and highly effective. She underwent a minimally invasive procedure and made a full recovery.

## The Message

"I want every woman to know that screening saves lives. If I had waited until I had symptoms, my story might have been very different," Sarah emphasizes.

## Today

Sarah is now cancer-free and has become an advocate for regular screening. She volunteers with ZeroCancer to share her story and encourage other women to get screened.

## Your Story Matters

Every screening appointment is an opportunity for early detection. Join thousands of Nigerians who have taken control of their health through ZeroCancer screening programs.', 'admin-main', true, datetime('now', '-3 days'), datetime('now', '-3 days'), datetime('now', '-3 days'));

-- Link blog posts to categories
INSERT OR IGNORE INTO "blog_post_categories" (id, postId, categoryId) VALUES
('link-1', 'post-1', 'cat-prevention'),
('link-2', 'post-1', 'cat-awareness'),
('link-3', 'post-2', 'cat-prevention'),
('link-4', 'post-2', 'cat-awareness'),
('link-5', 'post-3', 'cat-stories'),
('link-6', 'post-3', 'cat-awareness');

-- ============================================
-- SAMPLE TRANSACTIONS
-- ============================================

INSERT OR IGNORE INTO "Transaction" (id, type, status, amount, createdAt) VALUES
('trans-1', 'DONATION', 'COMPLETED', 15000.0, datetime('now', '-5 days')),
('trans-2', 'DONATION', 'COMPLETED', 18000.0, datetime('now', '-3 days')),
('trans-3', 'DONATION', 'COMPLETED', 5000.0, datetime('now', '-1 day'));

-- ============================================
-- SAMPLE KITS
-- ============================================

INSERT OR IGNORE INTO "Kit" (id, serialNumber, batchNumber, screeningTypeId, centerId, status, receivedAt) VALUES
('kit-1', 'ZC-001-2024', 'BATCH-001', 'cervical-cancer', 'center-lagos-1', 'AVAILABLE', datetime('now', '-30 days')),
('kit-2', 'ZC-002-2024', 'BATCH-001', 'breast-cancer', 'center-lagos-1', 'AVAILABLE', datetime('now', '-30 days')),
('kit-3', 'ZC-003-2024', 'BATCH-002', 'prostate-cancer', 'center-abuja', 'AVAILABLE', datetime('now', '-25 days')),
('kit-4', 'ZC-004-2024', 'BATCH-002', 'blood-pressure', 'center-portharcourt', 'AVAILABLE', datetime('now', '-20 days'));

-- ============================================
-- JUNCTION TABLE DATA
-- ============================================

-- Link screening types to service centers
INSERT OR IGNORE INTO "_ScreeningTypeToServiceCenter" (A, B) VALUES
('cervical-cancer', 'center-lagos-1'),
('breast-cancer', 'center-lagos-1'),
('prostate-cancer', 'center-lagos-1'),
('blood-pressure', 'center-lagos-1'),
('diabetes-screening', 'center-lagos-1'),
('cervical-cancer', 'center-lagos-2'),
('breast-cancer', 'center-lagos-2'),
('colorectal-cancer', 'center-lagos-2'),
('cholesterol-test', 'center-lagos-2'),
('cervical-cancer', 'center-abuja'),
('breast-cancer', 'center-abuja'),
('prostate-cancer', 'center-abuja'),
('lung-cancer', 'center-abuja'),
('hiv-screening', 'center-abuja');

-- Link donation campaigns to screening types
INSERT OR IGNORE INTO "_DonationCampaignScreeningTypes" (A, B) VALUES
('campaign-1', 'cervical-cancer'),
('campaign-1', 'breast-cancer'),
('campaign-1', 'prostate-cancer'),
('campaign-2', 'cervical-cancer'),
('campaign-2', 'diabetes-screening'),
('campaign-2', 'blood-pressure'),
('campaign-3', 'blood-pressure'),
('campaign-3', 'diabetes-screening'),
('campaign-3', 'cholesterol-test'),
('campaign-4', 'cervical-cancer'),
('campaign-4', 'breast-cancer'),
('campaign-4', 'prostate-cancer'),
('campaign-4', 'colorectal-cancer');

-- Note: All test accounts use password 'password123'
-- Hashed with bcrypt: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi