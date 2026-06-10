import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, noContent, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { updateUserSchema } from "@/lib/schemas";

// GET /api/admin/users/[id]
export const GET = withHandler(
  async (_req, { params }) => {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        syncedTeacher: { select: { id: true, name: true, sourceId: true } },
        teacherAssignments: {
          select: {
            id: true,
            gradeLevel: true,
            syncedSubjectId: true,
            academicYearId: true,
            academicYear: { select: { name: true } },
          },
        },
      },
    });
    if (!user) return notFound("User not found");
    return ok(user);
  },
  ["ADMIN"],
);

// PATCH /api/admin/users/[id]
export const PATCH = withHandler(
  async (req: NextRequest, { params }) => {
    const body = updateUserSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("User not found");

    if (body.syncedTeacherId) {
      const teacher = await prisma.syncedTeacher.findUnique({
        where: { id: body.syncedTeacherId },
        include: { user: true },
      });
      if (!teacher) return badRequest("SyncedTeacher not found");
      if (teacher.user && teacher.user.id !== params.id) {
        return badRequest("Teacher already linked to another account");
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: body,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return ok(user, "User updated");
  },
  ["ADMIN"],
);

// DELETE /api/admin/users/[id] — soft-deactivate
export const DELETE = withHandler(
  async (_req, { params, user: actor }) => {
    if (params.id === actor.id) {
      return badRequest("Cannot deactivate your own account");
    }

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("User not found");

    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return noContent();
  },
  ["ADMIN"],
);
