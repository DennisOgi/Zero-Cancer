import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Enhanced Test Seed Script
 * Creates comprehensive test data for all features:
 * - Patients with waitlist entries
 * - Donors with funded campaigns
 * - Appointments across centers
 * - Donation allocations
 * - Matching execution history
 */

async function main() {
  console.log("🌱 Starting enhanced test data seeding...\n");

  try {
    // Get existing data
    const patients = await prisma.user.findMany({
      where: { patientProfile: { isNot: null } },
      include: { patientProfile: true },
    });

    const donors = await prisma.user.findMany({
      where: { donorProfile: { isNot: null } },
      include: { donorProfile: true },
    });

    const centers = await prisma.serviceCenter.findMany({
      include: { services: true },
    });

    const screeningTypes = await prisma.screeningType.findMany();

    console.log(`📊 Found existing data:`);
    console.log(`   - ${patients.length} patients`);
    console.log(`   - ${donors.length} donors`);
    console.log(`   - ${centers.length} centers`);
    console.log(`   - ${screeningTypes.length} screening types\n`);

    // 1. Create funded donation campaigns
    console.log("💰 Creating funded donation campaigns...");
    
    const campaigns = [];
    for (let i = 0; i < donors.length; i++) {
      const donor = donors[i];
      const selectedScreeningTypes = faker.helpers.arrayElements(
        screeningTypes,
        faker.number.int({ min: 1, max: 3 })
      );

      // Campaign 1: Targeted campaign (specific demographics)
      const targetedCampaign = await prisma.donationCampaign.create({
        data: {
          donorId: donor.id,
          title: `${donor.fullName}'s Targeted Cancer Screening Fund`,
          purpose: `Providing free cancer screenings for women aged 30-50 in Lagos`,
          totalAmount: 500000, // ₦500,000
          availableAmount: 500000,
          status: "ACTIVE",
          targetGender: "FEMALE",
          targetAgeRange: "30-50",
          targetStates: JSON.stringify(["Lagos"]),
          targetLgas: JSON.stringify(["Ikeja", "Surulere"]),
          screeningTypes: {
            connect: selectedScreeningTypes.map((st) => ({ id: st.id })),
          },
        },
      });
      campaigns.push(targetedCampaign);

      // Campaign 2: General campaign (no targeting)
      if (i < 2) {
        const generalCampaign = await prisma.donationCampaign.create({
          data: {
            donorId: donor.id,
            title: `${donor.fullName}'s General Health Fund`,
            purpose: `Supporting health screenings for all Nigerians`,
            totalAmount: 300000, // ₦300,000
            availableAmount: 300000,
            status: "ACTIVE",
            targetStates: JSON.stringify([]),
            targetLgas: JSON.stringify([]),
            screeningTypes: {
              connect: screeningTypes.slice(0, 5).map((st) => ({ id: st.id })),
            },
          },
        });
        campaigns.push(generalCampaign);
      }
    }

    console.log(`   ✅ Created ${campaigns.length} campaigns\n`);

    // 2. Add funds to general donor pool
    console.log("🏦 Adding funds to general donor pool...");
    await prisma.donationCampaign.update({
      where: { id: "general-donor-pool" },
      data: {
        totalAmount: 1000000, // ₦1,000,000
        availableAmount: 1000000,
      },
    });
    console.log("   ✅ Added ₦1,000,000 to general pool\n");

    // 3. Create waitlist entries for patients
    console.log("📝 Creating waitlist entries...");
    
    let waitlistCount = 0;
    for (const patient of patients) {
      // Each patient joins 2-4 waitlists
      const numWaitlists = faker.number.int({ min: 2, max: 4 });
      const selectedScreenings = faker.helpers.arrayElements(
        screeningTypes,
        numWaitlists
      );

      for (const screening of selectedScreenings) {
        // Check if already in waitlist
        const existing = await prisma.waitlist.findFirst({
          where: {
            patientId: patient.id,
            screeningTypeId: screening.id,
          },
        });

        if (!existing) {
          await prisma.waitlist.create({
            data: {
              patientId: patient.id,
              screeningTypeId: screening.id,
              status: "PENDING",
              joinedAt: faker.date.recent({ days: 30 }),
            },
          });
          waitlistCount++;
        }
      }
    }

    console.log(`   ✅ Created ${waitlistCount} waitlist entries\n`);

    // 4. Create some matched allocations (simulate matching algorithm results)
    console.log("🎯 Creating donation allocations...");
    
    const pendingWaitlists = await prisma.waitlist.findMany({
      where: { status: "PENDING" },
      take: 5,
      include: { screening: true },
    });

    let allocationCount = 0;
    for (const waitlist of pendingWaitlists) {
      // Find a suitable campaign
      const suitableCampaign = campaigns.find(
        (c) => c.availableAmount >= waitlist.screening.agreedPrice
      );

      if (suitableCampaign) {
        // Create allocation
        await prisma.donationAllocation.create({
          data: {
            waitlistId: waitlist.id,
            patientId: waitlist.patientId,
            campaignId: suitableCampaign.id,
            amountAllocated: waitlist.screening.agreedPrice,
            createdViaMatching: true,
          },
        });

        // Update waitlist status
        await prisma.waitlist.update({
          where: { id: waitlist.id },
          data: { status: "MATCHED" },
        });

        // Decrement campaign available amount
        await prisma.donationCampaign.update({
          where: { id: suitableCampaign.id },
          data: {
            availableAmount: {
              decrement: waitlist.screening.agreedPrice,
            },
          },
        });

        allocationCount++;
      }
    }

    console.log(`   ✅ Created ${allocationCount} allocations\n`);

    // 5. Create appointments
    console.log("📅 Creating appointments...");
    
    let appointmentCount = 0;
    
    // Create some appointments for matched patients
    const matchedWaitlists = await prisma.waitlist.findMany({
      where: { status: "MATCHED" },
      include: { allocation: true },
    });

    for (const waitlist of matchedWaitlists.slice(0, 3)) {
      const center = faker.helpers.arrayElement(centers);
      const appointmentDate = faker.date.soon({ days: 14 });

      await prisma.appointment.create({
        data: {
          patientId: waitlist.patientId,
          centerId: center.id,
          screeningTypeId: waitlist.screeningTypeId,
          isDonation: true,
          appointmentDateTime: appointmentDate,
          status: "SCHEDULED",
          checkInCode: faker.string.alphanumeric(6).toUpperCase(),
          checkInCodeExpiresAt: new Date(
            appointmentDate.getTime() + 24 * 60 * 60 * 1000
          ),
        },
      });
      appointmentCount++;
    }

    // Create some paid appointments (non-donation)
    for (let i = 0; i < 2; i++) {
      const patient = faker.helpers.arrayElement(patients);
      const center = faker.helpers.arrayElement(centers);
      const screening = faker.helpers.arrayElement(screeningTypes);
      const appointmentDate = faker.date.soon({ days: 14 });

      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          centerId: center.id,
          screeningTypeId: screening.id,
          isDonation: false,
          appointmentDateTime: appointmentDate,
          status: "SCHEDULED",
          checkInCode: faker.string.alphanumeric(6).toUpperCase(),
          checkInCodeExpiresAt: new Date(
            appointmentDate.getTime() + 24 * 60 * 60 * 1000
          ),
        },
      });
      appointmentCount++;
    }

    console.log(`   ✅ Created ${appointmentCount} appointments\n`);

    // 6. Create some completed appointments with results
    console.log("📋 Creating completed appointments with results...");
    
    const completedAppointment = await prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        centerId: centers[0].id,
        screeningTypeId: screeningTypes[0].id,
        isDonation: true,
        appointmentDateTime: faker.date.recent({ days: 7 }),
        status: "COMPLETED",
      },
    });

    // Add verification
    const staff = await prisma.centerStaff.findFirst({
      where: { centerId: centers[0].id },
    });

    if (staff) {
      await prisma.appointmentVerification.create({
        data: {
          appointmentId: completedAppointment.id,
          verifiedBy: staff.id,
          verifiedAt: new Date(),
        },
      });

      // Add screening result
      await prisma.screeningResult.create({
        data: {
          appointmentId: completedAppointment.id,
          notes: "Patient screening completed successfully. Results are normal.",
          uploadedBy: staff.id,
        },
      });
    }

    console.log("   ✅ Created completed appointment with results\n");

    // 7. Create transactions
    console.log("💳 Creating transaction records...");
    
    let transactionCount = 0;
    for (const campaign of campaigns.slice(0, 3)) {
      await prisma.transaction.create({
        data: {
          type: "DONATION",
          status: "COMPLETED",
          amount: campaign.totalAmount,
          relatedDonationId: campaign.id,
          paymentReference: `ref-${faker.string.alphanumeric(10)}`,
          paymentChannel: "PAYSTACK",
        },
      });
      transactionCount++;
    }

    console.log(`   ✅ Created ${transactionCount} transactions\n`);

    // 8. Create notifications
    console.log("🔔 Creating notifications...");
    
    // Notification for matched patients
    const matchedPatients = await prisma.waitlist.findMany({
      where: { status: "MATCHED" },
      select: { patientId: true },
      distinct: ["patientId"],
    });

    if (matchedPatients.length > 0) {
      const notification = await prisma.notification.create({
        data: {
          type: "MATCHED",
          title: "You've been matched!",
          message:
            "Great news! You've been matched with a donation campaign for your screening.",
          data: JSON.stringify({ source: "test-seed" }),
        },
      });

      for (const { patientId } of matchedPatients) {
        await prisma.notificationRecipient.create({
          data: {
            notificationId: notification.id,
            userId: patientId,
            read: false,
          },
        });
      }

      console.log(
        `   ✅ Created notifications for ${matchedPatients.length} patients\n`
      );
    }

    // Summary
    console.log("✅ Enhanced test data seeding complete!\n");
    console.log("📊 Summary:");
    console.log(`   - ${campaigns.length} donation campaigns created`);
    console.log(`   - ${waitlistCount} waitlist entries created`);
    console.log(`   - ${allocationCount} allocations created`);
    console.log(`   - ${appointmentCount} appointments created`);
    console.log(`   - ${transactionCount} transactions created`);
    console.log(`   - Notifications sent to ${matchedPatients.length} patients`);
    console.log("\n🎉 Database is now ready for comprehensive testing!");
  } catch (error) {
    console.error("❌ Enhanced seeding failed:", error);
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
