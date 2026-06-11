import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Check existing users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      emailVerified: true,
      isActive: true,
    },
  });

  console.log("Current users:");
  users.forEach(u => {
    console.log(`- ${u.email}: verified=${u.emailVerified ? '✓' : '✗'}, active=${u.isActive ? '✓' : '✗'}`);
  });

  // Update all users to be verified
  const result = await prisma.user.updateMany({
    where: {
      emailVerified: null,
    },
    data: {
      emailVerified: new Date(),
    },
  });

  console.log(`\n✅ Updated ${result.count} user(s) to verified status`);

  // Verify update
  const updated = await prisma.user.findMany({
    where: {
      OR: [
        { email: "teacher@school.com" },
        { email: "admin@school.com" },
      ],
    },
    select: {
      email: true,
      emailVerified: true,
    },
  });

  console.log("\nAfter update:");
  updated.forEach(u => {
    console.log(`- ${u.email}: ${u.emailVerified ? '✓ Verified' : '✗ Not verified'}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
