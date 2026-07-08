import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

export const GET = withHandler(async (_req, { user }) => {
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      syncedTeacher: {
        select: {
          classTeacherId: true,
          classTeacherClassName: true,
        },
      },
    },
  });

  const syncedTeacher = fullUser?.syncedTeacher;
  if (!syncedTeacher?.classTeacherId || !syncedTeacher.classTeacherClassName) {
    return notFound("You are not assigned as a class teacher");
  }

  const students = await prisma.syncedStudent.findMany({
    where: {
      class: { equals: syncedTeacher.classTeacherClassName, mode: "insensitive" },
      isActive: true,
    },
    select: {
      id: true,
      sourceId: true,
      name: true,
      rollNumber: true,
    },
    orderBy: { rollNumber: "asc" },
  });

  return ok({
    classTeacherId: syncedTeacher.classTeacherId,
    classTeacherClassName: syncedTeacher.classTeacherClassName,
    students,
  });
}, ["TEACHER"]);
