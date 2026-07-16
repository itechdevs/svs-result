import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";
import { updateGradeConfigSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

// PATCH /api/admin/grade-configs/[id]
export const PATCH = withHandler(
  async (req: NextRequest, { params }) => {
    const { id } = params;
    const body = updateGradeConfigSchema.parse(await req.json());

    const config = await prisma.gradeConfig.update({
      where: { id },
      data: {
        ...(body.gradeType !== undefined && { gradeType: body.gradeType }),
        ...(body.passCriteria !== undefined && { passCriteria: body.passCriteria }),
      },
      include: { gradeScales: { orderBy: { minPercent: "asc" } } },
    });

    return ok(config, "Grade config updated");
  },
  ["ADMIN"],
);

// DELETE /api/admin/grade-configs/[id]
export const DELETE = withHandler(
  async (_req: NextRequest, { params }) => {
    const { id } = params;

    const config = await prisma.gradeConfig.findUnique({ where: { id } });
    if (!config) return notFound("Grade config not found");

    await prisma.gradeConfig.delete({ where: { id } });
    return ok(null, "Grade config deleted");
  },
  ["ADMIN"],
);
