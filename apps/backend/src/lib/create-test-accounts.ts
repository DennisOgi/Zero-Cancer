import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  console.log("Creating Admin...");
  await prisma.admins.upsert({
    where: { email: "admin@zerocancer.com" },
    update: {},
    create: {
      email: "admin@zerocancer.com",
      fullName: "Test Admin",
      passwordHash: hashedPassword,
    },
  });

  console.log("Creating Patient...");
  await prisma.user.upsert({
    where: { email: "patient@zerocancer.com" },
    update: {},
    create: {
      email: "patient@zerocancer.com",
      fullName: "Test Patient",
      passwordHash: hashedPassword,
      phone: "08012345678",
      patientProfile: {
        create: {
          gender: "MALE",
          dateOfBirth: new Date("1990-01-01"),
          city: "Lagos",
          state: "Lagos",
          emailVerified: true,
        },
      },
    },
  });

  console.log("Creating Donor...");
  await prisma.user.upsert({
    where: { email: "donor@zerocancer.com" },
    update: {},
    create: {
      email: "donor@zerocancer.com",
      fullName: "Test Donor",
      passwordHash: hashedPassword,
      phone: "08012345679",
      donorProfile: {
        create: {
          organizationName: "Test Org",
          country: "Nigeria",
          emailVerified: true,
        },
      },
    },
  });

  console.log("Creating Center...");
  const center = await prisma.serviceCenter.upsert({
    where: { email: "center@zerocancer.com" },
    update: {},
    create: {
      email: "center@zerocancer.com",
      centerName: "Test Center",
      passwordHash: hashedPassword,
      phone: "08012345670",
      address: "123 Test St",
      state: "Lagos",
      lga: "Ikeja",
      status: "ACTIVE",
    },
  });

  await prisma.centerStaff.upsert({
    where: { email: "center@zerocancer.com" },
    update: {},
    create: {
      centerId: center.id,
      email: "center@zerocancer.com",
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Test accounts created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
