/**
 * POST — Save re-exam assessment (creates schedule, enrollment, result in one operation)
 */
import { NextRequest } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest, created } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { reExamAssessmentSchema } from "@/lib/schemas";

export const POST = withHandler(
  async (req: NextRequest, { user }) => {
    const json = await req.json();
    const isArray = Array.isArray(json);
    const assessments: z.infer<typeof reExamAssessmentSchema>[] = isArray
      ? z.array(reExamAssessmentSchema).parse(json)
      : [reExamAssessmentSchema.parse(json)];

    if (assessments.length === 0) {
      return badRequest("No assessments provided");
    }

    const templateIds = Array.from(new Set(assessments.map(a => a.evaluationTemplateId)));
    const studentIds = Array.from(new Set(assessments.map(a => a.syncedStudentId)));

    const templates = await prisma.evaluationTemplate.findMany({
      where: { id: { in: templateIds } },
    });
    const templateMap = new Map(templates.map(t => [t.id, t]));

    const originalResults = await prisma.studentEvaluationResult.findMany({
      where: {
        evaluationTemplateId: { in: templateIds },
        syncedStudentId: { in: studentIds },
      },
    });
    const resultMap = new Map(
      originalResults.map(r => [`${r.evaluationTemplateId}::${r.syncedStudentId}`, r])
    );

    // Validate all assessments first
    for (const assessment of assessments) {
      const template = templateMap.get(assessment.evaluationTemplateId);
      if (!template) return badRequest(`Evaluation template ${assessment.evaluationTemplateId} not found`);

      const originalResult = resultMap.get(`${assessment.evaluationTemplateId}::${assessment.syncedStudentId}`);
      if (!originalResult) {
        return badRequest(
          `Original evaluation result not found for student ${assessment.syncedStudentId} and template ${assessment.evaluationTemplateId}`
        );
      }

      const obtainedNum = originalResult.marksObtained !== null && originalResult.marksObtained !== undefined
        ? Number(originalResult.marksObtained)
        : null;
      const passNum = Number(template.passMarks);

      const hasFailed =
        originalResult.isPassed === false ||
        (obtainedNum !== null && obtainedNum < passNum);

      if (!hasFailed) {
        return badRequest(
          `Student ${assessment.syncedStudentId} has not failed evaluation ${assessment.evaluationTemplateId}`
        );
      }

      if (assessment.marksObtained > Number(template.fullMarks)) {
        return badRequest(
          `Marks (${assessment.marksObtained}) exceed full marks (${template.fullMarks}) for template ${assessment.evaluationTemplateId}`
        );
      }
    }

    // Batch upsert inside transaction
    const results = await prisma.$transaction(async (tx) => {
      const savedResults = [];

      for (const assessment of assessments) {
        const template = templateMap.get(assessment.evaluationTemplateId)!;
        const originalResult = resultMap.get(`${assessment.evaluationTemplateId}::${assessment.syncedStudentId}`)!;
        const isPassed = new Decimal(assessment.marksObtained) >= template.passMarks;

        // Create or get re-exam schedule
        const schedule = await tx.reExamSchedule.upsert({
          where: { evaluationTemplateId: assessment.evaluationTemplateId },
          create: {
            evaluationTemplateId: assessment.evaluationTemplateId,
            scheduledDate: assessment.scheduledDate,
            fullMarks: template.fullMarks,
            passMarks: template.passMarks,
            status: "SCHEDULED",
          },
          update: {
            scheduledDate: assessment.scheduledDate,
          },
        });

        // Create or get enrollment
        const enrollment = await tx.reExamEnrollment.upsert({
          where: {
            reExamScheduleId_syncedStudentId: {
              reExamScheduleId: schedule.id,
              syncedStudentId: assessment.syncedStudentId,
            },
          },
          create: {
            reExamScheduleId: schedule.id,
            syncedStudentId: assessment.syncedStudentId,
            isEligible: true,
          },
          update: {},
        });

        // Create or update result
        const result = await tx.reExamResult.upsert({
          where: { reExamEnrollmentId: enrollment.id },
          create: {
            reExamEnrollmentId: enrollment.id,
            studentEvaluationResultId: originalResult.id,
            enteredById: user.id,
            marksObtained: new Decimal(assessment.marksObtained),
            isPassed,
            remarks: assessment.remarks,
            status: "DRAFT",
          },
          update: {
            marksObtained: new Decimal(assessment.marksObtained),
            isPassed,
            remarks: assessment.remarks,
            updatedAt: new Date(),
          },
        });

        savedResults.push(result);
      }

      return savedResults;
    });

    const responseData = isArray ? results : results[0];
    return created(responseData, "Re-exam assessment saved");
  },
  ["ADMIN", "TEACHER"],
);
