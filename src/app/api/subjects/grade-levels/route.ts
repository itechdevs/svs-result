import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// GET /api/subjects/grade-levels
export const GET = withHandler(async () => {
  const gradeLevels = await prisma.syncedSubject.findMany({
    where: { isActive: true },
    select: { gradeLevel: true },
    distinct: ["gradeLevel"],
    orderBy: { gradeLevel: "asc" },
  });

  return ok(gradeLevels.map((g) => g.gradeLevel));
});
