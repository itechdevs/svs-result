/**
 * POST — Save re-exam assessment (creates schedule, enrollment, result in one operation)
 */
import { NextRequest } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { badRequest, created } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { reExamAssessmentSchema } from "@/lib/schemas";

export const POST = withHandler(
  async (req: NextRequest, { user }) => {
    const body = reExamAssessmentSchema.parse(await req.json());

    // Get the evaluation template
    const template = await prisma.evaluationTemplate.findUnique({
      where: { id: body.evaluationTemplateId },
    });
    if (!template) return badRequest("Evaluation template not found");

    // Get the original evaluation result
    const originalResult = await prisma.studentEvaluationResult.findFirst({
      where: {
        evaluationTemplateId: body.evaluationTemplateId,
        syncedStudentId: body.syncedStudentId,
      },
    });
    if (!originalResult) {
      return badRequest("Original evaluation result not found");
    }
    
    // Check if student failed: either isPassed is explicitly false OR marks < passMarks
    const hasFailed = originalResult.isPassed === false || 
      (originalResult.marksObtained !== null && originalResult.marksObtained < template.passMarks);
    
    if (!hasFailed) {
      return badRequest("Student has not failed this evaluation");
    }

    if (body.marksObtained > Number(template.fullMarks)) {
      return badRequest(
        `Marks (${body.marksObtained}) exceed full marks (${template.fullMarks})`,
      );
    }

    const isPassed = new Decimal(body.marksObtained) >= template.passMarks;

    // Create or get re-exam schedule
    const schedule = await prisma.reExamSchedule.upsert({
      where: { evaluationTemplateId: body.evaluationTemplateId },
      create: {
        evaluationTemplateId: body.evaluationTemplateId,
        scheduledDate: body.scheduledDate,
        fullMarks: template.fullMarks,
        passMarks: template.passMarks,
        status: "SCHEDULED",
      },
      update: {},
    });

    // Create or get enrollment
    const enrollment = await prisma.reExamEnrollment.upsert({
      where: {
        reExamScheduleId_syncedStudentId: {
          reExamScheduleId: schedule.id,
          syncedStudentId: body.syncedStudentId,
        },
      },
      create: {
        reExamScheduleId: schedule.id,
        syncedStudentId: body.syncedStudentId,
        isEligible: true,
      },
      update: {},
    });

    // Create or update result
    const result = await prisma.reExamResult.upsert({
      where: { reExamEnrollmentId: enrollment.id },
      create: {
        reExamEnrollmentId: enrollment.id,
        studentEvaluationResultId: originalResult.id,
        enteredById: user.id,
        marksObtained: new Decimal(body.marksObtained),
        isPassed,
        remarks: body.remarks,
        status: "DRAFT",
      },
      update: {
        marksObtained: new Decimal(body.marksObtained),
        isPassed,
        remarks: body.remarks,
        updatedAt: new Date(),
      },
    });

    return created(result, "Re-exam assessment saved");
  },
  ["ADMIN", "TEACHER"],
);
