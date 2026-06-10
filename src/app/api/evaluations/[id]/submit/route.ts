/**
 * POST /api/evaluations/[id]/submit
 * Teacher submits a DRAFT result. Transitions DRAFT → SUBMITTED.
 * Calculates isPassed based on marksObtained vs passMarks.
 */
import { withHandler } from "@/lib/handlers";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, notFound, ok } from "@/lib/response";

export const POST = withHandler(async (_req, { params, user }) => {
  const result = await prisma.studentEvaluationResult.findUnique({
    where: { id: params.id, deletedAt: null },
    include: {
      evaluationTemplate: {
        include: { gradeConfig: true },
      },
    },
  });
  if (!result) return notFound("Evaluation result not found");

  if (result.status !== "DRAFT") {
    return badRequest(`Cannot submit a result with status '${result.status}'`);
  }

  // Teachers can only submit their own entries
  if (user.role === "TEACHER" && result.enteredById !== user.id) {
    return forbidden("You can only submit results you entered");
  }

  // Validate marks do not exceed fullMarks
  if (
    !result.isAbsent &&
    result.marksObtained !== null &&
    result.marksObtained > result.evaluationTemplate.fullMarks
  ) {
    return badRequest(
      `Marks obtained (${result.marksObtained}) exceeds full marks (${result.evaluationTemplate.fullMarks})`,
    );
  }

  const isPassed = result.isAbsent
    ? false
    : result.marksObtained !== null &&
      result.marksObtained >= result.evaluationTemplate.passMarks;

  const updated = await prisma.studentEvaluationResult.update({
    where: { id: params.id },
    data: {
      status: "SUBMITTED",
      isPassed,
      submittedAt: new Date(),
    },
    include: {
      syncedStudent: { select: { id: true, name: true, rollNumber: true } },
      evaluationTemplate: { select: { id: true, name: true } },
    },
  });

  return ok(updated, "Result submitted successfully");
});
