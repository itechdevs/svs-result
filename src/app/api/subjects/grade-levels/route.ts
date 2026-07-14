import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { categorizeGradeLevel } from "@/lib/schemas";

// GET /api/subjects/grade-levels?withLevel=true
export const GET = withHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const withLevel = searchParams.get("withLevel") === "true";

  // Fetch actual grade levels from synced students (primary source)
  const studentGrades = await prisma.syncedStudent.findMany({
    where: { isActive: true },
    select: { class: true },
    distinct: ["class"],
  });

  // Fetch grade levels from synced subjects (secondary source)
  const subjectGrades = await prisma.syncedSubject.findMany({
    where: { isActive: true },
    select: { gradeLevel: true },
    distinct: ["gradeLevel"],
  });

  // Combine and deduplicate
  const allGrades = new Set<string>();

  studentGrades.forEach((s) => {
    if (s.class) allGrades.add(s.class);
  });

  subjectGrades.forEach((s) => {
    if (s.gradeLevel) allGrades.add(s.gradeLevel);
  });

  // Convert to array and sort
  const grades = Array.from(allGrades).sort((a, b) => {
    // Custom sort: Pre-primary first, then numeric grades
    const aIsPrePrimary = /rabbit|penguin|panda|giraffe/i.test(a);
    const bIsPrePrimary = /rabbit|penguin|panda|giraffe/i.test(b);

    if (aIsPrePrimary && !bIsPrePrimary) return -1;
    if (!aIsPrePrimary && bIsPrePrimary) return 1;
    if (aIsPrePrimary && bIsPrePrimary) return a.localeCompare(b);

    // Extract numeric values for proper sorting
    const aNum = parseInt(a.match(/\d+/)?.[0] || "999");
    const bNum = parseInt(b.match(/\d+/)?.[0] || "999");

    return aNum - bNum;
  });

  if (!withLevel) return ok(grades);

  // Enrich with school level from DB or fallback
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
