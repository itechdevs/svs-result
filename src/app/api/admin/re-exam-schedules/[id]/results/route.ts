/**
 * GET  — list re-exam results for a schedule
 * POST — teacher enters a re-exam result for an enrolled student
 */
import { NextRequest } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { badRequest, created, notFound, ok } from "@/lib/response";
import { upsertReExamResultSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

const postBodySchema = upsertReExamResultSchema.extend({
  reExamEnrollmentId: z.string().cuid(),
});

export const GET = withHandler(async (_req, { params }) => {
  const schedule = await prisma.reExamSchedule.findUnique({
    where: { id: params.id },
  });
  if (!schedule) return notFound("Re-exam schedule not found");

  const results = await prisma.reExamResult.findMany({
    where: { reExamEnrollment: { reExamScheduleId: params.id } },
    include: {
      reExamEnrollment: {
        include: {},
      },
    },
  });

  return ok(results);
});

export const POST = withHandler(async (req: NextRequest, { params, user }) => {
  const body = postBodySchema.parse(await req.json());

  const schedule = await prisma.reExamSchedule.findUnique({
    where: { id: params.id },
  });
  if (!schedule) return notFound("Re-exam schedule not found");
  if (schedule.status !== "SCHEDULED") {
    return badRequest("Re-exam is not open for result entry");
  }

  const enrollment = await prisma.reExamEnrollment.findUnique({
    where: { id: body.reExamEnrollmentId },
    include: { reExamResult: true },
  });
  if (!enrollment) return notFound("Enrollment not found");
  if (!enrollment.isEligible)
    return badRequest("Student is not eligible for this re-exam");
  if (enrollment.reExamResult) {
    return badRequest("Re-exam result already exists. Use PATCH to update.");
  }

  if (body.marksObtained > Number(schedule.fullMarks)) {
    return badRequest(
      `Marks (${body.marksObtained}) exceed re-exam full marks (${schedule.fullMarks})`,
    );
  }

  // Get the original evaluation result ID
  const originalResult = await prisma.studentEvaluationResult.findFirst({
    where: {
      evaluationTemplateId: schedule.evaluationTemplateId,
    },
  });
  if (!originalResult)
    return badRequest("Original evaluation result not found");

  const isPassed = new Decimal(body.marksObtained) >= schedule.passMarks;

  const result = await prisma.reExamResult.create({
    data: {
      reExamEnrollmentId: body.reExamEnrollmentId,
      studentEvaluationResultId: originalResult.id,
      enteredById: user.id,
      marksObtained: new Decimal(body.marksObtained),
      isPassed,
      remarks: body.remarks,
      status: "DRAFT",
    },
  });

  return created(result, "Re-exam result entered");
});
