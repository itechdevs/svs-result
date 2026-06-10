/**
 * POST /api/admin/re-exam-schedules/[id]/complete
 * Admin marks the re-exam as COMPLETED. Verifies all entered results.
 */
import { withHandler } from "@/lib/handlers";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";

export const POST = withHandler(
  async (_req, { params, user }) => {
    const schedule = await prisma.reExamSchedule.findUnique({
      where: { id: params.id },
      include: {
        enrollments: { include: { reExamResult: true } },
      },
    });
    if (!schedule) return notFound("Re-exam schedule not found");
    if (schedule.status !== "SCHEDULED") {
      return badRequest(`Re-exam is already '${schedule.status}'`);
    }

    const eligibleEnrollments = schedule.enrollments.filter(
      (e) => e.isEligible,
    );
    const missingResults = eligibleEnrollments.filter((e) => !e.reExamResult);

    if (missingResults.length > 0) {
      return badRequest(
        `${missingResults.length} eligible student(s) still have no result entered`,
      );
    }

    const now = new Date();

    await prisma.$transaction([
      // Verify all draft re-exam results
      prisma.reExamResult.updateMany({
        where: {
          reExamEnrollment: { reExamScheduleId: params.id },
          status: "DRAFT",
        },
        data: {
          status: "VERIFIED",
          verifiedById: user.id,
          verifiedAt: now,
        },
      }),
      // Mark schedule as complete
      prisma.reExamSchedule.update({
        where: { id: params.id },
        data: { status: "COMPLETED" },
      }),
    ]);

    return ok({ scheduleId: params.id }, "Re-exam marked as completed");
  },
  ["ADMIN"],
);
