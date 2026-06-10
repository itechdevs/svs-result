import { withHandler } from "@/lib/handlers";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";

// GET /api/subjects/[id]
export const GET = withHandler(async (_req, { params }) => {
  const subject = await prisma.syncedSubject.findUnique({
    where: { id: params.id },
    include: {
      evaluationTemplates: {
        where: { isActive: true, deletedAt: null },
        include: {
          gradeConfig: {
            select: {
              gradeLevel: true,
              academicYear: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { displayOrder: "asc" },
      },
    },
  });
  if (!subject) return notFound("Subject not found");
  return ok(subject);
});
