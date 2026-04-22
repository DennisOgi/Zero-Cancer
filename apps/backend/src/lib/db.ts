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
};

type MockAdmin = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
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
    createdAt: new Date()
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
    createdAt: new Date()
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
    createdAt: new Date()
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
    createdAt: new Date()
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
    createdAt: new Date()
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
    createdAt: new Date()
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
    createdAt: new Date()
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
      count: async () => MOCK_CENTERS.length
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
    }
  };
};

export type TDB = ReturnType<typeof getDB>;
