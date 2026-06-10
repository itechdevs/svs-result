import { withHandler } from "@/lib/handlers";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";

// GET /api/students/[id]
export const GET = withHandler(async (_req, { params }) => {
  const student = await prisma.syncedStudent.findUnique({
    where: { id: params.id },
    include: {
      finalResults: {
        where: { isPublished: true },
        select: {
          id: true,
          resultStatus: true,
          percentage: true,
          cgpa: true,
          classRank: true,
          publishedAt: true,
          academicYear: { select: { id: true, name: true } },
        },
        orderBy: { computedAt: "desc" },
      },
    },
  });
  if (!student) return notFound("Student not found");
  return ok(student);
});
