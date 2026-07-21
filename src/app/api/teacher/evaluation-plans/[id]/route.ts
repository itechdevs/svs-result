import { Decimal } from "@prisma/client/runtime/library";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, noContent, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { updateEvaluationTemplateSchema } from "@/lib/schemas";

// PATCH /api/teacher/evaluation-plans/[id]
export const PATCH = withHandler(
  async (req: NextRequest, { params, user }) => {
    const body = updateEvaluationTemplateSchema.parse(await req.json());

    const existing = await prisma.evaluationTemplate.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        syncedSubject: {
          include: { teachers: { include: { user: { select: { id: true } } } } },
        },
      },
    });
    if (!existing) return notFound("Evaluation template not found");

    if (user.role === "TEACHER" && !existing.syncedSubject.teachers.some(t => t.user?.id === user.id)) {
      return forbidden("You are not assigned to this subject");
    }

    // ── When editing, reset submitted results so teacher can re-enter marks ─
    const newFullMarks = body.fullMarks !== undefined ? body.fullMarks : Number(existing.fullMarks);
    const newPassMarks = body.passMarks !== undefined ? body.passMarks : Number(existing.passMarks);
    const oldFullMarks = Number(existing.fullMarks);
    const fullMarksDecreased = body.fullMarks !== undefined && newFullMarks < oldFullMarks;
    const passMarksChanged = body.passMarks !== undefined && newPassMarks !== Number(existing.passMarks);

    let resetCount = 0;

    // Find existing results and reset non-DRAFT ones to DRAFT on any edit
    const existingResults = await prisma.studentEvaluationResult.findMany({
      where: {
        evaluationTemplateId: params.id,
        deletedAt: null,
      },
    });

    const hasNonDraftResults = existingResults.some(r => r.status !== "DRAFT");

    if (hasNonDraftResults) {
      const updates = existingResults.map((result) => {
        // Cap marksObtained if fullMarks decreased and marks exceed the new max
        const wasCapped =
          !result.isAbsent &&
          result.marksObtained !== null &&
          fullMarksDecreased &&
          Number(result.marksObtained) > newFullMarks;

        const cappedMarks = wasCapped ? new Decimal(newFullMarks) : result.marksObtained;

        // Recalculate isPassed if passMarks changed or marks were capped
        const shouldRecalcPassed = passMarksChanged || wasCapped;

        const isPassed = shouldRecalcPassed
          ? result.isAbsent
            ? false
            : cappedMarks !== null
              ? new Decimal(Number(cappedMarks)) >= new Decimal(newPassMarks)
              : false
          : result.isPassed;

        return prisma.studentEvaluationResult.update({
          where: { id: result.id },
          data: {
            marksObtained: cappedMarks,
            isPassed,
            status: "DRAFT",
            submittedAt: null,
          },
        });
      });

      await prisma.$transaction(updates);
      resetCount = existingResults.length;
    }

    // ── Update the template ─────────────────────────────────────────────────
    const updated = await prisma.evaluationTemplate.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.fullMarks !== undefined && { fullMarks: body.fullMarks }),
        ...(body.passMarks !== undefined && { passMarks: body.passMarks }),
        ...(body.weightage !== undefined && { weightage: body.weightage }),
        ...(body.scheduledDate !== undefined && { scheduledDate: body.scheduledDate }),
        ...(body.displayOrder !== undefined && { displayOrder: body.displayOrder }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.examId !== undefined && { examId: body.examId }),
      },
      include: {
        syncedSubject: { select: { id: true, name: true, gradeLevel: true } },
        gradeConfig: { select: { id: true, gradeLevel: true, academicYear: { select: { id: true, name: true } } } },
      },
    });

    const message = resetCount > 0
      ? `Evaluation updated. ${resetCount} student mark(s) were returned to DRAFT. Please review marks and re-submit.`
      : "Evaluation updated";

    return ok(updated, message);
  },
  ["ADMIN", "TEACHER"],
);

// DELETE /api/teacher/evaluation-plans/[id]
export const DELETE = withHandler(
  async (_req, { params, user }) => {
    const existing = await prisma.evaluationTemplate.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        syncedSubject: {
          include: { teachers: { include: { user: { select: { id: true } } } } },
        },
      },
    });
    if (!existing) return notFound("Evaluation template not found");

    if (user.role === "TEACHER" && !existing.syncedSubject.teachers.some(t => t.user?.id === user.id)) {
      return forbidden("You are not assigned to this subject");
    }

    await prisma.evaluationTemplate.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return noContent();
  },
  ["ADMIN", "TEACHER"],
);
