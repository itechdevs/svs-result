import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// DELETE /api/admin/grade-configs/[id]/grade-scales/[scaleId]
export const DELETE = withHandler(
  async (_req: NextRequest, { params }) => {
    const scale = await prisma.gradeScale.findUnique({
      where: { id: params.scaleId },
    });
    if (!scale || scale.gradeConfigId !== params.id) {
      return notFound("Grade scale not found");
    }

    await prisma.gradeScale.delete({ where: { id: params.scaleId } });
    return ok(null, "Grade scale deleted");
  },
  ["ADMIN"],
);
