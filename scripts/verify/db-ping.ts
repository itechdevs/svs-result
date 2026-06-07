#!/usr/bin/env tsx
/**
 * scripts/verify/db-ping.ts
 * Run: npm run verify:db
 *
 * Verifies the DATABASE_URL connects successfully.
 * Must pass before proceeding to Phase 3 (Architect).
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

async function main() {
  console.log("🔌 DB Ping — verifying database connection...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1 AS ping`;
    console.log("✅ Database connection successful");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
