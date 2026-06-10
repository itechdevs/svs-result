/**
 * GET  — list enrollments for a re-exam
 * POST — enroll students (admin only)
 *        Only students who failed the original evaluation are eligible.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, created, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { enrollStudentsSchema } from "@/lib/schemas";

export const GET = withHandler(
  async (_req, { params }) => {
    const schedule = await prisma.reExamSchedule.findUnique({
      where: { id: params.id },
    });
    if (!schedule) return notFound("Re-exam schedule not found");

    const enrollments = await prisma.reExamEnrollment.findMany({
      where: { reExamScheduleId: params.id },
      include: {
        reExamResult: true,
      },
    });

    return ok(enrollments);
  },
  ["ADMIN"],
);

export const POST = withHandler(
  async (req: NextRequest, { params }) => {
    const { syncedStudentIds } = enrollStudentsSchema.parse(await req.json());

    const schedule = await prisma.reExamSchedule.findUnique({
      where: { id: params.id },
      include: { evaluationTemplate: true },
    });
    if (!schedule) return notFound("Re-exam schedule not found");
    if (schedule.status !== "SCHEDULED") {
      return badRequest("Can only enroll students in a SCHEDULED re-exam");
    }

    // Validate: students must have failed the original evaluation
    const failedResults = await prisma.studentEvaluationResult.findMany({
      where: {
        evaluationTemplateId: schedule.evaluationTemplateId,
        syncedStudentId: { in: syncedStudentIds },
        isPassed: false,
      },
      select: { syncedStudentId: true },
    });

    const eligibleIds = new Set(failedResults.map((r) => r.syncedStudentId));
    const ineligible = syncedStudentIds.filter((id) => !eligibleIds.has(id));

    if (ineligible.length > 0) {
      return badRequest(
        `${ineligible.length} student(s) are not eligible (must have failed the original evaluation): ${ineligible.join(", ")}`,
      );
    }

    // Upsert enrollments (idempotent)
    const results = await prisma.$transaction(
      syncedStudentIds.map((syncedStudentId) =>
        prisma.reExamEnrollment.upsert({
          where: {
            reExamScheduleId_syncedStudentId: {
              reExamScheduleId: params.id,
              syncedStudentId,
            },
          },
          create: { reExamScheduleId: params.id, syncedStudentId },
          update: { isEligible: true },
        }),
      ),
    );

    return created(
      { count: results.length },
      `${results.length} student(s) enrolled`,
    );
  },
  ["ADMIN"],
);
