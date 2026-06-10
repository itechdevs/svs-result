import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { conflict, created, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { createGradeConfigSchema } from "@/lib/schemas";

// GET /api/admin/grade-configs?academicYearId=&gradeLevel=
export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId") ?? undefined;
    const gradeLevel = searchParams.get("gradeLevel") ?? undefined;

    const configs = await prisma.gradeConfig.findMany({
      where: {
        ...(academicYearId && { academicYearId }),
        ...(gradeLevel && { gradeLevel }),
      },
      include: {
        gradeScales: { orderBy: { minPercent: "asc" } },
        academicYear: { select: { id: true, name: true } },
        _count: { select: { evaluationTemplates: true } },
      },
      orderBy: { gradeLevel: "asc" },
    });

    return ok(configs);
  },
  ["ADMIN"],
);

// POST /api/admin/grade-configs
export const POST = withHandler(
  async (req: NextRequest) => {
    const body = createGradeConfigSchema.parse(await req.json());

    const existing = await prisma.gradeConfig.findUnique({
      where: {
        academicYearId_gradeLevel: {
          academicYearId: body.academicYearId,
          gradeLevel: body.gradeLevel,
        },
      },
    });
    if (existing)
      return conflict("Grade config already exists for this year and grade");

    const config = await prisma.gradeConfig.create({
      data: body,
      include: { gradeScales: true },
    });

    return created(config, "Grade config created");
  },
  ["ADMIN"],
);
