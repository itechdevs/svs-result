import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { z } from "zod";

const updateExamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const GET = withHandler(async (_req, { params }) => {
  const exam = await prisma.exam.findUnique({
    where: { id: params.id },
    include: {
      academicYear: true,
      evaluationTemplates: {
        include: {
          syncedSubject: true,
        },
      },
    },
  });

  if (!exam) return notFound("Exam not found");
  return ok(exam);
}, ["ADMIN", "TEACHER"]);

export const PATCH = withHandler(
  async (req: NextRequest, { params }) => {
    const body = updateExamSchema.parse(await req.json());

    const exam = await prisma.exam.update({
      where: { id: params.id },
      data: body,
      include: {
        academicYear: true,
      },
    });

    return ok(exam, "Exam updated");
  },
  ["ADMIN"],
);

export const DELETE = withHandler(
  async (_req, { params }) => {
    const exam = await prisma.exam.findUnique({ where: { id: params.id } });
    if (!exam) return notFound("Exam not found");

    await prisma.exam.delete({ where: { id: params.id } });

    return ok(null, "Exam deleted");
  },
  ["ADMIN"],
);
