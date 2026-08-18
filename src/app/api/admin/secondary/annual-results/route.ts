import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/secondary/annual-results
export const GET = withHandler(
  async (req: NextRequest) => {
    const url = new URL(req.url);
    const academicYearId = url.searchParams.get("academicYearId");
    const gradeLevel = url.searchParams.get("gradeLevel");

    if (!academicYearId) {
      return badRequest("academicYearId is required");
    }
    if (!gradeLevel) {
      return badRequest("gradeLevel is required");
    }

    const results = await prisma.secondaryAnnualResult.findMany({
      where: {
        academicYearId,
        syncedStudent: {
          class: gradeLevel
        }
      },
      include: {
        syncedStudent: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            class: true,
            section: true,
          }
        },
        subjectResults: {
          include: {
            subjectConfig: {
              include: {
                syncedSubject: true
              }
            }
          }
        },
        marksheet: {
          select: {
            id: true,
            generatedAt: true
          }
        }
      },
      orderBy: [
        { syncedStudent: { section: "asc" } },
        { syncedStudent: { rollNumber: "asc" } }
      ]
    });

    return ok(results);
  },
  ["ADMIN"]
);
