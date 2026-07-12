import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

/**
 * GET /api/admin/observations/results?examId=&class=
 *
 * Returns all StudentObservationResult records for a given exam and class,
 * grouped by student and including category/item metadata.
 *
 * Response shape:
 * {
 *   students: Array<{
 *     syncedStudentId: string;
 *     // Map of observationItem description → selectedOption
 *     // Also keyed by category title for grouping
 *     results: Array<{
 *       categoryTitle: string;
 *       itemDescription: string;
 *       selectedOption: string;
 *       remarks: string | null;
 *     }>
 *   }>
 * }
 */
export const GET = withHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  const className = searchParams.get("class");

  if (!examId) return badRequest("examId is required");
  if (!className) return badRequest("class is required");

  const raw = await prisma.studentObservationResult.findMany({
    where: {
      examId,
      syncedStudent: {
        class: { equals: className, mode: "insensitive" },
      },
    },
    select: {
      syncedStudentId: true,
      selectedOption: true,
      remarks: true,
      observationItem: {
        select: {
          description: true,
          category: {
            select: { title: true },
          },
        },
      },
    },
    orderBy: [
      { observationItem: { observationCategoryId: "asc" } },
      { observationItem: { displayOrder: "asc" } },
    ],
  });

  // Group by student
  const studentMap: Record<
    string,
    Array<{
      categoryTitle: string;
      itemDescription: string;
      selectedOption: string;
      remarks: string | null;
    }>
  > = {};

  for (const row of raw) {
    if (!studentMap[row.syncedStudentId]) studentMap[row.syncedStudentId] = [];
    studentMap[row.syncedStudentId].push({
      categoryTitle: row.observationItem.category.title,
      itemDescription: row.observationItem.description,
      selectedOption: row.selectedOption,
      remarks: row.remarks ?? null,
    });
  }

  const students = Object.entries(studentMap).map(([syncedStudentId, results]) => ({
    syncedStudentId,
    results,
  }));

  return ok({ students });
}, ["ADMIN"]);
