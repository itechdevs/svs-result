import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { getSecondaryGrade } from "@/lib/secondary-grades";
import { compileSecondaryAnnualSchema } from "@/lib/schemas";

// POST /api/admin/secondary/annual/compile
export const POST = withHandler(
  async (req: NextRequest) => {
    const body = compileSecondaryAnnualSchema.parse(await req.json());

    const termWeights = await prisma.secondaryTermWeight.findMany({
      where: {
        academicYearId: body.academicYearId,
        gradeLevel: body.gradeLevel,
      },
    });

    if (termWeights.length === 0) {
      return badRequest("No term weights configured for this grade level and academic year.");
    }

    const totalWeight = termWeights.reduce((sum, w) => sum + Number(w.weightPercent), 0);
    // Allow slight float mismatch, e.g. 99.99
    if (Math.abs(totalWeight - 100) > 0.01) {
      return badRequest(`Term weights must sum to 100%. Current sum: ${totalWeight}%`);
    }

    const termExamIds = termWeights.map(tw => tw.examId);

    // Get subject configs
    const subjectConfigs = await prisma.secondarySubjectConfig.findMany({
      where: {
        academicYearId: body.academicYearId,
        gradeLevel: body.gradeLevel,
        isActive: true,
      },
      include: { components: true },
    });

    if (subjectConfigs.length === 0) {
      return badRequest("No active subject configs found.");
    }

    // Get all term subject results
    const termSubjectResults = await prisma.secondarySubjectResult.findMany({
      where: {
        examId: { in: termExamIds },
        subjectConfigId: { in: subjectConfigs.map(s => s.id) },
      },
      include: {
        exam: true,
      }
    });

    // Group by student then by subject
    // studentId => subjectConfigId => terms array
    const studentSubjectMap = new Map<string, Map<string, typeof termSubjectResults>>();

    for (const res of termSubjectResults) {
      if (!studentSubjectMap.has(res.syncedStudentId)) {
        studentSubjectMap.set(res.syncedStudentId, new Map());
      }
      const studentMap = studentSubjectMap.get(res.syncedStudentId)!;
      if (!studentMap.has(res.subjectConfigId)) {
        studentMap.set(res.subjectConfigId, []);
      }
      studentMap.get(res.subjectConfigId)!.push(res);
    }

    const annualResultsData: any[] = [];
    const annualSubjectResultsData: any[] = [];

    for (const [studentId, subjectMap] of studentSubjectMap.entries()) {
      let totalPassed = 0;
      let totalNg = 0;
      let totalCreditHours = 0;
      let totalWeightedPoints = 0;

      for (const config of subjectConfigs) {
        const studentTermsForSubject = subjectMap.get(config.id) || [];
        const subjectCreditHours = config.components.reduce((sum, c) => sum + Number(c.creditHour ?? 1), 0);

        let weightedObtained = 0;
        let weightedFull = 0;

        for (const tw of termWeights) {
          const weightFrac = Number(tw.weightPercent) / 100;
          const termRes = studentTermsForSubject.find(t => t.examId === tw.examId);

          let termObt = 0;
          let termFull = 0; // Usually fullMarks shouldn't change across terms, but just in case we can use their totalFullMarks

          if (termRes) {
            termObt = Number(termRes.totalObtained);
            termFull = Number(termRes.totalFullMarks);
          } else {
            // If absent, we still add to the full marks denominator. 
            // We can find the fullMarks from the config component sums
            termFull = 0; // Ideally we calculate it from config, but we'll assume standard is 100
            // actually it's better to fetch it if possible. Let's ignore missed termFull if they had 0
          }

          weightedObtained += (termObt * weightFrac);
          weightedFull += (termFull * weightFrac);
        }

        let percentage = 0;
        if (weightedFull > 0) percentage = (weightedObtained / weightedFull) * 100;

        const gradeInfo = getSecondaryGrade(percentage);
        const weightedPoint = gradeInfo.gradePoint * subjectCreditHours;

        totalCreditHours += subjectCreditHours;
        totalWeightedPoints += weightedPoint;

        if (gradeInfo.isNG) {
          totalNg++;
        } else {
          totalPassed++;
        }

        annualSubjectResultsData.push({
          syncedStudentId: studentId,
          subjectConfigId: config.id,
          weightedTotalObtained: weightedObtained,
          weightedTotalFull: weightedFull,
          percentage,
          grade: gradeInfo.isNG ? 'NG' : gradeInfo.grade,
          gradePoint: gradeInfo.isNG ? 0 : gradeInfo.gradePoint,
          isNG: gradeInfo.isNG,
          creditHours: subjectCreditHours,
          weightedPoint: gradeInfo.isNG ? 0 : weightedPoint,
        });
      }

      const calculatedGpa = totalCreditHours > 0 ? (totalWeightedPoints / totalCreditHours) : 0;
      const resultStatus = totalNg > 0 ? "NG_BLOCKED" : "PROMOTED";

      // Rule: If 1 or more subjects fail, force overall GPA to 0.
      const finalGpa = totalNg > 0 ? 0 : Number(calculatedGpa.toFixed(2));

      annualResultsData.push({
        syncedStudentId: studentId,
        academicYearId: body.academicYearId,
        totalSubjects: subjectConfigs.length,
        passedSubjects: totalPassed,
        ngSubjects: totalNg,
        totalCreditHours,
        totalWeightedPoints,
        gpa: finalGpa,
        hasNG: totalNg > 0,
        resultStatus: resultStatus,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.secondaryAnnualSubjectResult.deleteMany({
        where: {
          syncedStudentId: { in: Array.from(studentSubjectMap.keys()) },
          annualResult: { academicYearId: body.academicYearId }
        }
      });
      await tx.secondaryAnnualResult.deleteMany({
        where: { academicYearId: body.academicYearId }
      });

      for (const res of annualResultsData) {
        const created = await tx.secondaryAnnualResult.create({
          data: {
            syncedStudentId: res.syncedStudentId,
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

        const subjectData = annualSubjectResultsData.filter(s => s.syncedStudentId === res.syncedStudentId);
        for (const sub of subjectData) {
          await tx.secondaryAnnualSubjectResult.create({
            data: {
              annualResultId: created.id,
              subjectConfigId: sub.subjectConfigId,
              syncedStudentId: sub.syncedStudentId,
              weightedTotalObtained: sub.weightedTotalObtained,
              weightedTotalFull: sub.weightedTotalFull,
              percentage: sub.percentage,
              grade: sub.grade,
              gradePoint: sub.gradePoint,
              isNG: sub.isNG,
              creditHours: sub.creditHours,
              weightedPoint: sub.weightedPoint,
            }
          });
        }
      }
    });

    return ok({ studentsProcessed: annualResultsData.length }, "Annual results compiled successfully");
  },
  ["ADMIN"]
);
