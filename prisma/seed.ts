import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password", 10);

  await prisma.user.upsert({
    where: { email: "teacher@school.com" },
    update: {},
    create: {
      email: "teacher@school.com",
      name: "Test Teacher",
      passwordHash,
      role: "TEACHER",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      email: "admin@school.com",
      name: "Test Admin",
      passwordHash,
      role: "ADMIN",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log("✅ Seed complete: teacher@school.com and admin@school.com (both verified)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
