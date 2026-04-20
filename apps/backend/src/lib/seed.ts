import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const getDB = (c: { env: { DATABASE_URL: string } }) => {
  return new PrismaClient();
};

const prisma = getDB({
  env: { DATABASE_URL: process.env.DATABASE_URL || "" },
});
const TEST_PASSWORDS = ["password123", "testpass456", "demo789"];

async function main() {
  try {
    console.log("🌱 Seeding Zerocancer database...");
    const categories = [
      { id: "cancer", name: "Cancer", description: "Cancer-related screenings" },
      { id: "vaccine", name: "Vaccine", description: "Preventive vaccinations" },
      { id: "general", name: "General", description: "General health screenings" },
      { id: "treatement", name: "treatment", description: "treatment-related screenings" },
      { id: "screening", name: "Screening", description: "Screening-related stuff" },
    ];

    for (const cat of categories) {
      await prisma.screeningTypeCategory.upsert({
        where: { id: cat.id },
        update: cat,
        create: cat,
      });
    }

  console.log("🌿 Seeding screening types...");
  
  // Use upsert for each screening type instead of createMany with skipDuplicates
  const screeningTypesData = [
    {
      name: "Cervical Cancer Screening",
      description: "Pap smear test",
      screeningTypeCategoryId: "cancer",
    },
    {
      name: "Breast Cancer Screening",
      description: "Mammography test",
      screeningTypeCategoryId: "cancer",
    },
    {
      name: "Prostate Cancer Screening",
      description: "PSA blood test",
      screeningTypeCategoryId: "cancer",
    },
    {
      name: "Colorectal Cancer Screening",
      description: "Colonoscopy and stool tests",
      screeningTypeCategoryId: "cancer",
    },
    {
      name: "Skin Cancer Screening",
      description: "Dermatological evaluation",
      screeningTypeCategoryId: "cancer",
    },

    {
      name: "Polio Vaccine",
      description: "Polio immunization",
      screeningTypeCategoryId: "vaccine",
    },
    {
      name: "Hepatitis B Vaccine",
      description: "Prevent Hepatitis B",
      screeningTypeCategoryId: "vaccine",
    },
    {
      name: "HPV Vaccine",
      description: "Protect against HPV infection",
      screeningTypeCategoryId: "vaccine",
    },
    {
      name: "COVID-19 Vaccine",
      description: "Immunization against COVID-19",
      screeningTypeCategoryId: "vaccine",
    },
    {
      name: "Measles Vaccine",
      description: "Prevent measles infection",
      screeningTypeCategoryId: "vaccine",
    },

    {
      name: "Blood Pressure Check",
      description: "Basic BP screening",
      screeningTypeCategoryId: "general",
    },
    {
      name: "Diabetes Screening",
      description: "Blood sugar test",
      screeningTypeCategoryId: "general",
    },
    {
      name: "Vision Test",
      description: "Basic eye check",
      screeningTypeCategoryId: "general",
    },
    {
      name: "Cholesterol Check",
      description: "Lipid profile test",
      screeningTypeCategoryId: "general",
    },
    {
      name: "Liver Function Test",
      description: "Check liver health",
      screeningTypeCategoryId: "general",
    },

    {
      name: "Antiretroviral Therapy",
      description: "HIV treatment access",
      screeningTypeCategoryId: "treatement",
    },
    {
      name: "Malaria Treatment",
      description: "Treatment for malaria-positive patients",
      screeningTypeCategoryId: "treatement",
    },
    {
      name: "Tuberculosis Treatment",
      description: "Free TB treatment",
      screeningTypeCategoryId: "treatement",
    },
    {
      name: "Typhoid Treatment",
      description: "Treat typhoid fever",
      screeningTypeCategoryId: "treatement",
    },
    {
      name: "Pneumonia Treatment",
      description: "Respiratory illness management",
      screeningTypeCategoryId: "treatement",
    },

    {
      name: "Body Mass Index (BMI) Screening",
      description: "General obesity and weight check",
      screeningTypeCategoryId: "screening",
    },
    {
      name: "Hearing Test",
      description: "Basic audiometry screening",
      screeningTypeCategoryId: "screening",
    },
    {
      name: "Mental Health Evaluation",
      description: "Depression and anxiety screening",
      screeningTypeCategoryId: "screening",
    },
    {
      name: "Dental Check",
      description: "Routine oral hygiene exam",
      screeningTypeCategoryId: "screening",
    },
    {
      name: "Allergy Test",
      description: "Common allergen panel",
      screeningTypeCategoryId: "screening",
    },
  ];

  for (const screeningType of screeningTypesData) {
    await prisma.screeningType.upsert({
      where: { name: screeningType.name },
      update: {},
      create: screeningType,
    });
  }

  const screeningTypes = await prisma.screeningType.findMany();

  console.log("👤 Creating general public donor...");
  await prisma.user.upsert({
    where: { id: "general-public" },
    update: {},
    create: {
      id: "general-public",
      fullName: "General Donor Pool",
      email: "donorpool@zerocancer.org",
      passwordHash: await bcrypt.hash("password", 10),
      donorProfile: {
        create: {
          country: "Nigeria",
          emailVerified: new Date(),
        },
      },
    },
  });

  console.log("🔐 Creating admin...");
  const adminData = [
    {
      fullName: "Tobi Taiwo",
      email: "ttaiwo4910@gmail.com",
      password: "fake.password",
    },
    {
      fullName: "Kwaghuter Raphael",
      email: "raphaelgbaorun@gmail.com",
      password: "he_wanted_one",
    },
    // Add more admins here as needed
  ];

  await Promise.all(
    adminData.map(async (admin) =>
      prisma.admins.upsert({
        where: { email: admin.email },
        update: {},
        create: {
          id: faker.string.uuid(),
          fullName: admin.fullName,
          email: admin.email,
          passwordHash: await bcrypt.hash(admin.password, 10),
        },
      })
    )
  );

  console.log("💰 Seeding general donation campaign...");
  await prisma.donationCampaign.upsert({
    where: { id: "general-donor-pool" },
    update: {},
    create: {
      id: "general-donor-pool",
      donorId: "general-public",
      title: "General donation public pool",
      availableAmount: 0,
      totalAmount: 0,
      status: "ACTIVE",
    },
  });

  console.log("📤 Creating test donors...");
  const testDonors = await Promise.all(
    TEST_PASSWORDS.map(async (password, index) =>
      prisma.user.upsert({
        where: { email: `testdonor${index + 1}@example.com` },
        update: {},
        create: {
          fullName: `Test Donor ${index + 1}`,
          email: `testdonor${index + 1}@example.com`,
          phone: faker.phone.number({ style: "human" }),
          passwordHash: await bcrypt.hash(password, 10),
          donorProfile: {
            create: {
              organizationName: `Donor Org ${index + 1}`,
              country: "Nigeria",
              emailVerified: new Date(),
            },
          },
        },
      })
    )
  );

  console.log("📥 Creating test patients...");
  const testPatients = await Promise.all(
    TEST_PASSWORDS.map(async (password, index) =>
      prisma.user.upsert({
        where: { email: `testpatient${index + 1}@example.com` },
        update: {},
        create: {
          fullName: `Test Patient ${index + 1}`,
          email: `testpatient${index + 1}@example.com`,
          phone: faker.phone.number({ style: "international" }),
          passwordHash: await bcrypt.hash(password, 10),
          patientProfile: {
            create: {
              gender: faker.helpers.arrayElement(["MALE", "FEMALE"]),
              dateOfBirth: faker.date.birthdate({
                min: 18,
                max: 65,
                mode: "age",
              }),
              city: index === 0 ? "Lagos" : index === 1 ? "Kano" : "Enugu",
              state: index === 0 ? "Lagos" : index === 1 ? "Kano" : "Enugu",
              emailVerified: new Date(),
            },
          },
        },
      })
    )
  );

  // console.log("📝 Creating waitlists...");
  // for (const patient of testPatients) {
  //   const screenings = faker.helpers.arrayElements(screeningTypes, 2);
  //   for (const screening of screenings) {
  //     await prisma.waitlist.create({
  //       data: {
  //         screeningTypeId: screening.id,
  //         patientId: patient.id,
  //         status: "PENDING",
  //       },
  //     });
  //   }
  // }

  // console.log("🎯 Creating donation allocations...");
  // // comment out if giving errors
  // const waitlists = await prisma.waitlist.findMany({
  //   where: { status: "PENDING" },
  // });
  // await Promise.all(
  //   waitlists.slice(0, 5).map(async (w) => {
  //     await prisma.donationAllocation.create({
  //       data: {
  //         waitlistId: w.id,
  //         patientId: w.patientId,
  //         campaignId: "general-donor-pool",
  //       },
  //     });
  //   })
  // );

  console.log("🏥 Creating service centers...");
  const centerLocations = [
    { state: "Lagos", lga: "Ikeja" },
    { state: "Lagos", lga: "Surulere" },
    { state: "Ogun", lga: "Abeokuta South" },
    { state: "FCT", lga: "Gwagwalada" },
    { state: "Kano", lga: "Nasarawa" },
    { state: "Enugu", lga: "Nsukka" },
    { state: "Sokoto", lga: "Wamako" },
  ];

  await Promise.allSettled(
    centerLocations.map(async (loc, i) => {
      const hashedPassword = await bcrypt.hash("centerpass", 10);
      const center = await prisma.serviceCenter.upsert({
        where: { email: `center${i + 1}@zerocancer.org` },
        update: {},
        create: {
          email: `center${i + 1}@zerocancer.org`,
          passwordHash: hashedPassword,
          centerName: `Health Center ${i + 1}`,
          address: faker.location.streetAddress(),
          state: loc.state,
          lga: loc.lga,
          bankName: faker.company.name(),
          bankAccount: faker.finance.accountNumber(),
          status: "ACTIVE",
          // screeningTypes: {
          //   create: screeningTypes.map((type) => ({
          //     screeningTypeId: type.id,
          //   })),
          // },
        },
      });

      await prisma.centerStaff.upsert({
        where: {
          centerId_email: {
            centerId: center.id,
            email: `center${i + 1}@zerocancer.org`,
          },
        },
        update: {},
        create: {
          id: center.id,
          email: `center${i + 1}@zerocancer.org`,
          passwordHash: hashedPassword,
          role: "admin",
          centerId: center.id,
        },
      });

      await Promise.all([
        prisma.centerStaff.upsert({
          where: {
            centerId_email: {
              centerId: center.id,
              email: `staff${i + 1}a@zerocancer.africa`,
            },
          },
          update: {},
          create: {
            email: `staff${i + 1}a@zerocancer.africa`,
            passwordHash: await bcrypt.hash("staffpass", 10),
            role: "admin",
            centerId: center.id,
          },
        }),
        prisma.centerStaff.upsert({
          where: {
            centerId_email: {
              centerId: center.id,
              email: `staff${i + 1}b@zerocancer.africa`,
            },
          },
          update: {},
          create: {
            email: `staff${i + 1}b@zerocancer.africa`,
            passwordHash: await bcrypt.hash("staffpass", 10),
            role: "nurse",
            centerId: center.id,
          },
        }),
      ]);

      const types = faker.helpers.arrayElements(screeningTypes, 2);
      await prisma.serviceCenter.update({
        where: { id: center.id },
        data: {
          services: {
            connect: types.map((t) => ({ id: t.id })),
          },
          screeningTypes: {
            create: types.map((t) => ({ screeningTypeId: t.id })),
          },
        },
      });
    })
  );

  console.log("\u2705 Seeding complete!");
  console.log("\n\u{1F9EA} Test Accounts:");

  console.log("\u{1F464} Admins:");
  adminData.forEach((admin) =>
    console.log(`  ${admin.email} / ${admin.password}`)
  );

  console.log("\u{1F3E5} Centers (Admin Login):");
  centerLocations.forEach((loc, i) =>
    console.log(`  center${i + 1}@zerocancer.org / centerpass`)
  );

  console.log("\u{1F468}\u200D\u2695\uFE0F} Center Staff:");
  centerLocations.forEach((loc, i) => {
    console.log(`  staff${i + 1}a@zerocancer.africa / staffpass (admin)`);
    console.log(`  staff${i + 1}b@zerocancer.africa / staffpass (nurse)`);
  });

  console.log("\u{1F4E4} Donors:");
  testDonors.forEach((u, i) =>
    console.log(`  ${u.email} / ${TEST_PASSWORDS[i]}`)
  );

  console.log("\u{1F4E5} Patients:");
  testPatients.forEach((u, i) =>
    console.log(`  ${u.email} / ${TEST_PASSWORDS[i]}`)
  );
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Seeding failed:", error.message);
      if ("code" in error) console.error("Error Code:", (error as any).code);
      if ("meta" in error) console.error("Error Meta:", (error as any).meta);
    } else {
      console.error("❌ Seeding failed with unknown error:", error);
    }
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
