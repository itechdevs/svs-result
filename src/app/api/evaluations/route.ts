/**
 * /api/evaluations
 *
 * GET  — List evaluation results (filtered)
 * POST — Bulk upsert marks for a template (Teacher or Admin)
 *
 * Teachers can only write to templates in their assigned grades/subjects.
 */
import { NextRequest } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";

import { badRequest, created, forbidden, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import {
  bulkUpsertEvaluationResultsSchema,
  listEvaluationResultsSchema,
} from "@/lib/schemas";

// GET /api/evaluations
export const GET = withHandler(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const query = listEvaluationResultsSchema.parse(
    Object.fromEntries(searchParams),
  );

  // Teachers can only see results for their assigned subjects
  let allowedTemplateIds: string[] | undefined;
  if (user.role === "TEACHER") {
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { syncedTeacherId: true },
    });

    if (currentUser?.syncedTeacherId) {
      const templates = await prisma.evaluationTemplate.findMany({
        where: {
          syncedSubject: { teacherId: currentUser.syncedTeacherId },
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });
      allowedTemplateIds = templates.map((t) => t.id);
    } else {
      allowedTemplateIds = [];
    }
  }

  const results = await prisma.studentEvaluationResult.findMany({
    where: {
      deletedAt: null,
      ...(query.evaluationTemplateId && {
        evaluationTemplateId: query.evaluationTemplateId,
      }),
      ...(query.syncedStudentId && { syncedStudentId: query.syncedStudentId }),
      ...(query.status && { status: query.status }),
      ...(allowedTemplateIds && {
        evaluationTemplateId: { in: allowedTemplateIds },
      }),
    },
    include: {
      syncedStudent: {
        select: {
          id: true,
          name: true,
          rollNumber: true,
          grade: true,
          section: true,
        },
      },
      evaluationTemplate: {
        select: {
          id: true,
          name: true,
          fullMarks: true,
          passMarks: true,
          weightage: true,
        },
      },
      enteredBy: { select: { id: true, name: true } },
      verifiedBy: { select: { id: true, name: true } },
    },
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    orderBy: { createdAt: "desc" },
  });

  return ok(results);
});

// POST /api/evaluations — bulk upsert marks
export const POST = withHandler(async (req: NextRequest, { user }) => {
  const body = bulkUpsertEvaluationResultsSchema.parse(await req.json());

  const template = await prisma.evaluationTemplate.findUnique({
    where: { id: body.evaluationTemplateId, isActive: true, deletedAt: null },
    include: { gradeConfig: true },
  });
  if (!template) return badRequest("Evaluation template not found or inactive");

  // Teacher permission check
  if (user.role === "TEACHER") {
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { syncedTeacherId: true },
    });

    if (!currentUser?.syncedTeacherId) {
      return forbidden("Teacher account not linked to a synced teacher");
    }

    const subject = await prisma.syncedSubject.findUnique({
      where: { id: template.syncedSubjectId },
      select: { teacherId: true },
    });

    if (subject?.teacherId !== currentUser.syncedTeacherId) {
      return forbidden("You are not assigned to this subject");
    }
  }

  // Prevent writes to already-locked results
  const lockedCount = await prisma.studentEvaluationResult.count({
    where: {
      evaluationTemplateId: body.evaluationTemplateId,
      syncedStudentId: { in: body.results.map((r) => r.syncedStudentId) },
      status: "LOCKED",
    },
  });
  if (lockedCount > 0) {
    return badRequest(
      `${lockedCount} result(s) are locked and cannot be modified`,
    );
  }

  const now = new Date();

  const upserts = body.results.map((r) =>
    prisma.studentEvaluationResult.upsert({
      where: {
        syncedStudentId_evaluationTemplateId: {
          syncedStudentId: r.syncedStudentId,
          evaluationTemplateId: body.evaluationTemplateId,
        },
      },
      create: {
        syncedStudentId: r.syncedStudentId,
        evaluationTemplateId: body.evaluationTemplateId,
        enteredById: user.id,
        marksObtained: r.isAbsent ? null : new Decimal(r.marksObtained!),
        isAbsent: r.isAbsent,
        remarks: r.remarks,
        status: "DRAFT",
      },
      update: {
        marksObtained: r.isAbsent ? null : new Decimal(r.marksObtained!),
        isAbsent: r.isAbsent,
        remarks: r.remarks,
        enteredById: user.id,
        updatedAt: now,
      },
    }),
  );

  await prisma.$transaction(upserts);

  return created(
    { count: body.results.length },
    `${body.results.length} result(s) saved as DRAFT`,
  );
});
