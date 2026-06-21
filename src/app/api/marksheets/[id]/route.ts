import { withHandler } from "@/lib/handlers";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";

// GET /api/marksheets/[id]
export const GET = withHandler(
  async (_req, { params }) => {
    const marksheet = await prisma.marksheet.findUnique({
      where: { id: params.id },
      include: {
        syncedStudent: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            class: true,
            section: true,
          },
        },
        academicYear: { select: { id: true, name: true } },
        finalResult: {
          select: {
            resultStatus: true,
            isPublished: true,
            classRank: true,
            percentage: true,
            cgpa: true,
          },
        },
        generatedBy: { select: { id: true, name: true } },
      },
    });

    if (!marksheet) return notFound("Marksheet not found");
    return ok(marksheet);
  },
  ["ADMIN"],
);
