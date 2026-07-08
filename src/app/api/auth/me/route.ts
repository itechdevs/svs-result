import { withHandler } from "@/lib/handlers";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";

// GET /api/auth/me — returns the current user's profile
export const GET = withHandler(async (_req, { user }) => {
  const full = await prisma.user.findUnique({
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
        select: {
          id: true,
          name: true,
          sourceId: true,
          classTeacherId: true,
          classTeacherClassName: true,
          subjects: {
            where: { isActive: true },
            select: { id: true, name: true, gradeLevel: true },
            orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
          },
        },
      },
    },
  });
  if (!full) return notFound("User not found");
  return ok(full);
});
