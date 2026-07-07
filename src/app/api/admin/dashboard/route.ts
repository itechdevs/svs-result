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
      evaluationStatusBreakdown,
      reExamStats,
      published,
      marksheetsGenerated,
      classGpaRows,
    ] = await Promise.all([
      prisma.syncedStudent.count({ where: { isActive: true } }),

      prisma.user.count({ where: { role: "TEACHER", isActive: true } }),

      prisma.finalResult.groupBy({
        by: ["resultStatus"],
        where: { academicYearId: year.id },
        _count: { resultStatus: true },
      }),

      // Combine DRAFT + SUBMITTED evaluation counts into one groupBy
      prisma.studentEvaluationResult.groupBy({
        by: ["status"],
        where: {
          status: { in: ["DRAFT", "SUBMITTED"] },
          evaluationTemplate: {
            gradeConfig: { academicYearId: year.id },
          },
        },
        _count: { status: true },
      }),

      prisma.reExamSchedule.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      prisma.finalResult.count({
        where: { academicYearId: year.id, isPublished: true },
      }),

      prisma.marksheet.count({
        where: { academicYearId: year.id },
      }),

      // Single aggregation query for class-wise GPA
      prisma.$queryRaw<
        { class: string; avgCgpa: number | null; studentCount: bigint }[]
      >`
        SELECT s."class", AVG(fr."cgpa") as "avgCgpa", COUNT(*)::int as "studentCount"
        FROM "final_results" fr
        INNER JOIN "synced_students" s ON s.id = fr."syncedStudentId"
        WHERE fr."academicYearId" = ${year.id}
        GROUP BY s."class"
        ORDER BY s."class"
      `,
    ]);

    const totalCount = resultStatusBreakdown.reduce(
      (sum, r) => sum + r._count.resultStatus,
      0,
    );

    const passCount =
      resultStatusBreakdown.find((r) => r.resultStatus === "PROMOTED")
        ?._count.resultStatus ?? 0;
    const failCount =
      resultStatusBreakdown.find((r) => r.resultStatus === "FAILED")
        ?._count.resultStatus ?? 0;

    const pendingSubmission =
      evaluationStatusBreakdown.find((r) => r.status === "DRAFT")
        ?._count.status ?? 0;
    const pendingVerification =
      evaluationStatusBreakdown.find((r) => r.status === "SUBMITTED")
        ?._count.status ?? 0;

    const reExamTotal = reExamStats.reduce(
      (sum, r) => sum + r._count.status,
      0,
    );

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
      classPerformance: classGpaRows.map((r) => ({
        grade: r.class,
        averageGpa: r.avgCgpa
          ? Math.round(Number(r.avgCgpa) * 100) / 100
          : 0,
        studentCount: Number(r.studentCount),
      })),
    });
  },
  ["ADMIN"],
);
