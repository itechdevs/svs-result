import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

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
    return ok([]);
  }

  const results = await prisma.studentObservationResult.findMany({
    where: {
      examId,
      syncedStudent: {
        class: className,
      },
    },
    select: {
      id: true,
      syncedStudentId: true,
      observationItemId: true,
      selectedOption: true,
      remarks: true,
    },
  });

  return ok(results);
}, ["TEACHER"]);

export const POST = withHandler(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const { examId, results } = body as {
    examId: string;
    results: { syncedStudentId: string; observationItemId: string; selectedOption: string }[];
  };

  if (!examId || !results?.length) {
    return badRequest("examId and results array are required");
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
    return badRequest("You are not a class teacher");
  }

  const saved = await prisma.$transaction(
    results.map((r) =>
      prisma.studentObservationResult.upsert({
        where: {
          syncedStudentId_observationItemId_examId: {
            syncedStudentId: r.syncedStudentId,
            observationItemId: r.observationItemId,
            examId,
          },
        },
        update: {
          selectedOption: r.selectedOption,
          enteredById: user.id,
        },
        create: {
          syncedStudentId: r.syncedStudentId,
          observationItemId: r.observationItemId,
          examId,
          selectedOption: r.selectedOption,
          enteredById: user.id,
        },
      }),
    ),
  );

  return ok({ count: saved.length }, "Observation results saved");
}, ["TEACHER"]);
