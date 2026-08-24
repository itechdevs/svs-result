import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { calculateExam } from "@/lib/secondary-calculator";
import type { SubjectInput, ComponentInput } from "@/lib/secondary-calculator";

/**
 * POST /api/admin/secondary/exams/[examId]/compile
 *
 * NEB v2 Credit-Hour-Based Calculation:
 *   Component % = (obtained / fullMarks) × 100
 *   Component GP = lookup(%, NEB_v2_scale)
 *   Subject GPA  = Σ(comp.GP × comp.creditHour) / Σ(comp.creditHour)
 *   Overall GPA  = Σ(all comp.GP × comp.creditHour) / Σ(all comp.creditHour)
 *
 * Term-to-term blending via weightage is NOT applied here.
 * Each exam is a fully self-contained calculation.
 */
export const POST = withHandler(
  async (_req: NextRequest, { params }) => {
    const { examId } = await params;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return notFound("Exam not found");

    // Fetch subject configs with per-component creditHour
    const subjectConfigs = await prisma.secondarySubjectConfig.findMany({
      where: {
        academicYearId: exam.academicYearId,
        gradeLevel: exam.gradeLevel,
        isActive: true,
      },
      include: { components: true },
    });

    if (subjectConfigs.length === 0) {
      return badRequest(
        "No active secondary subject configurations found for this exam's grade level and academic year.",
      );
    }

    const configIds = subjectConfigs.map((sc) => sc.id);

    // Fetch all verified component marks for this exam
    const componentMarks = await prisma.secondaryComponentMark.findMany({
      where: {
        examId: examId,
        component: { subjectConfigId: { in: configIds } },
      },
      include: { component: true },
    });

    // Separate verified vs unverified
    const verifiedMarks = componentMarks.filter((m) => m.status === "VERIFIED");
    const unverifiedMarks = componentMarks.filter((m) => m.status !== "VERIFIED");

    // Skip students who have ANY unverified marks (compile only clean students)
    const unverifiedStudentIds = new Set(unverifiedMarks.map(m => m.syncedStudentId));

    // Group verified marks by student — only students with at least 1 verified mark
    const studentMarksMap = new Map<string, typeof verifiedMarks>();
    for (const mark of verifiedMarks) {
      if (unverifiedStudentIds.has(mark.syncedStudentId)) continue;
      if (!studentMarksMap.has(mark.syncedStudentId)) {
        studentMarksMap.set(mark.syncedStudentId, []);
      }
      studentMarksMap.get(mark.syncedStudentId)!.push(mark);
    }

    if (studentMarksMap.size === 0) {
      return badRequest("No students with fully verified marks found. Please verify all marks before compilation.");
    }

    const termResultsData: any[] = [];
    const subjectResultsData: any[] = [];

    for (const [studentId, marks] of studentMarksMap.entries()) {
      // Build SubjectInput[] for the NEB v2 calculator
      const subjectInputs: SubjectInput[] = subjectConfigs.map((config) => {
        const components: ComponentInput[] = config.components.map((comp) => {
          const markRow = marks.find((m) => m.componentId === comp.id);
          const obtained = markRow
            ? markRow.isAbsent
              ? null
              : Number(markRow.marksObtained ?? 0)
            : null; // no mark entered = treat as absent

          return {
            componentId: comp.id,
            type: comp.type as "THEORY" | "PRACTICAL" | "INTERNAL",
            fullMarks: Number(comp.fullMarks),
            passMarks: Number(comp.passMarks),
            // NEB v2: use the per-component credit hour
            creditHour: Number(comp.creditHour ?? 1),
            obtained,
          };
        });

        return {
          subjectConfigId: config.id,
          subjectName: config.id, // name resolved later from syncedSubject
          components,
        };
      });

      // Run NEB v2 calculation (all within this exam only)
      const examResult = calculateExam(subjectInputs);

      // Collect subject results
      for (const subResult of examResult.subjects) {
        const theoryMarks = subResult.components
          .filter((c) => c.type === "THEORY")
          .reduce((s, c) => s + (c.obtained ?? 0), 0);
        const practicalMarks = subResult.components
          .filter((c) => c.type === "PRACTICAL")
          .reduce((s, c) => s + (c.obtained ?? 0), 0);

        subjectResultsData.push({
          syncedStudentId: studentId,
          subjectConfigId: subResult.subjectConfigId,
          examId: exam.id,
          theoryMarks,
          practicalMarks,
          totalObtained: subResult.totalObtained,
          totalFullMarks: subResult.totalFullMarks,
          percentage: subResult.subjectPercentage ?? 0,
          grade: subResult.subjectGrade ?? "NG",
          gradePoint: subResult.subjectGpa ?? 0,
          isNG: subResult.isNG,
          // snapshot: total credit hours for this subject
          creditHours: subResult.totalCreditHours,
          weightedPoint: (subResult.subjectGpa ?? 0) * subResult.totalCreditHours,
        });
      }

      const resultStatus = examResult.hasNG ? "NG_BLOCKED" : "PROMOTED";

      termResultsData.push({
        syncedStudentId: studentId,
        examId: exam.id,
        academicYearId: exam.academicYearId,
        totalSubjects: examResult.totalSubjects,
        passedSubjects: examResult.passedSubjects,
        ngSubjects: examResult.ngSubjects,
        totalCreditHours: examResult.totalCreditHours,
        totalWeightedPoints: examResult.totalWeightedPoints,
        gpa: examResult.overallGpa ?? 0,
        hasNG: examResult.hasNG,
        resultStatus,
      });
    }

    // Persist in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.secondarySubjectResult.deleteMany({ where: { examId: exam.id } });
      await tx.secondaryTermResult.deleteMany({ where: { examId: exam.id } });

      const termResultIdMap = new Map<string, string>();
      for (const res of termResultsData) {
        const created = await tx.secondaryTermResult.create({
          data: {
            syncedStudentId: res.syncedStudentId,
            examId: res.examId,
            academicYearId: res.academicYearId,
            totalSubjects: res.totalSubjects,
            passedSubjects: res.passedSubjects,
            ngSubjects: res.ngSubjects,
            totalCreditHours: res.totalCreditHours,
            totalWeightedPoints: res.totalWeightedPoints,
            gpa: res.gpa,
            hasNG: res.hasNG,
            resultStatus: res.resultStatus as "NG_BLOCKED" | "PROMOTED",
          },
        });
        termResultIdMap.set(res.syncedStudentId, created.id);
      }

      for (const subRes of subjectResultsData) {
        const finalResultId = termResultIdMap.get(subRes.syncedStudentId);
        await tx.secondarySubjectResult.create({
          data: {
            syncedStudentId: subRes.syncedStudentId,
            subjectConfigId: subRes.subjectConfigId,
            examId: subRes.examId,
            theoryMarks: subRes.theoryMarks,
            practicalMarks: subRes.practicalMarks,
            totalObtained: subRes.totalObtained,
            totalFullMarks: subRes.totalFullMarks,
            percentage: subRes.percentage,
            grade: subRes.grade,
            gradePoint: subRes.gradePoint,
            isNG: subRes.isNG,
            creditHours: subRes.creditHours,
            weightedPoint: subRes.weightedPoint,
            finalResultId,
          },
        });
      }
    });

    return ok(
      { studentsProcessed: termResultsData.length },
      "Term compiled successfully",
    );
  },
  ["ADMIN"],
);

