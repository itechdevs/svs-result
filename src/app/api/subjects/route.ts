import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

const querySchema = z.object({
  gradeLevel: z.string().optional(),
  isActive: z.string().transform((v) => v === "true").optional(),
  search: z.string().optional(),
});

// GET /api/subjects
export const GET = withHandler(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  // Teachers can only see their own subjects
  let allowedSubjectIds: string[] | undefined;
  if (user.role === "TEACHER") {
    const teacher = await prisma.user.findUnique({
      where: { id: user.id },
      select: { syncedTeacher: { select: { subjects: { select: { id: true } } } } },
    });
    allowedSubjectIds = teacher?.syncedTeacher?.subjects.map(s => s.id) ?? [];
  }

  const subjects = await prisma.syncedSubject.findMany({
    where: {
      ...(allowedSubjectIds ? { id: { in: allowedSubjectIds } } : {}),
      ...(query.gradeLevel ? { gradeLevel: query.gradeLevel } : {}),
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
