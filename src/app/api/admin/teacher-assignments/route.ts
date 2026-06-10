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

    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        ...(query.userId && { userId: query.userId }),
        ...(query.gradeLevel && { gradeLevel: query.gradeLevel }),
        ...(query.academicYearId && { academicYearId: query.academicYearId }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        academicYear: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(assignments);
  },
  ["ADMIN"],
);

// POST /api/admin/teacher-assignments
export const POST = withHandler(
  async (req: NextRequest, { user }) => {
    const body = createTeacherAssignmentSchema.parse(await req.json());

    // Ensure the user is a TEACHER
    const targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
    });
    if (!targetUser) return badRequest("User not found");
    if (targetUser.role !== "TEACHER") {
      return badRequest("Assignments can only be made to TEACHER role users");
    }

    // Check duplicate
    const existing = await prisma.teacherAssignment.findUnique({
      where: {
        userId_gradeLevel_syncedSubjectId_academicYearId: {
          userId: body.userId,
          gradeLevel: body.gradeLevel,
          syncedSubjectId: body.syncedSubjectId ?? null,
          academicYearId: body.academicYearId,
        },
      },
    });
    if (existing) return conflict("This teacher assignment already exists");

    const assignment = await prisma.teacherAssignment.create({
      data: { ...body, assignedBy: user.id },
      include: {
        user: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
      },
    });

    return created(assignment, "Teacher assignment created");
  },
  ["ADMIN"],
);
