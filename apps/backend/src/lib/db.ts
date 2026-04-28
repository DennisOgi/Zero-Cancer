// Mock database service for production testing
// This provides the test accounts directly without requiring a real database connection

type MockUser = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

type MockServiceCenter = {
  id: string;
  email: string;
  passwordHash: string;
  centerName: string;
  address: string;
  state: string;
  lga: string;
  status: string;
  createdAt: Date;
  phone?: string;
  // Funding and Kit Tracking
  isFunded: boolean;
  fundingSource?: string;
  fundingAmount?: number;
  fundingDate?: Date;
  fundingExpiry?: Date;
  totalKits: number;
  usedKits: number;
  availableKits: number;
};

type MockAdmin = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

type MockScreeningType = {
  id: string;
  name: string;
  description?: string;
  screeningTypeCategoryId: string;
  active: boolean;
};

type MockScreeningTypeCategory = {
  id: string;
  name: string;
};

// Test data - correct password hashes
const PASSWORD_HASH_123 = "$2b$10$p7OAjfPNchoVnCrZpBfL2ub0YuUqoxN50Z0mWUemwAAVK4V24FOdu"; // password123
const PASSWORD_HASH_FAKE = "$2b$10$PkIqWetkVeWCnKLT4249Xetofw.Sl.qgGCngM0BBfBr67FeXUQV6"; // fake.password

const MOCK_ADMINS: MockAdmin[] = [
  {
    id: "admin-main",
    fullName: "ZeroCancer Admin",
    email: "ttaiwo4910@gmail.com",
    passwordHash: PASSWORD_HASH_FAKE,
    createdAt: new Date()
  },
  {
    id: "admin-demo",
    fullName: "Demo Administrator", 
    email: "admin@zerocancer.org",
    passwordHash: PASSWORD_HASH_123,
    createdAt: new Date()
  }
];

const MOCK_SCREENING_TYPE_CATEGORIES: MockScreeningTypeCategory[] = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Cancer Screening" },
  { id: "22222222-2222-2222-2222-222222222222", name: "Preventive Care" },
  { id: "33333333-3333-3333-3333-333333333333", name: "Diagnostic Tests" }
];

const MOCK_SCREENING_TYPES: MockScreeningType[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "Cervical Cancer Screening",
    description: "Pap smear and HPV testing for cervical cancer detection",
    screeningTypeCategoryId: "11111111-1111-1111-1111-111111111111",
    active: true
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    name: "Breast Cancer Screening",
    description: "Mammography and clinical breast examination",
    screeningTypeCategoryId: "11111111-1111-1111-1111-111111111111",
    active: true
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    name: "Prostate Cancer Screening",
    description: "PSA blood test and digital rectal examination",
    screeningTypeCategoryId: "11111111-1111-1111-1111-111111111111",
    active: true
  },
  {
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    name: "Colorectal Cancer Screening",
    description: "Colonoscopy and fecal occult blood test",
    screeningTypeCategoryId: "11111111-1111-1111-1111-111111111111",
    active: true
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    name: "Lung Cancer Screening",
    description: "Low-dose CT scan for high-risk individuals",
    screeningTypeCategoryId: "11111111-1111-1111-1111-111111111111",
    active: true
  },
  {
    id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    name: "Blood Pressure Check",
    description: "Hypertension screening and monitoring",
    screeningTypeCategoryId: "22222222-2222-2222-2222-222222222222",
    active: true
  },
  {
    id: "10101010-1010-1010-1010-101010101010",
    name: "Diabetes Screening",
    description: "Blood glucose and HbA1c testing",
    screeningTypeCategoryId: "22222222-2222-2222-2222-222222222222",
    active: true
  },
  {
    id: "20202020-2020-2020-2020-202020202020",
    name: "Cholesterol Test",
    description: "Lipid profile and cardiovascular risk assessment",
    screeningTypeCategoryId: "22222222-2222-2222-2222-222222222222",
    active: true
  },
  {
    id: "30303030-3030-3030-3030-303030303030",
    name: "Hepatitis B Screening",
    description: "HBsAg and anti-HBs testing",
    screeningTypeCategoryId: "33333333-3333-3333-3333-333333333333",
    active: true
  },
  {
    id: "40404040-4040-4040-4040-404040404040",
    name: "HIV Screening",
    description: "HIV antibody and antigen testing",
    screeningTypeCategoryId: "33333333-3333-3333-3333-333333333333",
    active: true
  }
];

