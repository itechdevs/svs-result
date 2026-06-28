import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/dashboard?academicYearId=
export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId") ?? undefined;

    const year = academicYearId
      ? await prisma.academicYear.findUnique({ where: { id: academicYearId } })
      : await prisma.academicYear.findFirst({ where: { isCurrent: true } });

    if (!year) {
      return notFound("No academic year configured");
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

    const reExamTotal = await prisma.reExamSchedule.count();

    const finalResultsWithClass = await prisma.finalResult.findMany({
      where: { academicYearId: year.id },
      select: {
        resultStatus: true,
        cgpa: true,
        syncedStudent: { select: { class: true } },
      },
    });

    const classGpaMap = new Map<string, { sumCgpa: number; count: number }>();
    let passCount = 0;
    let failCount = 0;

    for (const fr of finalResultsWithClass) {
      const cls = fr.syncedStudent.class;
      if (fr.resultStatus === "PROMOTED") passCount++;
      else if (fr.resultStatus === "FAILED") failCount++;

      if (fr.cgpa) {
        const entry = classGpaMap.get(cls) ?? { sumCgpa: 0, count: 0 };
        entry.sumCgpa += Number(fr.cgpa);
        entry.count += 1;
        classGpaMap.set(cls, entry);
      }
    }

    const totalCount = finalResultsWithClass.length;
    const classPerformance = Array.from(classGpaMap.entries())
      .map(([grade, { sumCgpa, count }]) => ({
        grade,
        averageGpa: Math.round((sumCgpa / count) * 100) / 100,
        studentCount: count,
      }))
      .sort((a, b) => a.grade.localeCompare(b.grade));

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
        passCount,
        failCount,
        totalCount,
        passPercentage:
          totalCount > 0
            ? Math.round((passCount / totalCount) * 1000) / 10
            : 0,
        failPercentage:
          totalCount > 0
            ? Math.round((failCount / totalCount) * 1000) / 10
            : 0,
        published,
        marksheetsGenerated,
      },
      evaluations: {
        pendingSubmission,
        pendingVerification,
      },
      reExams: {
        total: reExamTotal,
        byStatus: Object.fromEntries(
          reExamStats.map((r) => [r.status, r._count.status]),
        ),
      },
      classPerformance,
    });
  },
  ["ADMIN"],
);
