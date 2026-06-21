import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(20),
  class: z.string().optional(),
  section: z.string().optional(),
  search: z.string().optional(),
  isActive: z.string().transform((v) => v === "true").optional(),
});

// GET /api/students
export const GET = withHandler(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  // Teachers can only see students in their assigned grades.
  // If an explicit class is requested, trust it (teacher navigated via their own sidebar).
  let allowedGrades: string[] | undefined;
  if (user.role === "TEACHER" && !query.class) {
    const teacher = await prisma.user.findUnique({
      where: { id: user.id },
      select: { syncedTeacher: { select: { subjects: { select: { gradeLevel: true }, distinct: ["gradeLevel"] } } } },
    });
    allowedGrades = teacher?.syncedTeacher?.subjects.map(s => s.gradeLevel) ?? [];
  }

  const where = {
    ...(query.class
      ? { class: query.class }
      : allowedGrades
        ? { class: { in: allowedGrades } }
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
      orderBy: [{ name: "asc" }],
    }),
  ]);

  return ok({ students, total, page: query.page, limit: query.limit });
});