const MOCK_CENTERS: MockServiceCenter[] = [
  {
    id: "center-lagos-1",
    email: "center1@zerocancer.org",
    passwordHash: PASSWORD_HASH_123,
    centerName: "Lagos General Health Center",
    address: "15 Marina Street, Lagos Island",
    state: "Lagos",
    lga: "Lagos Island",
    status: "ACTIVE",
    phone: "+234 801 234 5678",
    createdAt: new Date(),
    isFunded: true,
    fundingSource: "Federal Government",
    fundingAmount: 5000000,
    fundingDate: new Date("2025-01-15"),
    fundingExpiry: new Date("2026-12-31"),
    totalKits: 150,
    usedKits: 95,
    availableKits: 55
  },
  {
    id: "center-lagos-2", 
    email: "center2@zerocancer.org",
    passwordHash: PASSWORD_HASH_123,
    centerName: "Ikeja Medical Center",
    address: "45 Allen Avenue, Ikeja",
    state: "Lagos",
    lga: "Ikeja",
    status: "ACTIVE",
    phone: "+234 802 345 6789",
    createdAt: new Date(),
    isFunded: true,
    fundingSource: "Lagos State Government",
    fundingAmount: 3500000,
    fundingDate: new Date("2025-03-01"),
    fundingExpiry: new Date("2026-06-30"),
    totalKits: 100,
    usedKits: 72,
    availableKits: 28
  },
  {
    id: "center-abuja",
    email: "center3@zerocancer.org", 
    passwordHash: PASSWORD_HASH_123,
    centerName: "Abuja Central Hospital",
    address: "12 Independence Avenue, Central Area",
    state: "FCT",
    lga: "Municipal",
    status: "ACTIVE",
    phone: "+234 803 456 7890",
    createdAt: new Date(),
    isFunded: true,
    fundingSource: "WHO/UNICEF Partnership",
    fundingAmount: 8000000,
    fundingDate: new Date("2024-11-01"),
    fundingExpiry: new Date("2027-10-31"),
    totalKits: 200,
    usedKits: 120,
    availableKits: 80
  },
  {
    id: "center-kano",
    email: "center4@zerocancer.org",
    passwordHash: PASSWORD_HASH_123,
    centerName: "Kano State Health Center", 
    address: "8 Bompai Road, Nassarawa",
    state: "Kano",
    lga: "Nassarawa",
    status: "ACTIVE",
    phone: "+234 804 567 8901",
    createdAt: new Date(),
    isFunded: false,
    fundingSource: undefined,
    fundingAmount: undefined,
    fundingDate: undefined,
    fundingExpiry: undefined,
    totalKits: 30,
    usedKits: 25,
    availableKits: 5
  },
  {
    id: "center-portharcourt",
    email: "center5@zerocancer.org",
    passwordHash: PASSWORD_HASH_123,
    centerName: "Port Harcourt Medical Hub",
    address: "22 Aba Road, Port Harcourt", 
    state: "Rivers",
    lga: "Port Harcourt",
    status: "ACTIVE",
    phone: "+234 805 678 9012",
    createdAt: new Date(),
    isFunded: true,
    fundingSource: "Shell Nigeria CSR",
    fundingAmount: 4500000,
    fundingDate: new Date("2025-02-10"),
    fundingExpiry: new Date("2026-08-31"),
    totalKits: 120,
    usedKits: 85,
    availableKits: 35
  },
  {
    id: "center-ibadan",
    email: "center6@zerocancer.org",
    passwordHash: PASSWORD_HASH_123,
    centerName: "Ibadan University Teaching Hospital",
    address: "1 Queen Elizabeth Road, Ibadan",
    state: "Oyo", 
    lga: "Ibadan North",
    status: "ACTIVE",
    phone: "+234 806 789 0123",
    createdAt: new Date(),
    isFunded: true,
    fundingSource: "Oyo State Government",
    fundingAmount: 2500000,
    fundingDate: new Date("2025-04-01"),
    fundingExpiry: new Date("2026-03-31"),
    totalKits: 80,
    usedKits: 60,
    availableKits: 20
  },
  {
    id: "center-enugu",
    email: "center7@zerocancer.org",
    passwordHash: PASSWORD_HASH_123,
    centerName: "Enugu State Specialist Hospital",
    address: "5 Park Avenue, GRA Enugu",
    state: "Enugu",
    lga: "Enugu North", 
    status: "ACTIVE",
    phone: "+234 807 890 1234",
    createdAt: new Date(),
    isFunded: false,
    fundingSource: undefined,
    fundingAmount: undefined,
    fundingDate: undefined,
    fundingExpiry: undefined,
    totalKits: 15,
    usedKits: 12,
    availableKits: 3
  }
];

