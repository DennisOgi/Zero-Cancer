-- ZeroCancer D1 Database Seed Script
-- This creates the essential test data for the demo

-- Insert screening type categories
INSERT OR IGNORE INTO ScreeningTypeCategory (id, name, description) VALUES
('cancer', 'Cancer', 'Cancer-related screenings'),
('vaccine', 'Vaccine', 'Preventive vaccinations'),
('general', 'General', 'General health screenings');

-- Insert screening types
INSERT OR IGNORE INTO ScreeningType (id, name, description, screeningTypeCategoryId, active, agreedPrice) VALUES
('cervical-cancer', 'Cervical Cancer Screening', 'Pap smear test', 'cancer', 1, 15000.0),
('breast-cancer', 'Breast Cancer Screening', 'Mammography test', 'cancer', 1, 20000.0),
('prostate-cancer', 'Prostate Cancer Screening', 'PSA blood test', 'cancer', 1, 12000.0),
('blood-pressure', 'Blood Pressure Check', 'Basic BP screening', 'general', 1, 5000.0),
('diabetes', 'Diabetes Screening', 'Blood sugar test', 'general', 1, 8000.0);

-- Insert test admin
INSERT OR IGNORE INTO Admins (id, fullName, email, passwordHash, createdAt) VALUES
('admin-1', 'Demo Admin', 'ttaiwo4910@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now'));

-- Insert test users (patients and donors)
INSERT OR IGNORE INTO User (id, fullName, email, phone, passwordHash, createdAt) VALUES
('patient-1', 'Test Patient 1', 'testpatient1@example.com', '08012345678', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now')),
('donor-1', 'Test Donor 1', 'testdonor1@example.com', '08012345679', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', datetime('now'));

-- Insert patient profile
INSERT OR IGNORE INTO PatientProfile (id, userId, gender, dateOfBirth, city, state, emailVerified) VALUES
('patient-profile-1', 'patient-1', 'MALE', '1990-01-01', 'Lagos', 'Lagos', datetime('now'));

-- Insert donor profile
INSERT OR IGNORE INTO DonorProfile (id, userId, organizationName, country, emailVerified) VALUES
('donor-profile-1', 'donor-1', 'Test Organization', 'Nigeria', datetime('now'));

-- Insert test service center
INSERT OR IGNORE INTO ServiceCenter (id, email, passwordHash, centerName, address, state, lga, status, createdAt) VALUES
('center-1', 'center1@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo Health Center', '123 Demo Street', 'Lagos', 'Ikeja', 'ACTIVE', datetime('now'));

-- Insert center staff
INSERT OR IGNORE INTO CenterStaff (id, centerId, email, passwordHash, role, status, createdAt) VALUES
('staff-1', 'center-1', 'center1@zerocancer.org', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ACTIVE', datetime('now'));

-- Insert donation campaign
INSERT OR IGNORE INTO DonationCampaign (id, donorId, totalAmount, availableAmount, title, purpose, status, createdAt, updatedAt) VALUES
('campaign-1', 'donor-1', 500000.0, 500000.0, 'Demo Cancer Screening Fund', 'Providing free cancer screenings', 'ACTIVE', datetime('now'), datetime('now'));

-- Insert waitlist entry
INSERT OR IGNORE INTO Waitlist (id, screeningTypeId, patientId, status, joinedAt) VALUES
('waitlist-1', 'cervical-cancer', 'patient-1', 'PENDING', datetime('now'));

-- Note: Password for all test accounts is 'password123'
-- Hashed with bcrypt: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi