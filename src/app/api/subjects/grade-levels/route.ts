import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { categorizeGradeLevel } from "@/lib/schemas";

// GET /api/subjects/grade-levels?withLevel=true&withSection=true
export const GET = withHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const withLevel = searchParams.get("withLevel") === "true";
  const withSection = searchParams.get("withSection") === "true";

  if (withSection) {
    // SyncedClassroom is the authoritative source — populated on every student
    // sync event so it always reflects the actual classes in the school system.
    const classrooms = await prisma.syncedClassroom.findMany({
      where: { isActive: true },
      select: { name: true, section: true },
      orderBy: [{ name: "asc" }, { section: "asc" }],
    });

    const classSections = classrooms.map((c) => ({
      gradeLevel: c.name,
      section: c.section,
      displayName: `${c.name} ${c.section}`.trim(),
    }));

    // Sort: Pre-primary first, then numeric, then alphabetically, then by section
    classSections.sort((a, b) => {
      const aIsPrePrimary = /rabbit|penguin|panda|giraffe/i.test(a.gradeLevel);
      const bIsPrePrimary = /rabbit|penguin|panda|giraffe/i.test(b.gradeLevel);

      if (aIsPrePrimary && !bIsPrePrimary) return -1;
      if (!aIsPrePrimary && bIsPrePrimary) return 1;
      if (aIsPrePrimary && bIsPrePrimary) {
        const gradeCmp = a.gradeLevel.localeCompare(b.gradeLevel);
        return gradeCmp !== 0 ? gradeCmp : a.section.localeCompare(b.section);
      }

      const aNum = parseInt(a.gradeLevel.match(/\d+/)?.[0] || "999");
      const bNum = parseInt(b.gradeLevel.match(/\d+/)?.[0] || "999");
      if (aNum !== bNum) return aNum - bNum;
      return a.section.localeCompare(b.section);
    });

    if (!withLevel) return ok(classSections);

    const categories = await prisma.gradeLevelCategory.findMany();
    const dbMap = Object.fromEntries(
      categories.map((c) => [c.gradeLevel, c.schoolLevel]),
    );

    return ok(
      classSections.map((item) => ({
        ...item,
        schoolLevel:
          dbMap[item.gradeLevel] ?? categorizeGradeLevel(item.gradeLevel),
      })),
    );
  }

  // ── Default (no withSection): flat array of distinct grade name strings ──────
  // Still derived from SyncedSubject + clean student data for backwards compat.
  const subjectGrades = await prisma.syncedSubject.findMany({
    where: { isActive: true },
    select: { gradeLevel: true },
    distinct: ["gradeLevel"],
  });

  // Also pull unique grade names from SyncedClassroom for completeness
  const classroomGrades = await prisma.syncedClassroom.findMany({
    where: { isActive: true },
    select: { name: true },
    distinct: ["name"],
  });

  const allGrades = new Set<string>();

  subjectGrades.forEach((s) => {
    if (s.gradeLevel) allGrades.add(s.gradeLevel);
  });

  classroomGrades.forEach((c) => {
    if (c.name) allGrades.add(c.name);
  });

  const grades = Array.from(allGrades).sort((a, b) => {
    const aIsPrePrimary = /rabbit|penguin|panda|giraffe/i.test(a);
    const bIsPrePrimary = /rabbit|penguin|panda|giraffe/i.test(b);

    if (aIsPrePrimary && !bIsPrePrimary) return -1;
    if (!aIsPrePrimary && bIsPrePrimary) return 1;
    if (aIsPrePrimary && bIsPrePrimary) return a.localeCompare(b);

    const aNum = parseInt(a.match(/\d+/)?.[0] || "999");
    const bNum = parseInt(b.match(/\d+/)?.[0] || "999");

    return aNum - bNum;
  });

  if (!withLevel) return ok(grades);

  const categories = await prisma.gradeLevelCategory.findMany();
  const dbMap = Object.fromEntries(
    categories.map((c) => [c.gradeLevel, c.schoolLevel]),
  );

  return ok(
    grades.map((gradeLevel) => ({
      gradeLevel,
      schoolLevel: dbMap[gradeLevel] ?? categorizeGradeLevel(gradeLevel),
    })),
  );
});
