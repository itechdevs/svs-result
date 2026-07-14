import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// GET /api/subjects/grade-levels
export const GET = withHandler(async () => {
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

  return ok(grades);
});
