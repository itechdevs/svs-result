import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, conflict, created, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { z } from "zod";

const listExamsSchema = z.object({
  academicYearId: z.string().optional(),
  gradeLevel: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
});

const createExamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  academicYearId: z.string().cuid(),
  gradeLevel: z.string().min(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = listExamsSchema.parse(Object.fromEntries(searchParams));

    const exams = await prisma.exam.findMany({
      where: {
        isActive: true,
        ...(query.academicYearId && { academicYearId: query.academicYearId }),
        ...(query.gradeLevel && { gradeLevel: query.gradeLevel }),
        ...(query.isActive !== undefined && { isActive: query.isActive }),
      },
      include: {
        academicYear: {
          select: { id: true, name: true },
        },
        _count: {
          select: { evaluationTemplates: true },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });

    return ok(exams);
  },
  ["ADMIN", "TEACHER"],
);

export const POST = withHandler(
  async (req: NextRequest) => {
    const body = createExamSchema.parse(await req.json());

    const academicYear = await prisma.academicYear.findUnique({
      where: { id: body.academicYearId },
    });
    if (!academicYear) return badRequest("Academic year not found");

    const duplicate = await prisma.exam.findFirst({
      where: {
        academicYearId: body.academicYearId,
        gradeLevel: body.gradeLevel,
        name: body.name,
        isActive: true,
      },
    });
    if (duplicate) {
      return conflict("An exam with this name already exists for this grade level and academic year");
    }

    const exam = await prisma.exam.create({
      data: body,
      include: {
        academicYear: { select: { id: true, name: true } },
      },
    });

    return created(exam, "Exam created");
  },
  ["ADMIN"],
);
