import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { gradeLevelSchema, paginationSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

const querySchema = paginationSchema.extend({
  grade: gradeLevelSchema.optional(),
  section: z.string().optional(),
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

// GET /api/students
export const GET = withHandler(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  // Teachers can only see students in their assigned grades
  let allowedGrades: string[] | undefined;
  if (user.role === "TEACHER") {
    const assignments = await prisma.teacherAssignment.findMany({
      where: { userId: user.id },
      select: { gradeLevel: true },
      distinct: ["gradeLevel"],
    });
    allowedGrades = assignments.map((a) => a.gradeLevel);
  }

  const where = {
    ...(query.grade
      ? { grade: query.grade }
      : allowedGrades
        ? { grade: { in: allowedGrades } }
        : {}),
    ...(query.section && { section: query.section }),
    ...(query.isActive !== undefined && { isActive: query.isActive }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" as const } },
        {
          rollNumber: { contains: query.search, mode: "insensitive" as const },
        },
      ],
    }),
  };

  const [total, students] = await prisma.$transaction([
    prisma.syncedStudent.count({ where }),
    prisma.syncedStudent.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: [{ grade: "asc" }, { rollNumber: "asc" }],
    }),
  ]);

  return ok({ students, total, page: query.page, limit: query.limit });
});
