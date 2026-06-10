import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, conflict, created, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { createReExamScheduleSchema } from "@/lib/schemas";

// GET /api/admin/re-exam-schedules
export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const schedules = await prisma.reExamSchedule.findMany({
      where: {
        ...(status && {
          status: status as "SCHEDULED" | "COMPLETED" | "CANCELLED",
        }),
      },
      include: {
        evaluationTemplate: {
          include: {
            syncedSubject: { select: { id: true, name: true } },
            gradeConfig: {
              select: {
                gradeLevel: true,
                academicYear: { select: { name: true } },
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { scheduledDate: "asc" },
    });

    return ok(schedules);
  },
  ["ADMIN"],
);

// POST /api/admin/re-exam-schedules
export const POST = withHandler(
  async (req: NextRequest) => {
    const body = createReExamScheduleSchema.parse(await req.json());

    if (body.passMarks > body.fullMarks) {
      return badRequest("passMarks cannot exceed fullMarks");
    }

    // Only one re-exam schedule per evaluation template
    const existing = await prisma.reExamSchedule.findUnique({
      where: { evaluationTemplateId: body.evaluationTemplateId },
    });
    if (existing) {
      return conflict(
        "A re-exam is already scheduled for this evaluation template",
      );
    }

    // Ensure the evaluation template exists and has failing students
    const template = await prisma.evaluationTemplate.findUnique({
      where: { id: body.evaluationTemplateId },
    });
    if (!template) return badRequest("Evaluation template not found");

    const schedule = await prisma.reExamSchedule.create({
      data: body,
      include: { evaluationTemplate: { include: { syncedSubject: true } } },
    });

    return created(schedule, "Re-exam schedule created");
  },
  ["ADMIN"],
);
