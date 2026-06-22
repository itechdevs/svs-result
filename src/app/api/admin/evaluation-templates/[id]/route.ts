import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, noContent, notFound, ok } from "@/lib/response";
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
        syncedSubject: true,
        gradeConfig: true,
        exam: { select: { id: true, name: true } },
      },
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

    await prisma.evaluationTemplate.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return noContent();
  },
  ["ADMIN", "TEACHER"],
);