const MOCK_USERS: MockUser[] = [
  {
    id: "patient-1",
    fullName: "Adunni Okafor",
    email: "patient1@example.com",
    passwordHash: PASSWORD_HASH_123,
    createdAt: new Date()
  },
  {
    id: "patient-2", 
    fullName: "Chinedu Emeka",
    email: "patient2@example.com",
    passwordHash: PASSWORD_HASH_123,
    createdAt: new Date()
  },
  {
    id: "patient-3",
    fullName: "Fatima Abdullahi", 
    email: "patient3@example.com",
    passwordHash: PASSWORD_HASH_123,
    createdAt: new Date()
  },
  {
    id: "patient-4",
    fullName: "Kemi Adebayo",
    email: "patient4@example.com",
    passwordHash: PASSWORD_HASH_123,
    createdAt: new Date()
  },
  {
    id: "patient-5",
    fullName: "Tunde Olawale",
    email: "patient5@example.com", 
    passwordHash: PASSWORD_HASH_123,
    createdAt: new Date()
  },
  {
    id: "donor-1",
    fullName: "Aliko Dangote Foundation",
    email: "donor1@example.com",
    passwordHash: PASSWORD_HASH_123,
    createdAt: new Date()
  },
  {
    id: "donor-2",
    fullName: "Tony Elumelu Foundation",
    email: "donor2@example.com",
    passwordHash: PASSWORD_HASH_123,
    createdAt: new Date()
  },
  {
    id: "donor-3", 
    fullName: "Folorunsho Alakija Charity",
    email: "donor3@example.com",
    passwordHash: PASSWORD_HASH_123,
    createdAt: new Date()
  },
  {
    id: "donor-4",
    fullName: "MTN Foundation",
    email: "donor4@example.com",
    passwordHash: PASSWORD_HASH_123,
    createdAt: new Date()
  }
];

