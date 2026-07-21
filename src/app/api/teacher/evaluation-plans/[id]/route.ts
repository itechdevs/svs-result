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

    // ── When fullMarks or passMarks change, clean up existing marks ──────────
    const newFullMarks = body.fullMarks !== undefined ? body.fullMarks : Number(existing.fullMarks);
    const newPassMarks = body.passMarks !== undefined ? body.passMarks : Number(existing.passMarks);
    const oldFullMarks = Number(existing.fullMarks);
    const fullMarksChanged = body.fullMarks !== undefined && newFullMarks !== oldFullMarks;
    const passMarksChanged = body.passMarks !== undefined && newPassMarks !== Number(existing.passMarks);

    // Needs cleanup when: fullMarks decreased OR passMarks changed
    const needsCleanup = (fullMarksChanged && newFullMarks < oldFullMarks) || passMarksChanged;
    let resetCount = 0;

    if (needsCleanup) {
      const existingResults = await prisma.studentEvaluationResult.findMany({
        where: {
          evaluationTemplateId: params.id,
          deletedAt: null,
        },
      });

      if (existingResults.length > 0) {
        const updates = existingResults.map((result) => {
          // Cap marksObtained at new fullMarks if they exceed it
          const cappedMarks =
            result.isAbsent || result.marksObtained === null
              ? result.marksObtained
              : fullMarksChanged && Number(result.marksObtained) > newFullMarks
                ? new Decimal(newFullMarks)
                : result.marksObtained;

          // Recalculate isPassed with new passMarks
          const isPassed = result.isAbsent
            ? false
            : cappedMarks !== null
              ? new Decimal(Number(cappedMarks)) >= new Decimal(newPassMarks)
              : false;

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
      ? `Evaluation updated. ${resetCount} student mark(s) were reset to DRAFT due to full/pass marks changes. Please review and re-submit.`
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
