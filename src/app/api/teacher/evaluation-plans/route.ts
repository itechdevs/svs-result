import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest, created, forbidden } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

const createPlanSchema = z.object({
  syncedSubjectId: z.string().min(1),
  gradeLevel: z.string().min(1),
  examId: z.string().cuid().optional(),
  name: z.string().min(1).max(100),
  fullMarks: z.number().min(0),
  passMarks: z.number().min(0),
  weightage: z.number().min(0).max(100),
  scheduledDate: z.coerce.date().optional(),
  displayOrder: z.number().int().min(0).default(0),
});

// POST /api/teacher/evaluation-plans
// Creates an evaluation template; auto-provisions a default AcademicYear + GradeConfig if none exists.
export const POST = withHandler(async (req: NextRequest, { user }) => {
  const body = createPlanSchema.parse(await req.json());

  // Verify subject exists and is assigned to this teacher
  const subject = await prisma.syncedSubject.findUnique({
    where: { id: body.syncedSubjectId },
    include: { teachers: { include: { user: { select: { id: true } } } } },
  });
  if (!subject) return badRequest("Subject not found");

  if (user.role === "TEACHER" && !subject.teachers.some(t => t.user?.id === user.id)) {
    return forbidden("You are not assigned to this subject");
  }

  // Find-or-create a default academic year
  let academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  if (!academicYear) {
    academicYear = await prisma.academicYear.upsert({
      where: { name: "Default" },
      update: {},
      create: {
        name: "Default",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        isCurrent: true,
      },
    });
  }

  // Find-or-create grade config for this year + grade level
  const gradeConfig = await prisma.gradeConfig.upsert({
    where: { academicYearId_gradeLevel: { academicYearId: academicYear.id, gradeLevel: body.gradeLevel } },
    update: {},
    create: { academicYearId: academicYear.id, gradeLevel: body.gradeLevel, gradeType: "DESCRIPTIVE" },
  });

  const template = await prisma.evaluationTemplate.upsert({
    where: {
      gradeConfigId_syncedSubjectId_name: {
        gradeConfigId: gradeConfig.id,
        syncedSubjectId: body.syncedSubjectId,
        name: body.name,
      },
    },
    update: {
      examId: body.examId,
      fullMarks: body.fullMarks,
      passMarks: body.passMarks,
      weightage: body.weightage,
      scheduledDate: body.scheduledDate,
      displayOrder: body.displayOrder,
      deletedAt: null,
      isActive: true,
    },
    create: {
      gradeConfigId: gradeConfig.id,
      syncedSubjectId: body.syncedSubjectId,
      examId: body.examId,
      name: body.name,
      fullMarks: body.fullMarks,
      passMarks: body.passMarks,
      weightage: body.weightage,
      scheduledDate: body.scheduledDate,
      displayOrder: body.displayOrder,
    },
    include: {
      syncedSubject: { select: { id: true, name: true, gradeLevel: true } },
      gradeConfig: { select: { id: true, gradeLevel: true } },
    },
  });

  return created(template, "Evaluation plan created");
});
