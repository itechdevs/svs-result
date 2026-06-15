import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await hash("password123", 10);

  // Admin User
  await prisma.user.create({
    data: {
      email: "admin@school.com",
      passwordHash,
      role: UserRole.ADMIN,
      name: "Admin User",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  // Synced Teacher
  const syncedTeacher = await prisma.syncedTeacher.create({
    data: {
      sourceId: "T1",
      name: "Teacher User",
      isActive: true,
    },
  });

  // Teacher User
  await prisma.user.create({
    data: {
      email: "teacher@school.com",
      passwordHash,
      role: UserRole.TEACHER,
      name: "Teacher User",
      isActive: true,
      emailVerified: new Date(),
      syncedTeacherId: syncedTeacher.id,
    },
  });

  console.log("✅ Seed complete!");
  console.log("\nLogin credentials:");
  console.log("Admin: admin@school.com / password123");
  console.log("Teacher: teacher@school.com / password123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
