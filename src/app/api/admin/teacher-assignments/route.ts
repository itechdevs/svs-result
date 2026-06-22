import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

import { badRequest, conflict, created, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import {
  createTeacherAssignmentSchema,
  listTeacherAssignmentsSchema,
} from "@/lib/schemas";

// GET /api/admin/teacher-assignments
export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = listTeacherAssignmentsSchema.parse(
      Object.fromEntries(searchParams),
    );

    const subjects = await prisma.syncedSubject.findMany({
      where: {
        teachers: { some: {} },
        ...(query.gradeLevel && { gradeLevel: query.gradeLevel }),
      },
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { gradeLevel: "asc" },
    });

    const assignments = subjects.flatMap(s => s.teachers.map(teacher => ({
      id: `${s.id}-${teacher.id}`,
      userId: teacher.user?.id,
      gradeLevel: s.gradeLevel,
      syncedSubjectId: s.id,
      academicYearId: query.academicYearId || "all",
      user: teacher.user,
    }))).filter(a => !query.userId || a.userId === query.userId);

    return ok(assignments);
  },
  ["ADMIN"],
);

// POST /api/admin/teacher-assignments
export const POST = withHandler(
  async (req: NextRequest) => {
    const body = createTeacherAssignmentSchema.parse(await req.json());

    const targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
    });
    if (!targetUser) return badRequest("User not found");
    if (targetUser.role !== "TEACHER") {
      return badRequest("Assignments can only be made to TEACHER role users");
    }
    if (!targetUser.syncedTeacherId) {
      return badRequest("User must be linked to a teacher");
    }
    if (!body.syncedSubjectId) {
      return badRequest("Subject is required");
    }

    const subject = await prisma.syncedSubject.update({
      where: { id: body.syncedSubjectId },
      data: { teachers: { connect: { id: targetUser.syncedTeacherId } } },
      include: { teachers: { include: { user: true } } },
    });

    return created({
      id: subject.id,
      userId: targetUser.id,
      gradeLevel: subject.gradeLevel,
      syncedSubjectId: subject.id,
      user: targetUser,
    }, "Teacher assignment created");
  },
  ["ADMIN"],
);
