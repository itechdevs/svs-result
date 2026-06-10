import { withHandler } from "@/lib/handlers";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

// GET /api/auth/me — returns the current user's profile
export const GET = withHandler(async (_req, { user }) => {
  const full = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      syncedTeacher: {
        select: { id: true, name: true, sourceId: true },
      },
      teacherAssignments: {
        select: {
          id: true,
          gradeLevel: true,
          syncedSubjectId: true,
          academicYearId: true,
        },
      },
    },
  });
  return ok(full);
});
