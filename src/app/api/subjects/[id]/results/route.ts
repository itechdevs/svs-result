import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// GET /api/subjects/[id]/results?academicYearId=&gradeLevel=
export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { searchParams } = new URL(req.url);
  const academicYearId = searchParams.get("academicYearId") ?? undefined;
  const gradeLevel = searchParams.get("gradeLevel") ?? undefined;

  const subject = await prisma.syncedSubject.findUnique({
    where: { id: params.id },
  });
  if (!subject) return notFound("Subject not found");

  const subjectResults = await prisma.subjectResult.findMany({
    where: {
      syncedSubjectId: params.id,
      ...(academicYearId && { academicYearId }),
      ...(gradeLevel && {
        syncedStudent: { class: gradeLevel },
      }),
    },
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
    },
    orderBy: { percentage: "desc" },
  });

  return ok({ subject, subjectResults });
});
