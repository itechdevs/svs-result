/**
 * POST /api/admin/aggregation
 *
 * ADMIN triggers this to compute:
 *   1. effectiveMarks per StudentEvaluationResult (LOCK step)
 *   2. SubjectResult per student per subject (weighted aggregate)
 *   3. FinalResult per student (CGPA, overall status)
 *
 * Prerequisite: all StudentEvaluationResults for the grade must be VERIFIED.
 */
import { NextRequest } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { badRequest, ok, unprocessable } from "@/lib/response";
import { aggregateResultsSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

export const POST = withHandler(
  async (req: NextRequest) => {
    const body = aggregateResultsSchema.parse(await req.json());

    // 1. Verify all results are VERIFIED (none in DRAFT/SUBMITTED)
    const pendingCount = await prisma.studentEvaluationResult.count({
      where: {
        status: { in: ["DRAFT", "SUBMITTED"] },
        evaluationTemplate: {
          gradeConfig: {
            academicYearId: body.academicYearId,
            gradeLevel: body.gradeLevel,
          },
        },
        ...(body.syncedStudentIds && {
          syncedStudentId: { in: body.syncedStudentIds },
        }),
      },
    });

    if (pendingCount > 0) {
      return unprocessable(
        `${pendingCount} result(s) are still DRAFT or SUBMITTED. All must be VERIFIED before aggregation.`,
      );
    }

    // 2. Fetch all verified evaluation results for the grade + year
    const evaluationResults = await prisma.studentEvaluationResult.findMany({
      where: {
        status: "VERIFIED",
        evaluationTemplate: {
          gradeConfig: {
            academicYearId: body.academicYearId,
            gradeLevel: body.gradeLevel,
          },
        },
        ...(body.syncedStudentIds && {
          syncedStudentId: { in: body.syncedStudentIds },
        }),
      },
      include: {
        evaluationTemplate: {
          select: {
            id: true,
            syncedSubjectId: true,
            fullMarks: true,
            passMarks: true,
            weightage: true,
          },
        },
        reExamResult: {
          select: { marksObtained: true, isPassed: true, status: true },
        },
      },
    });

    if (evaluationResults.length === 0) {
      return badRequest("No verified results found for this grade/year");
    }

    // 3. Fetch grade config for grade scale lookup
    const gradeConfig = await prisma.gradeConfig.findUnique({
      where: {
        academicYearId_gradeLevel: {
          academicYearId: body.academicYearId,
          gradeLevel: body.gradeLevel,
        },
      },
      include: {
        gradeScales: { orderBy: { minPercent: "asc" } },
      },
    });

    const lookupGrade = (percent: number) => {
      if (!gradeConfig) return { grade: null, gradePoint: null };
      const scale = gradeConfig.gradeScales.find(
        (s) =>
          percent >= Number(s.minPercent) && percent <= Number(s.maxPercent),
      );
      return {
        grade: scale?.grade ?? null,
        gradePoint: scale?.gradePoint ?? null,
      };
    };

    // 4. Group by student, then by subject
    type EvalRow = (typeof evaluationResults)[number];
    const byStudent = new Map<string, EvalRow[]>();

    for (const r of evaluationResults) {
      const list = byStudent.get(r.syncedStudentId) ?? [];
      list.push(r);
      byStudent.set(r.syncedStudentId, list);
    }

    const now = new Date();
    const lockOps: ReturnType<typeof prisma.studentEvaluationResult.update>[] =
      [];
    const subjectResultOps: ReturnType<typeof prisma.subjectResult.upsert>[] =
      [];

    const studentSummaries: {
      syncedStudentId: string;
      subjects: { isPassed: boolean; gradePoint: number | null }[];
    }[] = [];

    for (const [syncedStudentId, results] of byStudent) {
      const bySubject = new Map<string, EvalRow[]>();
      for (const r of results) {
        const list = bySubject.get(r.evaluationTemplate.syncedSubjectId) ?? [];
        list.push(r);
        bySubject.set(r.evaluationTemplate.syncedSubjectId, list);
      }

      const subjectSummaries: {
        isPassed: boolean;
        gradePoint: number | null;
      }[] = [];

      for (const [syncedSubjectId, subjectResults] of bySubject) {
        let totalWeightedObtained = 0;
        let totalFullMarks = 0;
        let failedEvaluations = 0;

        for (const r of subjectResults) {
          // Compute effectiveMarks (best of original and re-exam)
          let effectiveMarks = r.isAbsent
            ? new Decimal(0)
            : (r.marksObtained ?? new Decimal(0));
          let isPassed = r.isPassed ?? false;

          if (
            r.reExamResult &&
            r.reExamResult.status === "VERIFIED" &&
            r.reExamResult.marksObtained > effectiveMarks
          ) {
            effectiveMarks = r.reExamResult.marksObtained;
            isPassed = r.reExamResult.isPassed;
          }

          if (!isPassed) failedEvaluations++;

          const weight = Number(r.evaluationTemplate.weightage) / 100;
          totalWeightedObtained +=
            (Number(effectiveMarks) / Number(r.evaluationTemplate.fullMarks)) *
            Number(r.evaluationTemplate.fullMarks) *
            weight;
          totalFullMarks += Number(r.evaluationTemplate.fullMarks) * weight;

          lockOps.push(
            prisma.studentEvaluationResult.update({
              where: { id: r.id },
              data: { effectiveMarks, status: "LOCKED" },
            }),
          );
        }

        const obtainedMarks = new Decimal(totalWeightedObtained.toFixed(2));
        const fullMarks = new Decimal(totalFullMarks.toFixed(2));
        const percentage = fullMarks.isZero()
          ? new Decimal(0)
          : obtainedMarks.div(fullMarks).mul(100);

        const { grade, gradePoint } = lookupGrade(Number(percentage));
        const isPassed = failedEvaluations === 0;

        subjectResultOps.push(
          prisma.subjectResult.upsert({
            where: {
              syncedStudentId_syncedSubjectId_academicYearId: {
                syncedStudentId,
                syncedSubjectId,
                academicYearId: body.academicYearId,
              },
            },
            create: {
              syncedStudentId,
              syncedSubjectId,
              academicYearId: body.academicYearId,
              totalFullMarks: fullMarks,
              obtainedMarks,
              percentage,
              grade,
              gradePoint: gradePoint ? new Decimal(gradePoint) : null,
              isPassed,
              failedEvaluations,
              computedAt: now,
            },
            update: {
              totalFullMarks: fullMarks,
              obtainedMarks,
              percentage,
              grade,
              gradePoint: gradePoint ? new Decimal(gradePoint) : null,
              isPassed,
              failedEvaluations,
              updatedAt: now,
            },
          }),
        );

        subjectSummaries.push({
          isPassed,
          gradePoint: gradePoint ? Number(gradePoint) : null,
        });
      }

      studentSummaries.push({ syncedStudentId, subjects: subjectSummaries });
    }

    // 5. Execute all lock + subject result ops in one transaction
    await prisma.$transaction([...lockOps, ...subjectResultOps]);

    // 6. Compute FinalResults
    const finalResultOps = studentSummaries.map(
      ({ syncedStudentId, subjects }) => {
        const passedSubjects = subjects.filter((s) => s.isPassed).length;
        const failedSubjects = subjects.length - passedSubjects;
        const cgpa = subjects.every((s) => s.gradePoint !== null)
          ? subjects.reduce((sum, s) => sum + (s.gradePoint ?? 0), 0) /
            subjects.length
          : null;

        let resultStatus: "PROMOTED" | "FAILED" | "PROBATION" =
          failedSubjects === 0
            ? "PROMOTED"
            : failedSubjects === subjects.length
              ? "FAILED"
              : "PROBATION";

        return prisma.finalResult.upsert({
          where: {
            syncedStudentId_academicYearId: {
              syncedStudentId,
              academicYearId: body.academicYearId,
            },
          },
          create: {
            syncedStudentId,
            academicYearId: body.academicYearId,
            totalSubjects: subjects.length,
            passedSubjects,
            failedSubjects,
            percentage: new Decimal(
              ((passedSubjects / subjects.length) * 100).toFixed(2),
            ),
            cgpa: cgpa ? new Decimal(cgpa.toFixed(2)) : null,
            resultStatus,
            computedAt: now,
          },
          update: {
            totalSubjects: subjects.length,
            passedSubjects,
            failedSubjects,
            percentage: new Decimal(
              ((passedSubjects / subjects.length) * 100).toFixed(2),
            ),
            cgpa: cgpa ? new Decimal(cgpa.toFixed(2)) : null,
            resultStatus,
            updatedAt: now,
          },
        });
      },
    );

    await prisma.$transaction(finalResultOps);

    return ok(
      {
        studentsProcessed: studentSummaries.length,
        subjectResultsComputed: subjectResultOps.length,
      },
      "Aggregation complete",
    );
  },
  ["ADMIN"],
);
