/**
 * Database Connection Test Script
 *
 * Use this to verify database connectivity before starting development
 * Run with: tsx src/utils/test-db-connection.ts
 */

import { prisma, env } from "../config/index.js";

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...\n");

  try {
    console.log("Environment variables:");
    console.log(`  NODE_ENV: ${env.NODE_ENV}`);
    console.log(`  PORT: ${env.PORT}`);
    console.log(`  Database URL: ${env.DATABASE_URL.split("@")[1] || "..."}\n`);

    // Test Prisma connection
    console.log("Testing Prisma connection...");
    await prisma.$executeRaw`SELECT 1`;
    console.log("✓ Prisma connection successful\n");

    // Count records in database
    console.log("Checking database records...");
    const countryCount = await prisma.country.count();
    const stateCount = await prisma.state.count();
    const districtCount = await prisma.district.count();
    const subDistrictCount = await prisma.subDistrict.count();
    const villageCount = await prisma.village.count();
    const userCount = await prisma.user.count();

    console.log("  Countries: " + countryCount);
    console.log("  States: " + stateCount);
    console.log("  Districts: " + districtCount);
    console.log("  Sub-Districts: " + subDistrictCount);
    console.log("  Villages: " + villageCount);
    console.log("  Users: " + userCount + "\n");

    // Test a query
    console.log("Testing sample query...");
    const country = await prisma.country.findFirst({
      include: {
        states: {
          take: 2,
        },
      },
    });

    if (country) {
      console.log(`✓ Found country: ${country.name}`);
      console.log(`  States in this country: ${country.states.length}\n`);
    } else {
      console.log("⚠ No countries found in database\n");
    }

    console.log("✅ Database connection test passed!");
  } catch (error) {
    console.error("❌ Database connection test failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
