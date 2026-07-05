import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, ok } from "@/lib/response";
import { createSecondarySubjectConfigSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/secondary/subject-configs
export const GET = withHandler(
  async (req: NextRequest) => {
    const url = new URL(req.url);
    const gradeLevel = url.searchParams.get("gradeLevel");
    const academicYearId = url.searchParams.get("academicYearId");

    const where: any = {};
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (academicYearId) where.academicYearId = academicYearId;

    const configs = await prisma.secondarySubjectConfig.findMany({
      where,
      include: {
        components: {
          orderBy: { displayOrder: "asc" },
          include: {
            practicalHeadings: {
              orderBy: { displayOrder: "asc" }
            }
          }
        },
        syncedSubject: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return ok(configs);
  },
  ["ADMIN"],
);

// POST /api/admin/secondary/subject-configs
export const POST = withHandler(
  async (req: NextRequest) => {
    const body = createSecondarySubjectConfigSchema.parse(await req.json());

    // Validation: creditHours calculation check
    const totalMarks = body.components.reduce((sum, comp) => sum + comp.fullMarks, 0);
    const calculatedCreditHours = Math.round(totalMarks / 25);
    
    if (calculatedCreditHours !== body.creditHours) {
      return badRequest(`Credit hours mismatch. Based on total marks (${totalMarks}), it should be ${calculatedCreditHours}`);
    }

    // Upsert the configuration
    const config = await prisma.secondarySubjectConfig.upsert({
      where: {
        syncedSubjectId_academicYearId_gradeLevel: {
          syncedSubjectId: body.syncedSubjectId,
          academicYearId: body.academicYearId,
          gradeLevel: body.gradeLevel,
        },
      },
      update: {
        creditHours: body.creditHours,
        isActive: true,
        // Replace components
        components: {
          deleteMany: {},
          create: body.components.map((comp) => ({
            type: comp.type,
            fullMarks: comp.fullMarks,
            passMarks: comp.passMarks,
            displayOrder: comp.displayOrder,
          })),
        },
      },
      create: {
        syncedSubjectId: body.syncedSubjectId,
        academicYearId: body.academicYearId,
        gradeLevel: body.gradeLevel,
        creditHours: body.creditHours,
        components: {
          create: body.components.map((comp) => ({
            type: comp.type,
            fullMarks: comp.fullMarks,
            passMarks: comp.passMarks,
            displayOrder: comp.displayOrder,
          })),
        },
      },
      include: {
        components: true,
      },
    });

    return ok(config, "Subject configuration saved successfully");
  },
  ["ADMIN"],
);
