import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { z } from "zod";

const compilationSchema = z.object({
  academicYearId: z.string(),
  examId: z.string().optional(),
  gradeLevel: z.string(),
  students: z.array(z.object({
    studentId: z.string(),
    subjects: z.record(z.object({
      subjectId: z.string(),
      totalObtained: z.number(),
      totalFull: z.number(),
      percentage: z.number(),
      grade: z.string(),
      isPassed: z.boolean(),
      failedEvaluations: z.number(),
    })),
    overallPercentage: z.number(),
    overallGrade: z.string(),
    cgpa: z.number().optional(),
    resultStatus: z.enum(["PROMOTED", "FAILED", "PROBATION", "PENDING"]),
  })),
});

// POST /api/admin/final-compilation
export const POST = withHandler(
  async (req: NextRequest, context) => {
    const body = compilationSchema.parse(await req.json());
    const userId = context.user.id;

    const results = await prisma.$transaction(async (tx) => {
      const savedResults = [];

      for (const student of body.students) {
        // Save or update subject results
        for (const [subjectName, subjectData] of Object.entries(student.subjects)) {
          await tx.subjectResult.upsert({
            where: {
              syncedStudentId_syncedSubjectId_academicYearId: {
                syncedStudentId: student.studentId,
                syncedSubjectId: subjectData.subjectId,
                academicYearId: body.academicYearId,
              },
            },
            create: {
              syncedStudentId: student.studentId,
              syncedSubjectId: subjectData.subjectId,
              academicYearId: body.academicYearId,
              totalFullMarks: subjectData.totalFull,
              obtainedMarks: subjectData.totalObtained,
              percentage: subjectData.percentage,
              grade: subjectData.grade,
              isPassed: subjectData.isPassed,
              failedEvaluations: subjectData.failedEvaluations,
            },
            update: {
              totalFullMarks: subjectData.totalFull,
              obtainedMarks: subjectData.totalObtained,
              percentage: subjectData.percentage,
              grade: subjectData.grade,
              isPassed: subjectData.isPassed,
              failedEvaluations: subjectData.failedEvaluations,
              updatedAt: new Date(),
            },
          });
        }

        // Save or update final result
        const subjectCount = Object.keys(student.subjects).length;
        const passedCount = Object.values(student.subjects).filter(s => s.isPassed).length;
        const failedCount = subjectCount - passedCount;

        const finalResult = await tx.finalResult.upsert({
          where: {
            syncedStudentId_academicYearId: {
              syncedStudentId: student.studentId,
              academicYearId: body.academicYearId,
            },
          },
          create: {
            syncedStudentId: student.studentId,
            academicYearId: body.academicYearId,
            totalSubjects: subjectCount,
            passedSubjects: passedCount,
            failedSubjects: failedCount,
            percentage: student.overallPercentage,
            cgpa: student.cgpa,
            overallGrade: student.overallGrade,
            resultStatus: student.resultStatus,
          },
          update: {
            totalSubjects: subjectCount,
            passedSubjects: passedCount,
            failedSubjects: failedCount,
            percentage: student.overallPercentage,
            cgpa: student.cgpa,
            overallGrade: student.overallGrade,
            resultStatus: student.resultStatus,
            updatedAt: new Date(),
          },
        });

        savedResults.push(finalResult);
      }

      return savedResults;
    });

    return ok({ saved: results.length, results });
  },
  ["ADMIN"]
);
