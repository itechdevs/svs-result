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

  if (!examId || !Array.isArray(results)) {
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


  const affectedStudentIds = [...new Set(results.map((r) => r.syncedStudentId))];

  // Build a set of "studentId|itemId" combos that are being saved now
  const incomingKeys = new Set(
    results.map((r) => `${r.syncedStudentId}|${r.observationItemId}`)
  );

  await prisma.$transaction(async (tx) => {
    // 1. Delete stale records: same student + exam but NOT in this save
    if (affectedStudentIds.length > 0) {
      const stale = await tx.studentObservationResult.findMany({
        where: {
          examId,
          syncedStudentId: { in: affectedStudentIds },
        },
        select: { id: true, syncedStudentId: true, observationItemId: true },
      });

      const staleIds = stale
        .filter((r) => !incomingKeys.has(`${r.syncedStudentId}|${r.observationItemId}`))
        .map((r) => r.id);

      if (staleIds.length > 0) {
        await tx.studentObservationResult.deleteMany({
          where: { id: { in: staleIds } },
        });
      }
    }

    // 2. Upsert the incoming results (only non-empty selections are sent)
    if (results.length > 0) {
      await Promise.all(
        results.map((r) =>
          tx.studentObservationResult.upsert({
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
          })
        )
      );
    }
  });

  return ok({ count: results.length }, "Observation results saved");
}, ["TEACHER"]);