// Mock database interface that matches Prisma's API
export const getDB = (c: any) => {
  console.log("Using mock database for production testing");
  
  return {
    // Mock admin operations
    admins: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          return MOCK_ADMINS.find(admin => admin.email === where.email) || null;
        }
        if (where.id) {
          return MOCK_ADMINS.find(admin => admin.id === where.id) || null;
        }
        return null;
      },
      count: async () => MOCK_ADMINS.length
    },
    
    // Mock service center operations
    serviceCenter: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          return MOCK_CENTERS.find(center => center.email === where.email) || null;
        }
        if (where.id) {
          return MOCK_CENTERS.find(center => center.id === where.id) || null;
        }
        return null;
      },
      findMany: async ({ where, skip, take, orderBy, include }: any = {}) => {
        let filtered = [...MOCK_CENTERS];
        
        // Apply filters
        if (where) {
          if (where.status) {
            filtered = filtered.filter(c => c.status === where.status);
          }
          if (where.state) {
            filtered = filtered.filter(c => c.state === where.state);
          }
          if (where.lga) {
            filtered = filtered.filter(c => c.lga === where.lga);
          }
          if (where.OR && Array.isArray(where.OR)) {
            // Search functionality
            const searchTerm = where.OR[0]?.centerName?.contains?.toLowerCase() || '';
            if (searchTerm) {
              filtered = filtered.filter(c => 
                c.centerName.toLowerCase().includes(searchTerm) ||
                c.address.toLowerCase().includes(searchTerm) ||
                c.email.toLowerCase().includes(searchTerm)
              );
            }
          }
        }
        
        // Apply pagination
        const start = skip || 0;
        const end = take ? start + take : filtered.length;
        const paginated = filtered.slice(start, end);
        
        // Add mock includes - always return arrays
        return paginated.map(center => ({
          ...center,
          services: [],
          staff: [],
        }));
      },
      count: async ({ where }: any = {}) => {
        let filtered = [...MOCK_CENTERS];
        
        if (where) {
          if (where.status) {
            filtered = filtered.filter(c => c.status === where.status);
          }
          if (where.state) {
            filtered = filtered.filter(c => c.state === where.state);
          }
          if (where.lga) {
            filtered = filtered.filter(c => c.lga === where.lga);
          }
        }
        
        return filtered.length;
      },
      create: async ({ data, include }: any) => {
        const newCenter: MockServiceCenter = {
          id: `center-${Date.now()}`,
          email: data.email,
          passwordHash: data.passwordHash,
          centerName: data.centerName,
          address: data.address,
          state: data.state,
          lga: data.lga,
          status: "PENDING",
          phone: data.phone,
          createdAt: new Date(),
          isFunded: false,
          fundingSource: undefined,
          fundingAmount: undefined,
          fundingDate: undefined,
          fundingExpiry: undefined,
          totalKits: 0,
          usedKits: 0,
          availableKits: 0
        };
        
        MOCK_CENTERS.push(newCenter);
        
        // Return with services if included
        if (include?.services) {
          const serviceIds = data.services?.connect?.map((s: any) => s.id) || [];
          return {
            ...newCenter,
            services: serviceIds.map((id: string) => ({ id }))
          };
        }
        
        return newCenter;
      }
    },
    
    // Mock user operations  
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          const user = MOCK_USERS.find(user => user.email === where.email);
          if (user) {
            // Add mock profiles based on email
            const isPatient = user.email.includes('patient');
            const isDonor = user.email.includes('donor');
            
            return {
              ...user,
              patientProfile: isPatient ? { 
                id: `profile-${user.id}`,
                userId: user.id,
                emailVerified: new Date(),
                gender: "FEMALE",
                dateOfBirth: new Date("1990-01-01"),
                city: "Lagos",
                state: "Lagos"
              } : null,
              donorProfile: isDonor ? {
                id: `profile-${user.id}`, 
                userId: user.id,
                emailVerified: new Date(),
                organizationName: user.fullName,
                country: "Nigeria"
              } : null
            };
          }
        }
        if (where.id) {
          const user = MOCK_USERS.find(user => user.id === where.id);
          return user || null;
        }
        return null;
      },
      count: async () => MOCK_USERS.length
    },

    // Mock screening type operations
    screeningType: {
      findMany: async ({ where, skip, take, orderBy, select }: any = {}) => {
        let filtered = [...MOCK_SCREENING_TYPES];
        
        // Apply filters
        if (where) {
          if (where.active !== undefined) {
            filtered = filtered.filter(st => st.active === where.active);
          }
          if (where.screeningTypeCategoryId) {
            filtered = filtered.filter(st => st.screeningTypeCategoryId === where.screeningTypeCategoryId);
          }
          if (where.name?.contains) {
            const searchTerm = where.name.contains.toLowerCase();
            filtered = filtered.filter(st => st.name.toLowerCase().includes(searchTerm));
          }
        }
        
        // Apply sorting
        if (orderBy?.name === 'asc') {
          filtered.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        // Apply pagination
        const start = skip || 0;
        const end = take ? start + take : filtered.length;
        
        return filtered.slice(start, end);
      },
      findUnique: async ({ where }: { where: { id?: string } }) => {
        if (where.id) {
          return MOCK_SCREENING_TYPES.find(st => st.id === where.id) || null;
        }
        return null;
      },
      findFirst: async ({ where }: { where: { name?: string } }) => {
        if (where.name) {
          return MOCK_SCREENING_TYPES.find(st => st.name === where.name) || null;
        }
        return null;
      },
      count: async ({ where }: any = {}) => {
        let filtered = [...MOCK_SCREENING_TYPES];
        
        if (where) {
          if (where.active !== undefined) {
            filtered = filtered.filter(st => st.active === where.active);
          }
          if (where.screeningTypeCategoryId) {
            filtered = filtered.filter(st => st.screeningTypeCategoryId === where.screeningTypeCategoryId);
          }
        }
        
        return filtered.length;
      }
    },

    // Mock screening type category operations
    screeningTypeCategory: {
      findMany: async ({ select, orderBy }: any = {}) => {
        let categories = [...MOCK_SCREENING_TYPE_CATEGORIES];
        
        if (orderBy?.name === 'asc') {
          categories.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        return categories;
      },
      findUnique: async ({ where }: { where: { id?: string } }) => {
        if (where.id) {
          return MOCK_SCREENING_TYPE_CATEGORIES.find(cat => cat.id === where.id) || null;
        }
        return null;
      }
    },

    // Mock center staff operations
    centerStaff: {
      create: async ({ data }: any) => {
        const newStaff = {
          id: `staff-${Date.now()}`,
          centerId: data.centerId,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          createdAt: new Date()
        };
        
        return newStaff;
      },
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        // For mock purposes, return null (no existing staff)
        return null;
      }
    }
  };
};

export type TDB = ReturnType<typeof getDB>;
