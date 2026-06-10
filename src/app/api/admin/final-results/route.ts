import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { gradeLevelSchema, paginationSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

const querySchema = paginationSchema.extend({
  academicYearId: z.string().cuid().optional(),
  gradeLevel: gradeLevelSchema.optional(),
  resultStatus: z
    .enum(["PENDING", "PROMOTED", "FAILED", "PROBATION", "WITHHELD"])
    .optional(),
  isPublished: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

// GET /api/admin/final-results
export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const where = {
      ...(query.academicYearId && { academicYearId: query.academicYearId }),
      ...(query.resultStatus && { resultStatus: query.resultStatus }),
      ...(query.isPublished !== undefined && {
        isPublished: query.isPublished,
      }),
      ...(query.gradeLevel && {
        syncedStudent: { grade: query.gradeLevel },
      }),
    };

    const [total, results] = await prisma.$transaction([
      prisma.finalResult.count({ where }),
      prisma.finalResult.findMany({
        where,
        include: {
          syncedStudent: {
            select: {
              id: true,
              name: true,
              rollNumber: true,
              grade: true,
              section: true,
            },
          },
          academicYear: { select: { id: true, name: true } },
          _count: { select: { subjectResults: true } },
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ syncedStudent: { grade: "asc" } }, { classRank: "asc" }],
      }),
    ]);

    return ok({ results, total, page: query.page, limit: query.limit });
  },
  ["ADMIN"],
);
