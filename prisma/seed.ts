import { PrismaClient, UserRole, GradeType } from "@prisma/client";
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
      name: "Dipak Giri",
      isActive: true,
    },
  });

  // Teacher User
  await prisma.user.create({
    data: {
      email: "teacher@school.com",
      passwordHash,
      role: UserRole.TEACHER,
      name: "Dipak Giri",
      isActive: true,
      emailVerified: new Date(),
      syncedTeacherId: syncedTeacher.id,
    },
  });

  // Synced Subject (mathematics) assigned to the teacher
  const mathSubject = await prisma.syncedSubject.create({
    data: {
      sourceId: "S1",
      name: "mathematics",
      code: "MATH",
      gradeLevel: "KG",
      teachers: { connect: { id: syncedTeacher.id } },
      isActive: true,
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
