import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { bulkUpsertGradeScalesSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/grade-configs/[id]/grade-scales
export const GET = withHandler(
  async (_req: NextRequest, { params }) => {
    const scales = await prisma.gradeScale.findMany({
      where: { gradeConfigId: params.id },
      orderBy: { minPercent: "asc" },
    });
    return ok(scales);
  },
  ["ADMIN"],
);

// POST /api/admin/grade-configs/[id]/grade-scales (bulk upsert)
export const POST = withHandler(
  async (req: NextRequest, { params }) => {
    const { scales } = bulkUpsertGradeScalesSchema.parse(await req.json());

    // Delete existing scales, insert new ones
    await prisma.$transaction([
      prisma.gradeScale.deleteMany({ where: { gradeConfigId: params.id } }),
      ...scales.map((s) =>
        prisma.gradeScale.create({
          data: { ...s, gradeConfigId: params.id },
        }),
      ),
    ]);

    const updated = await prisma.gradeScale.findMany({
      where: { gradeConfigId: params.id },
      orderBy: { minPercent: "asc" },
    });
    return ok(updated, "Grade scales updated");
  },
  ["ADMIN"],
);
