import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// GET /api/admin/secondary/term-results
export const GET = withHandler(
  async (req: NextRequest) => {
    const url = new URL(req.url);
    const examId = url.searchParams.get("examId");

    if (!examId) {
      return badRequest("examId query parameter is required");
    }

    const results = await prisma.secondaryTermResult.findMany({
      where: { examId },
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
