import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { gradeLevelSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

const querySchema = z.object({
  gradeLevel: gradeLevelSchema.optional(),
  isActive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  search: z.string().optional(),
});

// GET /api/subjects
export const GET = withHandler(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  // Teachers can only see subjects in their assigned grades
  let allowedGrades: string[] | undefined;
  if (user.role === "TEACHER") {
    const assignments = await prisma.teacherAssignment.findMany({
      where: { userId: user.id },
      select: { gradeLevel: true },
      distinct: ["gradeLevel"],
    });
    allowedGrades = assignments.map((a) => a.gradeLevel);
  }

  const subjects = await prisma.syncedSubject.findMany({
    where: {
      ...(query.gradeLevel
        ? { gradeLevel: query.gradeLevel }
        : allowedGrades
          ? { gradeLevel: { in: allowedGrades } }
          : {}),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: "insensitive" as const } },
          { code: { contains: query.search, mode: "insensitive" as const } },
        ],
      }),
    },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });

  return ok(subjects);
});
