import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, noContent, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { updateAcademicYearSchema } from "@/lib/schemas";

export const GET = withHandler(
  async (_req, { params }) => {
    const year = await prisma.academicYear.findUnique({
      where: { id: params.id },
      include: {
        gradeConfigs: {
          include: {
            gradeScales: true,
            _count: { select: { evaluationTemplates: true } },
          },
        },
      },
    });
    if (!year) return notFound("Academic year not found");
    return ok(year);
  },
  ["ADMIN"],
);

export const PATCH = withHandler(
  async (req: NextRequest, { params }) => {
    const body = updateAcademicYearSchema.parse(await req.json());

    const existing = await prisma.academicYear.findUnique({
      where: { id: params.id },
    });
    if (!existing) return notFound("Academic year not found");

    if (body.isCurrent) {
      await prisma.academicYear.updateMany({
        where: { isCurrent: true, id: { not: params.id } },
        data: { isCurrent: false },
      });
    }

    const year = await prisma.academicYear.update({
      where: { id: params.id },
      data: body,
    });
    return ok(year, "Academic year updated");
  },
  ["ADMIN"],
);

export const DELETE = withHandler(
  async (_req, { params }) => {
    const existing = await prisma.academicYear.findUnique({
      where: { id: params.id },
      include: { _count: { select: { finalResults: true } } },
    });
    if (!existing) return notFound("Academic year not found");
    if (existing._count.finalResults > 0) {
      return badRequest(
        "Cannot delete an academic year that has published results",
      );
    }

    await prisma.academicYear.delete({ where: { id: params.id } });
    return noContent();
  },
  ["ADMIN"],
);
