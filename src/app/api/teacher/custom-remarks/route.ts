import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { saveCustomRemarksSchema } from "@/lib/schemas";

export const GET = withHandler(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");

  if (!examId) {
    return badRequest("examId is required");
  }

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
    return ok({ remarks: {} });
  }

  const remarks = await prisma.studentRemark.findMany({
    where: {
      examId,
      syncedStudent: {
        class: className,
        isActive: true,
      },
    },
    select: {
      id: true,
      syncedStudentId: true,
      remark: true,
    },
  });

  const remarkMap: Record<string, { id: string; remark: string }> = {};
  for (const r of remarks) {
    remarkMap[r.syncedStudentId] = { id: r.id, remark: r.remark };
  }

  return ok({ remarks: remarkMap });
}, ["TEACHER"]);

export const POST = withHandler(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parseResult = saveCustomRemarksSchema.safeParse(body);

  if (!parseResult.success) {
    return badRequest(parseResult.error.errors[0]?.message || "Invalid request");
  }

  const { examId, remarks } = parseResult.data;

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      syncedTeacher: {
        select: { classTeacherClassName: true },
      },
    },
  });

  if (!fullUser?.syncedTeacher?.classTeacherClassName) {
    return badRequest("You are not a class teacher");
  }

  const affectedStudentIds = remarks.map((r) => r.syncedStudentId);

  await prisma.$transaction(async (tx) => {
    for (const r of remarks) {
      if (r.remark.trim().length === 0) {
        await tx.studentRemark.deleteMany({
          where: {
            syncedStudentId: r.syncedStudentId,
            examId,
          },
        });
      } else {
        await tx.studentRemark.upsert({
          where: {
            syncedStudentId_examId: {
              syncedStudentId: r.syncedStudentId,
              examId,
            },
          },
          update: {
            remark: r.remark,
            enteredById: user.id,
          },
          create: {
            syncedStudentId: r.syncedStudentId,
            examId,
            remark: r.remark,
            enteredById: user.id,
          },
        });
      }
    }
  });

  return ok({ count: remarks.length }, "Custom remarks saved");
}, ["TEACHER"]);
