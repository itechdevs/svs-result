import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { getSecondaryGrade } from "@/lib/secondary-grades";
// Removes the Decimal import

// POST /api/admin/secondary/exams/[examId]/compile
export const POST = withHandler(
  async (_req: NextRequest, { params }) => {
    const { examId } = await params;
    
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });
    if (!exam) return notFound("Exam not found");

    // Fetch Subject Configs for this exam's grade & year
    const subjectConfigs = await prisma.secondarySubjectConfig.findMany({
      where: {
        academicYearId: exam.academicYearId,
        gradeLevel: exam.gradeLevel,
        isActive: true,
      },
      include: { components: true },
    });

    if (subjectConfigs.length === 0) {
      return badRequest("No active secondary subject configurations found for this exam's grade level and academic year.");
    }

    const configIds = subjectConfigs.map(sc => sc.id);

    // Fetch all verified component marks for this exam
    const componentMarks = await prisma.secondaryComponentMark.findMany({
      where: {
        examId: examId,
        component: {
          subjectConfigId: { in: configIds }
        },
      },
      include: { component: true },
    });

    const unverifiedMarks = componentMarks.filter(m => m.status !== "VERIFIED");
    if (unverifiedMarks.length > 0) {
      // For strict compliance, all marks should be verified before compilation.
      // But we can allow partials. Let's enforce it.
      return badRequest(`There are ${unverifiedMarks.length} unverified marks. Please verify all marks before compilation.`);
    }

    // Group marks by student
    const studentMarksMap = new Map<string, typeof componentMarks>();
    
    // Some students might have missing marks. We'll group what we have.
    for (const mark of componentMarks) {
      if (!studentMarksMap.has(mark.syncedStudentId)) {
        studentMarksMap.set(mark.syncedStudentId, []);
      }
      studentMarksMap.get(mark.syncedStudentId)!.push(mark);
    }

    // Process compilation per student
    const termResultsData: any[] = [];
    const subjectResultsData: any[] = [];

    for (const [studentId, marks] of studentMarksMap.entries()) {
      let totalPassed = 0;
      let totalNg = 0;
      let totalCreditHours = 0;
      let totalWeightedPoints = 0;

      for (const config of subjectConfigs) {
        let internalMarks = 0;
        let theoryMarks = 0;
        let practicalMarks = 0;
        let totalFullMarks = 0;

        for (const comp of config.components) {
          totalFullMarks += Number(comp.fullMarks);
          const studentMarkList = marks.filter(m => m.componentId === comp.id);
          const studentMarkObj = studentMarkList.length > 0 ? Number(studentMarkList[0].marksObtained || 0) : 0;
          
          if (comp.type === "INTERNAL") internalMarks += studentMarkObj;
          if (comp.type === "THEORY") theoryMarks += studentMarkObj;
          if (comp.type === "PRACTICAL") practicalMarks += studentMarkObj;
        }

        const totalObtained = internalMarks + theoryMarks + practicalMarks;
        
        let percentage = 0;
        if (totalFullMarks > 0) {
          percentage = (totalObtained / totalFullMarks) * 100;
        }

        const gradeInfo = getSecondaryGrade(percentage);
        const weightedPoint = gradeInfo.gradePoint * config.creditHours;

        totalCreditHours += config.creditHours;
        totalWeightedPoints += weightedPoint;

        if (gradeInfo.isNG) {
          totalNg++;
        } else {
          totalPassed++;
        }

        subjectResultsData.push({
          syncedStudentId: studentId,
          subjectConfigId: config.id,
          examId: exam.id,
          internalMarks,
          theoryMarks,
          practicalMarks,
          totalObtained,
          totalFullMarks,
          percentage,
          grade: gradeInfo.grade,
          gradePoint: gradeInfo.gradePoint,
          isNG: gradeInfo.isNG,
          creditHours: config.creditHours,
          weightedPoint,
        });
      } // end subject iteration

      const gpa = totalCreditHours > 0 ? (totalWeightedPoints / totalCreditHours) : 0;
      const resultStatus = totalNg > 0 ? "NG_BLOCKED" : "PROMOTED";

      termResultsData.push({
        syncedStudentId: studentId,
        examId: exam.id,
        academicYearId: exam.academicYearId,
        totalSubjects: subjectConfigs.length,
        passedSubjects: totalPassed,
        ngSubjects: totalNg,
        totalCreditHours,
        totalWeightedPoints,
        gpa: Number(gpa.toFixed(2)),
        hasNG: totalNg > 0,
        resultStatus,
      });
    }

    // Save outputs using a transaction
    await prisma.$transaction(async (tx) => {
      // Clean up previous compilation if any
      await tx.secondarySubjectResult.deleteMany({ where: { examId: exam.id } });
      await tx.secondaryTermResult.deleteMany({ where: { examId: exam.id } });

      for (const res of termResultsData) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const resultSchemaObj = res;
        await tx.secondaryTermResult.create({
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
          }
        });
      }

      for (const subRes of subjectResultsData) {
        await tx.secondarySubjectResult.create({
          data: {
            syncedStudentId: subRes.syncedStudentId,
            subjectConfigId: subRes.subjectConfigId,
            examId: subRes.examId,
            internalMarks: subRes.internalMarks,
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
          }
        });
      }
    });

    return ok({ studentsProcessed: termResultsData.length }, "Term compiled successfully");
  },
  ["ADMIN"]
);
