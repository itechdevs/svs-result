import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/dashboard?academicYearId=
export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId") ?? undefined;

    // If no year specified, use current
    const year = academicYearId
      ? await prisma.academicYear.findUnique({ where: { id: academicYearId } })
      : await prisma.academicYear.findFirst({ where: { isCurrent: true } });

    if (!year) {
      return ok({ message: "No academic year configured" });
    }

    const [
      totalStudents,
      totalTeachers,
      resultStatusBreakdown,
      pendingVerification,
      pendingSubmission,
      reExamStats,
      gradeBreakdown,
    ] = await Promise.all([
      prisma.syncedStudent.count({ where: { isActive: true } }),

      prisma.user.count({ where: { role: "TEACHER", isActive: true } }),

      prisma.finalResult.groupBy({
        by: ["resultStatus"],
        where: { academicYearId: year.id },
        _count: { resultStatus: true },
      }),

      prisma.studentEvaluationResult.count({
        where: {
          status: "SUBMITTED",
          evaluationTemplate: {
            gradeConfig: { academicYearId: year.id },
          },
        },
      }),

      prisma.studentEvaluationResult.count({
        where: {
          status: "DRAFT",
          evaluationTemplate: {
            gradeConfig: { academicYearId: year.id },
          },
        },
      }),

      prisma.reExamSchedule.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      prisma.finalResult.groupBy({
        by: ["resultStatus"],
        where: {
          academicYearId: year.id,
          syncedStudent: { isNot: undefined },
        },
        _count: { id: true },
      }),
    ]);

    const published = await prisma.finalResult.count({
      where: { academicYearId: year.id, isPublished: true },
    });

    const marksheetsGenerated = await prisma.marksheet.count({
      where: { academicYearId: year.id },
    });

    return ok({
      academicYear: { id: year.id, name: year.name },
      students: { total: totalStudents },
      teachers: { total: totalTeachers },
      results: {
        byStatus: Object.fromEntries(
          resultStatusBreakdown.map((r) => [
            r.resultStatus,
            r._count.resultStatus,
          ]),
        ),
        published,
        marksheetsGenerated,
      },
      evaluations: {
        pendingSubmission,
        pendingVerification,
      },
      reExams: Object.fromEntries(
        reExamStats.map((r) => [r.status, r._count.status]),
      ),
    });
  },
  ["ADMIN"],
);
