import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { listTeacherCompilationsSchema } from "@/lib/schemas";

export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = listTeacherCompilationsSchema.parse({
      syncedSubjectId: searchParams.get("syncedSubjectId") ?? undefined,
      academicYearId: searchParams.get("academicYearId") ?? undefined,
      gradeLevel: searchParams.get("gradeLevel") ?? undefined,
      examId: searchParams.get("examId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    const where: Record<string, unknown> = {};
    if (query.syncedSubjectId) where.syncedSubjectId = query.syncedSubjectId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.gradeLevel) where.gradeLevel = query.gradeLevel;
    if (query.examId) where.examId = query.examId;
    if (query.status) where.status = query.status;

    const compilations = await (prisma.teacherSubjectCompilation as any).findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true, gradeLevel: true } },
        academicYear: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        results: {
          include: {
            student: { select: { id: true, name: true, rollNumber: true, class: true, section: true } },
          },
        },
      },
      orderBy: { computedAt: "desc" },
    });

    return ok(compilations);
  },
  ["ADMIN"]
);
