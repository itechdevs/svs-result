import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

const CATEGORY_ORDER: Record<string, number> = {
  PRE_PRIMARY: 0,
  PRIMARY: 1,
  SECONDARY: 2,
  HIGHER: 3,
};

function getSchoolLevel(
  gradeLevel: string,
  dbMap: Record<string, string>,
): string {
  return dbMap[gradeLevel] ?? "PRIMARY";
}

function compareGradeLevels(
  a: string,
  b: string,
  dbMap: Record<string, string>,
): number {
  const aLevel = getSchoolLevel(a, dbMap);
  const bLevel = getSchoolLevel(b, dbMap);
  const catCmp =
    (CATEGORY_ORDER[aLevel] ?? 4) - (CATEGORY_ORDER[bLevel] ?? 4);
  if (catCmp !== 0) return catCmp;

  const aNum = parseInt(a.match(/\d+/)?.[0] || "999", 10);
  const bNum = parseInt(b.match(/\d+/)?.[0] || "999", 10);
  if (aNum !== bNum) return aNum - bNum;
  return a.localeCompare(b);
}

// GET /api/subjects/grade-levels?withLevel=true&withSection=true
export const GET = withHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const withLevel = searchParams.get("withLevel") === "true";
  const withSection = searchParams.get("withSection") === "true";

  const categories = await prisma.gradeLevelCategory.findMany();
  const dbMap: Record<string, string> = Object.fromEntries(
    categories.map((c) => [c.gradeLevel, c.schoolLevel]),
  );

  if (withSection) {
    const classrooms = await prisma.syncedClassroom.findMany({
      where: { isActive: true },
      select: { name: true, section: true },
      orderBy: [{ name: "asc" }, { section: "asc" }],
    });

    const classSections = classrooms.map((c) => {
      // Avoid duplicating the section when it's already part of the classroom name
      // e.g. "Penguin - B" + "B" → "Penguin - B"  (not "Penguin - B B")
      //      "1"           + "A" → "1 - A"
      const sectionEmbedded = c.name.toUpperCase().endsWith(c.section.toUpperCase());
      const displayName = sectionEmbedded
        ? c.name
        : `${c.name} - ${c.section}`;
      return {
        gradeLevel: c.name,
        section: c.section,
        displayName,
      };
    });

    classSections.sort((a, b) => {
      const gradeCmp = compareGradeLevels(a.gradeLevel, b.gradeLevel, dbMap);
      if (gradeCmp !== 0) return gradeCmp;
      return a.section.localeCompare(b.section);
    });

    if (!withLevel) return ok(classSections);

    return ok(
      classSections.map((item) => ({
        ...item,
        schoolLevel: getSchoolLevel(item.gradeLevel, dbMap),
      })),
    );
  }

  const subjectGrades = await prisma.syncedSubject.findMany({
    where: { isActive: true },
    select: { gradeLevel: true },
    distinct: ["gradeLevel"],
  });

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

  const grades = Array.from(allGrades);
  grades.sort((a, b) => compareGradeLevels(a, b, dbMap));

  if (!withLevel) return ok(grades);

  return ok(
    grades.map((gradeLevel) => ({
      gradeLevel,
      schoolLevel: getSchoolLevel(gradeLevel, dbMap),
    })),
  );
});
