/**
 * POST /api/admin/publish
 * ADMIN publishes final results for a grade/year.
 * Prerequisite: FinalResult must exist for each student (aggregation done).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, ok, unprocessable } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { publishResultsSchema } from "@/lib/schemas";

export const POST = withHandler(
  async (req: NextRequest, { user }) => {
    const body = publishResultsSchema.parse(await req.json());

    // Check aggregation has been run
    const pendingFinals = await prisma.finalResult.count({
      where: {
        academicYearId: body.academicYearId,
        resultStatus: "PENDING",
        syncedStudent: { class: body.gradeLevel },
        ...(body.syncedStudentIds && {
          syncedStudentId: { in: body.syncedStudentIds },
        }),
      },
    });

    if (pendingFinals > 0) {
      return unprocessable(
        `${pendingFinals} result(s) are still PENDING. Run aggregation first.`,
      );
    }

    const toPublish = await prisma.finalResult.findMany({
      where: {
        academicYearId: body.academicYearId,
        isPublished: false,
        syncedStudent: { class: body.gradeLevel },
        ...(body.syncedStudentIds && {
          syncedStudentId: { in: body.syncedStudentIds },
        }),
      },
      select: { id: true },
    });

    if (toPublish.length === 0) {
      return badRequest("No unpublished results found for this grade/year");
    }

    const now = new Date();

    // Compute class ranks (by percentage desc) before publishing
    const forRanking = await prisma.finalResult.findMany({
      where: {
        academicYearId: body.academicYearId,
        syncedStudent: { class: body.gradeLevel },
      },
      orderBy: { percentage: "desc" },
      select: { id: true },
    });

    const rankUpdates = forRanking.map((r, idx) =>
      prisma.finalResult.update({
        where: { id: r.id },
        data: { classRank: idx + 1 },
      }),
    );

    const publishUpdates = toPublish.map((r) =>
      prisma.finalResult.update({
        where: { id: r.id },
        data: {
          isPublished: true,
          publishedAt: now,
          publishedById: user.id,
          ...(body.remarks && { remarks: body.remarks }),
        },
      }),
    );

    await prisma.$transaction([...rankUpdates, ...publishUpdates]);

    return ok(
      { published: toPublish.length },
      `${toPublish.length} result(s) published successfully`,
    );
  },
  ["ADMIN"],
);
