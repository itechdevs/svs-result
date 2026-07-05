import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { setSecondaryTermWeightsSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/secondary/term-weights
export const GET = withHandler(
  async (req: NextRequest) => {
    const url = new URL(req.url);
    const gradeLevel = url.searchParams.get("gradeLevel");
    const academicYearId = url.searchParams.get("academicYearId");

    const where: any = {};
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (academicYearId) where.academicYearId = academicYearId;

    const weights = await prisma.secondaryTermWeight.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      include: {
        exam: {
          select: { name: true },
        },
      },
    });

    return ok(weights);
  },
  ["ADMIN"],
);

// POST /api/admin/secondary/term-weights
export const POST = withHandler(
  async (req: NextRequest) => {
    const body = setSecondaryTermWeightsSchema.parse(await req.json());

    // Use transaction to delete existing for this grade/year and insert new
    const result = await prisma.$transaction(async (tx) => {
      await tx.secondaryTermWeight.deleteMany({
        where: {
          academicYearId: body.academicYearId,
          gradeLevel: body.gradeLevel,
        },
      });

      const creates = body.weights.map(w => 
        tx.secondaryTermWeight.create({
          data: {
            academicYearId: body.academicYearId,
            gradeLevel: body.gradeLevel,
            examId: w.examId,
            termName: w.termName,
            weightPercent: w.weightPercent,
            displayOrder: w.displayOrder,
          }
        })
      );

      return Promise.all(creates);
    });

    return ok(result, "Term weights saved successfully");
  },
  ["ADMIN"],
);
