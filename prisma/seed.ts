import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await hash("schooladmin@.", 10);

  // Admin User
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "sanskarvschool@gmail.com" },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: "sanskarvschool@gmail.com",
        passwordHash,
        role: UserRole.ADMIN,
        name: "Admin Account",
        isActive: true,
        emailVerified: new Date(),
      },
    });
  }
  
  // Secondary Grade Scale
  const secondaryGrades = [
    { minPercent: 90, maxPercent: 100, grade: "A+", gradePoint: 4.0, isNG: false },
    { minPercent: 80, maxPercent: 89.99, grade: "A", gradePoint: 3.6, isNG: false },
    { minPercent: 70, maxPercent: 79.99, grade: "B+", gradePoint: 3.2, isNG: false },
    { minPercent: 60, maxPercent: 69.99, grade: "B", gradePoint: 2.8, isNG: false },
    { minPercent: 50, maxPercent: 59.99, grade: "C+", gradePoint: 2.4, isNG: false },
    { minPercent: 40, maxPercent: 49.99, grade: "C", gradePoint: 2.0, isNG: false },
    { minPercent: 35, maxPercent: 39.99, grade: "D", gradePoint: 1.6, isNG: false },
    { minPercent: 0, maxPercent: 34.99, grade: "NG", gradePoint: 0.0, isNG: true },
  ];

  for (const grade of secondaryGrades) {
    await prisma.secondaryGradeScale.upsert({
      where: {
        minPercent_maxPercent: {
          minPercent: grade.minPercent,
          maxPercent: grade.maxPercent,
        },
      },
      update: grade,
      create: grade,
    });
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
