import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, noContent, notFound, ok } from "@/lib/response";
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
      },
      include: {
        syncedSubject: { select: { id: true, name: true, gradeLevel: true } },
        gradeConfig: { select: { id: true, gradeLevel: true, academicYear: { select: { id: true, name: true } } } },
      },
    });

    return ok(updated, "Evaluation updated");
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
