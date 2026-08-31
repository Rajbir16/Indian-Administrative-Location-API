import { prisma } from "../backend/src/config/database.js";

async function main() {
  console.log("🌱 Starting database seed...\n");

  try {
    // ==================================================
    // SEED COUNTRY DATA
    // ==================================================
    console.log("Seeding Country...");
    const country = await prisma.country.upsert({
      where: { code: "IN" },
      update: {},
      create: {
        name: "India",
        code: "IN",
        status: "active",
      },
    });
    console.log(`✓ Country created: ${country.name}\n`);

    // ==================================================
    // SEED STATES DATA
    // ==================================================
    console.log("Seeding States...");
    const states = await Promise.all([
      prisma.state.upsert({
        where: { code: "27" },
        update: {},
        create: {
          code: "27",
          name: "Maharashtra",
          countryId: country.id,
          status: "active",
        },
      }),
      prisma.state.upsert({
        where: { code: "08" },
        update: {},
        create: {
          code: "08",
          name: "Andhra Pradesh",
          countryId: country.id,
          status: "active",
        },
      }),
      prisma.state.upsert({
        where: { code: "12" },
        update: {},
        create: {
          code: "12",
          name: "Goa",
          countryId: country.id,
          status: "active",
        },
      }),
    ]);
    console.log(`✓ Created ${states.length} states\n`);

    // ==================================================
    // SEED DISTRICTS DATA
    // ==================================================
    console.log("Seeding Districts...");
    const maharashtraState = states[0];

    const districts = await Promise.all([
      prisma.district.upsert({
        where: { code: "497" },
        update: {},
        create: {
          code: "497",
          name: "Nandurbar",
          stateId: maharashtraState.id,
          status: "active",
        },
      }),
      prisma.district.upsert({
        where: { code: "498" },
        update: {},
        create: {
          code: "498",
          name: "Dhule",
          stateId: maharashtraState.id,
          status: "active",
        },
      }),
      prisma.district.upsert({
        where: { code: "499" },
        update: {},
        create: {
          code: "499",
          name: "Nashik",
          stateId: maharashtraState.id,
          status: "active",
        },
      }),
    ]);
    console.log(`✓ Created ${districts.length} districts\n`);

    // ==================================================
    // SEED SUB-DISTRICTS DATA
    // ==================================================
    console.log("Seeding Sub-Districts...");
    const nandurbarDistrict = districts[0];

    const subDistricts = await Promise.all([
      prisma.subDistrict.upsert({
        where: { code: "03950" },
        update: {},
        create: {
          code: "03950",
          name: "Akkalkuwa",
          districtId: nandurbarDistrict.id,
          status: "active",
        },
      }),
      prisma.subDistrict.upsert({
        where: { code: "03951" },
        update: {},
        create: {
          code: "03951",
          name: "Nandurbar",
          districtId: nandurbarDistrict.id,
          status: "active",
        },
      }),
    ]);
    console.log(`✓ Created ${subDistricts.length} sub-districts\n`);

    // ==================================================
    // SEED VILLAGES DATA
    // ==================================================
    console.log("Seeding Villages...");
    const akkalkuwaSubDistrict = subDistricts[0];

    const villages = await Promise.all([
      prisma.village.upsert({
        where: { code: "525001" },
        update: {},
        create: {
          code: "525001",
          name: "Akkalkuwa",
          subDistrictId: akkalkuwaSubDistrict.id,
          status: "active",
        },
      }),
      prisma.village.upsert({
        where: { code: "525002" },
        update: {},
        create: {
          code: "525002",
          name: "Manibeli",
          subDistrictId: akkalkuwaSubDistrict.id,
          status: "active",
        },
      }),
      prisma.village.upsert({
        where: { code: "525003" },
        update: {},
        create: {
          code: "525003",
          name: "Pimpalkhut",
          subDistrictId: akkalkuwaSubDistrict.id,
          status: "active",
        },
      }),
      prisma.village.upsert({
        where: { code: "525004" },
        update: {},
        create: {
          code: "525004",
          name: "Shipur",
          subDistrictId: akkalkuwaSubDistrict.id,
          status: "active",
        },
      }),
      prisma.village.upsert({
        where: { code: "525005" },
        update: {},
        create: {
          code: "525005",
          name: "Gavhane",
          subDistrictId: akkalkuwaSubDistrict.id,
          status: "active",
        },
      }),
    ]);
    console.log(`✓ Created ${villages.length} villages\n`);

    // ==================================================
    // SEED USER DATA (Optional - for testing)
    // ==================================================
    console.log("Seeding Sample User...");
    const user = await prisma.user.upsert({
      where: { email: "demo@example.com" },
      update: {},
      create: {
        email: "demo@example.com",
        passwordHash: "$2b$10$example", // Will be replaced with actual hash in Phase 6
        firstName: "Demo",
        lastName: "User",
        planType: "free",
        status: "active",
      },
    });
    console.log(`✓ Sample user created: ${user.email}\n`);

    // ==================================================
    // SEED SUMMARY
    // ==================================================
    console.log("✅ Database seed completed successfully!\n");
    console.log("Summary:");
    console.log(`  - Country: 1`);
    console.log(`  - States: ${states.length}`);
    console.log(`  - Districts: ${districts.length}`);
    console.log(`  - Sub-Districts: ${subDistricts.length}`);
    console.log(`  - Villages: ${villages.length}`);
    console.log(`  - Users: 1\n`);
  } catch (error) {
    console.error("❌ Seed error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
