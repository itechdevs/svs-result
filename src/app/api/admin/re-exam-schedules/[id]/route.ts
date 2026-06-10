import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { updateReExamScheduleSchema } from "@/lib/schemas";

export const GET = withHandler(
  async (_req, { params }) => {
    const schedule = await prisma.reExamSchedule.findUnique({
      where: { id: params.id },
      include: {
        evaluationTemplate: {
          include: {
            syncedSubject: true,
            gradeConfig: { include: { academicYear: true } },
          },
        },
        enrollments: {
          include: {
            reExamResult: true,
          },
        },
      },
    });
    if (!schedule) return notFound("Re-exam schedule not found");
    return ok(schedule);
  },
  ["ADMIN"],
);

export const PATCH = withHandler(
  async (req: NextRequest, { params }) => {
    const body = updateReExamScheduleSchema.parse(await req.json());

    const existing = await prisma.reExamSchedule.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Re-exam schedule not found");

    if (existing.status === "COMPLETED") {
      return badRequest("Cannot modify a completed re-exam schedule");
    }

    const schedule = await prisma.reExamSchedule.update({
      where: { id: params.id },
      data: body,
    });

    return ok(schedule, "Re-exam schedule updated");
  },
  ["ADMIN"],
);
