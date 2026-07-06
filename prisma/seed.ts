import { PrismaClient, UserRole, SecondaryComponentType } from "@prisma/client";
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
  // Use deleteMany + createMany for idempotency (avoids Decimal precision mismatch in upsert)
  await prisma.secondaryGradeScale.deleteMany();

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
    await prisma.secondaryGradeScale.create({ data: grade });
  }

  // Seed Higher Level Classes (Grades 6-10) - Mathematics
  console.log("🌱 Seeding higher level classes (Grades 6-10)...");

  // Create Academic Year 2083 BS
  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2083 BS" },
    update: {},
    create: {
      name: "2083 BS",
      startDate: new Date("2024-04-13"),
      endDate: new Date("2025-04-12"),
      isCurrent: true,
    },
  });

  // Subject name pattern for Mathematics
  const subjectNames = ["Mathematics"];
  const grades = [6, 7, 8, 9, 10];

  for (const subjectName of subjectNames) {
    for (const grade of grades) {
      const gradeLevel = String(grade);
      const displayName = `${subjectName} - Grade ${grade}`;
      const code = `${subjectName.substring(0, 3).toUpperCase()}${grade}`;

      // Create or get SyncedSubject
      const syncedSubject = await prisma.syncedSubject.upsert({
        where: { sourceId: `secondary-${code}` },
        update: {},
        create: {
          sourceId: `secondary-${code}`,
          name: displayName,
          code,
          gradeLevel,
          isActive: true,
        },
      });

      // Create SecondarySubjectConfig
      const secondaryConfig = await prisma.secondarySubjectConfig.upsert({
        where: {
          syncedSubjectId_academicYearId_gradeLevel: {
            syncedSubjectId: syncedSubject.id,
            academicYearId: academicYear.id,
            gradeLevel,
          },
        },
        update: {},
        create: {
          syncedSubjectId: syncedSubject.id,
          academicYearId: academicYear.id,
          gradeLevel,
          creditHours: 4,
          isActive: true,
          components: {
            create: [
              {
                type: SecondaryComponentType.THEORY,
                fullMarks: 70,
                passMarks: 28,
                displayOrder: 1,
              },
              {
                type: SecondaryComponentType.INTERNAL,
                fullMarks: 30,
                passMarks: 12,
                displayOrder: 2,
              },
            ],
          },
        },
        include: { components: true },
      });

      // Create terms (Exams) and term weights (3 terms: ~33.33% each)
      const termNames = [
        { name: "First Term", weightPercent: 33.33, displayOrder: 1 },
        { name: "Second Term", weightPercent: 33.34, displayOrder: 2 },
        { name: "Third Term", weightPercent: 33.33, displayOrder: 3 },
      ];

      for (const term of termNames) {
        // Create the Exam record for this term
        const termExam = await prisma.exam.upsert({
          where: {
            academicYearId_gradeLevel_name: {
              academicYearId: academicYear.id,
              gradeLevel,
              name: `${term.name} - Grade ${grade}`,
            },
          },
          update: {},
          create: {
            name: `${term.name} - Grade ${grade}`,
            academicYearId: academicYear.id,
            gradeLevel,
            description: `${term.name} Examination for Grade ${grade}`,
          },
        });

        // Create term weight linking to the exam
        await prisma.secondaryTermWeight.upsert({
          where: {
            academicYearId_gradeLevel_examId: {
              academicYearId: academicYear.id,
              gradeLevel,
              examId: termExam.id,
            },
          },
          update: {},
          create: {
            academicYearId: academicYear.id,
            gradeLevel,
            examId: termExam.id,
            termName: term.name,
            weightPercent: term.weightPercent,
            displayOrder: term.displayOrder,
          },
        });
      }

      console.log(`  ✓ Created ${displayName} config`);
    }
  }

  // Assign all existing teachers to Mathematics subjects
  const existingTeachers = await prisma.syncedTeacher.findMany({
    where: { isActive: true },
  });

  const allMathSubjects = await prisma.syncedSubject.findMany({
    where: {
      sourceId: { startsWith: "secondary-MAT" },
    },
  });

  if (existingTeachers.length > 0 && allMathSubjects.length > 0) {
    console.log(`  📋 Assigning ${existingTeachers.length} teachers to ${allMathSubjects.length} Mathematics subjects...`);

    for (const subject of allMathSubjects) {
      const teacherIds = existingTeachers.map((t) => t.id);
      await prisma.syncedSubject.update({
        where: { id: subject.id },
        data: {
          teachers: {
            set: teacherIds.map((id) => ({ id })),
          },
        },
      });
    }
    console.log(`  ✓ Assigned ${existingTeachers.length} teachers to all Mathematics subjects`);
  } else {
    console.log(`  ⚠️ No teachers (${existingTeachers.length}) or no Math subjects (${allMathSubjects.length}) found for assignment`);
  }

  console.log("✅ Higher level classes seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
