import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, noContent, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { updateEvaluationTemplateSchema } from "@/lib/schemas";

// GET /api/admin/evaluation-templates/[id]
export const GET = withHandler(
  async (_req, { params }) => {
    const template = await prisma.evaluationTemplate.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        gradeConfig: {
          select: {
            id: true,
            gradeLevel: true,
            academicYear: { select: { id: true, name: true } },
          },
        },
        syncedSubject: {
          select: { id: true, name: true, code: true, gradeLevel: true },
        },
        exam: {
          select: { id: true, name: true },
        },
      },
    });

    if (!template) return notFound("Evaluation template not found");
    return ok(template);
  },
  ["ADMIN", "TEACHER"],
);

// PATCH /api/admin/evaluation-templates/[id]
export const PATCH = withHandler(
  async (req: NextRequest, { params }) => {
    const body = updateEvaluationTemplateSchema.parse(await req.json());

    const existing = await prisma.evaluationTemplate.findFirst({
      where: { id: params.id, deletedAt: null },
    });
    if (!existing) return notFound("Evaluation template not found");

    // If updating weightage, ensure sum doesn't exceed 100
    if (body.weightage !== undefined) {
      const otherTemplates = await prisma.evaluationTemplate.findMany({
        where: {
          gradeConfigId: existing.gradeConfigId,
          syncedSubjectId: existing.syncedSubjectId,
          id: { not: params.id },
          deletedAt: null,
        },
      });

      const otherWeightageSum = otherTemplates.reduce(
        (sum, t) => sum + Number(t.weightage),
        0,
      );

      if (otherWeightageSum + body.weightage > 100) {
        return badRequest(
          `Total weightage for this subject would exceed 100% (current sum: ${otherWeightageSum + body.weightage}%)`,
        );
      }
    }

    // Wrap template update + re-exam cleanup in a transaction for atomicity
    const updated = await prisma.$transaction(async (tx) => {
      // 1) Update the evaluation template first
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
          syncedSubject: true,
          gradeConfig: true,
          exam: { select: { id: true, name: true } },
        },
      });

      // 2) If fullMarks or passMarks changed, sync re-exam schedule & clean up stale results
      if (body.fullMarks !== undefined || body.passMarks !== undefined) {
        const reExamSchedule = await tx.reExamSchedule.findUnique({
          where: { evaluationTemplateId: params.id },
          include: {
            enrollments: {
              include: { reExamResult: true },
            },
          },
        });

        if (reExamSchedule) {
          const newFullMarks = body.fullMarks !== undefined
            ? body.fullMarks
            : Number(existing.fullMarks);
          const newPassMarks = body.passMarks !== undefined
            ? body.passMarks
            : Number(existing.passMarks);

          // 2a) Update the re-exam schedule's marks to match the template
          await tx.reExamSchedule.update({
            where: { id: reExamSchedule.id },
            data: {
              fullMarks: newFullMarks,
              passMarks: newPassMarks,
            },
          });

          // 2b) Delete re-exam results whose marks exceed the new full marks
          //     (the exam conditions have changed — old marks are no longer valid)
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
            // Cascade: deleting the enrollment deletes its result too
            await tx.reExamEnrollment.deleteMany({
              where: { id: { in: invalidEnrollmentIds } },
            });
          }
        }
      }

      return updatedTemplate;
    });

    return ok(updated, "Evaluation template updated");
  },
  ["ADMIN"],
);

// DELETE /api/admin/evaluation-templates/[id] — soft-delete
export const DELETE = withHandler(
  async (_req, { params, user }) => {
    const existing = await prisma.evaluationTemplate.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { syncedSubject: { include: { teachers: { include: { user: { select: { id: true } } } } } } },
    });
    if (!existing) return notFound("Evaluation template not found");

    // Teachers can only delete their own subject's templates
    if (user.role === "TEACHER" && !existing.syncedSubject.teachers.some(t => t.user?.id === user.id)) {
      return notFound("Evaluation template not found");
    }

    // Published evaluations are locked — any non-DRAFT student result means
    // marks were submitted, so the template can no longer be deleted.
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
