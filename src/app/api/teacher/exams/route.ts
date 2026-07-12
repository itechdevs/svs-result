import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

export const GET = withHandler(async (_req, { user }) => {
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      syncedTeacher: {
        select: { classTeacherClassName: true },
      },
    },
  });

  const className = fullUser?.syncedTeacher?.classTeacherClassName;
  if (!className) {
    return ok([]);
  }

  const trimmed = className.trim();
  const exams = await prisma.exam.findMany({
    where: {
      isActive: true,
      gradeLevel: {
        equals: trimmed,
        mode: "insensitive",
      },
    },
    include: {
      academicYear: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ academicYearId: "desc" }, { name: "asc" }],
  });

  return ok(exams);
}, ["TEACHER"]);