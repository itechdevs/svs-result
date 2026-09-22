import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { conflict, forbidden, noContent, notFound, ok } from "@/lib/response";
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

    // ── Compute new marks for comparison ────────────────────────────────────
    const newFullMarks = body.fullMarks !== undefined ? body.fullMarks : Number(existing.fullMarks);
    const newPassMarks = body.passMarks !== undefined ? body.passMarks : Number(existing.passMarks);
    const oldFullMarks = Number(existing.fullMarks);
    const fullMarksDecreased = body.fullMarks !== undefined && newFullMarks < oldFullMarks;
    const passMarksChanged = body.passMarks !== undefined && newPassMarks !== Number(existing.passMarks);

    // ── Fetch data needed inside transaction ────────────────────────────────
    const [existingResults, reExamSchedule] = await Promise.all([
      prisma.studentEvaluationResult.findMany({
        where: { evaluationTemplateId: params.id, deletedAt: null },
      }),
      body.fullMarks !== undefined || body.passMarks !== undefined
        ? prisma.reExamSchedule.findUnique({
            where: { evaluationTemplateId: params.id },
            include: {
              enrollments: {
                include: { reExamResult: true },
              },
            },
          })
        : Promise.resolve(null),
    ]);

    // Published evaluations are locked — any non-DRAFT student result means
    // marks were submitted to admin, so the plan can no longer be edited.
    if (existingResults.some((r) => r.status !== "DRAFT")) {
      return forbidden(
        "This evaluation has been published and can no longer be edited.",
      );
    }

    // ── Execute all mutations in a single transaction for atomicity ─────────
    let resetCount = 0;

    let updated;
    try {
      updated = await prisma.$transaction(async (tx) => {
      // 1) Reset submitted results to DRAFT and cap marks if needed
      const hasNonDraftResults = existingResults.some(r => r.status !== "DRAFT");

      if (hasNonDraftResults) {
        for (const result of existingResults) {
          const wasCapped =
            !result.isAbsent &&
            result.marksObtained !== null &&
            fullMarksDecreased &&
            Number(result.marksObtained) > newFullMarks;

          const cappedMarks = wasCapped ? new Decimal(newFullMarks) : result.marksObtained;
          const shouldRecalcPassed = passMarksChanged || wasCapped;

          const isPassed = shouldRecalcPassed
            ? result.isAbsent
              ? false
              : cappedMarks !== null
                ? new Decimal(Number(cappedMarks)) >= new Decimal(newPassMarks)
                : false
            : result.isPassed;

          await tx.studentEvaluationResult.update({
            where: { id: result.id },
            data: {
              marksObtained: cappedMarks,
              isPassed,
              status: "DRAFT",
              submittedAt: null,
            },
          });
        }
        resetCount = existingResults.length;
      }

      // 2) Sync re-exam schedule and clean up stale results
      if (reExamSchedule) {
        // 2a) Update re-exam schedule marks to match the template
        await tx.reExamSchedule.update({
          where: { id: reExamSchedule.id },
          data: {
            fullMarks: newFullMarks,
            passMarks: newPassMarks,
          },
        });

        // 2b) Delete re-exam results whose marks exceed the new full marks
        //     (the exam conditions have changed — old re-exam marks are no longer valid)
        const invalidEnrollmentIds: string[] = [];
        for (const enrollment of reExamSchedule.enrollments) {
          if (
            enrollment.reExamResult &&
            Number(enrollment.reExamResult.marksObtained) > newFullMarks
          ) {
            invalidEnrollmentIds.push(enrollment.id);
          }
        }

        if (invalidEnrollmentIds.length > 0) {
          await tx.reExamEnrollment.deleteMany({
            where: { id: { in: invalidEnrollmentIds } },
          });
        }
      }

      // 3) Update the template
      const updatedTemplate = await tx.evaluationTemplate.update({
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

      return updatedTemplate;
      });
    } catch (err) {
      // Renaming to a name another criteria in this subject already uses
      // (same task type + outcome name) violates the unique constraint.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return conflict(
          "Another criteria in this evaluation already uses this task type and outcome name. Each criteria name must be unique.",
        );
      }
      throw err;
    }

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

    // Published evaluations are locked — any non-DRAFT student result means
    // marks were submitted to admin, so the plan can no longer be deleted.
    const publishedCount = await prisma.studentEvaluationResult.count({
      where: { evaluationTemplateId: params.id, deletedAt: null, status: { not: "DRAFT" } },
    });
    if (publishedCount > 0) {
      return forbidden(
        "This evaluation has been published and can no longer be deleted.",
      );
    }

    await prisma.evaluationTemplate.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return noContent();
  },
  ["ADMIN", "TEACHER"],
);
