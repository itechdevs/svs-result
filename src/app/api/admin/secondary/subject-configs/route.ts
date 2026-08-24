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
    const syncedSubjectId = url.searchParams.get("syncedSubjectId");

    const where: any = {};
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (academicYearId) where.academicYearId = academicYearId;
    if (syncedSubjectId) where.syncedSubjectId = syncedSubjectId;

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
  ["ADMIN", "TEACHER"], // Allow teachers to access this endpoint
);

// POST /api/admin/secondary/subject-configs
export const POST = withHandler(
  async (req: NextRequest) => {
    const body = createSecondarySubjectConfigSchema.parse(await req.json());

    // Validate for duplicate heading names inside practical components
    for (const comp of body.components) {
      if (comp.type === "PRACTICAL" && comp.practicalHeadings) {
        const names = comp.practicalHeadings.map((h) => h.name.trim());
        if (new Set(names).size !== names.length) {
          throw new Error("Duplicate sub-category names are not allowed.");
        }
        if (names.some(n => n === "")) {
          throw new Error("Sub-category name cannot be empty.");
        }
      }
    }

    // Run within a transaction to avoid unique constraint race conditions
    // and safely recreate components and practical headings.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert the base configuration
      const config = await tx.secondarySubjectConfig.upsert({
        where: {
          syncedSubjectId_academicYearId_gradeLevel: {
            syncedSubjectId: body.syncedSubjectId,
            academicYearId: body.academicYearId,
            gradeLevel: body.gradeLevel,
          },
        },
        update: {
          isActive: true,
        },
        create: {
          syncedSubjectId: body.syncedSubjectId,
          academicYearId: body.academicYearId,
          gradeLevel: body.gradeLevel,
        },
      });

      // 2. Delete existing components
      await tx.secondarySubjectComponent.deleteMany({
        where: { subjectConfigId: config.id },
      });

      // 3. Create new components with their practical headings
      for (const comp of body.components) {
        await tx.secondarySubjectComponent.create({
          data: {
            subjectConfigId: config.id,
            type: comp.type,
            // NEB v2: store the per-component credit hour
            creditHour: comp.creditHour ?? 1,
            fullMarks: comp.fullMarks,
            passMarks: comp.passMarks,
            displayOrder: comp.displayOrder,
            ...(comp.practicalHeadings && comp.practicalHeadings.length > 0
              ? {
                  practicalHeadings: {
                    create: comp.practicalHeadings.map((heading) => ({
                      name: heading.name,
                      fullMarks: heading.fullMarks,
                      passMarks: heading.passMarks || 0,
                      displayOrder: heading.displayOrder,
                    })),
                  },
                }
              : {}),
          },
        });
      }

      // 4. Return populated config
      return await tx.secondarySubjectConfig.findUnique({
        where: { id: config.id },
        include: {
          components: {
            orderBy: { displayOrder: "asc" },
            include: {
              practicalHeadings: {
                orderBy: { displayOrder: "asc" },
              },
            },
          },
        },
      });
    });

    return ok(result, "Subject configuration saved successfully");
  },
  ["ADMIN"],
);
