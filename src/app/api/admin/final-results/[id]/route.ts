import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

const patchSchema = z.object({
  resultStatus: z
    .enum(["PROMOTED", "FAILED", "PROBATION", "WITHHELD"])
    .optional(),
  remarks: z.string().max(500).optional(),
  overallGrade: z.string().max(30).optional(),
});

// GET /api/admin/final-results/[id]
export const GET = withHandler(
  async (_req, { params }) => {
    const result = await prisma.finalResult.findUnique({
      where: { id: params.id },
      include: {
        syncedStudent: true,
        academicYear: true,
        subjectResults: {
          include: {
            syncedSubject: { select: { id: true, name: true, code: true } },
          },
          orderBy: { syncedSubject: { name: "asc" } },
        },
        publishedBy: { select: { id: true, name: true } },
        marksheet: { select: { id: true, generatedAt: true, fileUrl: true } },
      },
    });
    if (!result) return notFound("Final result not found");
    return ok(result);
  },
  ["ADMIN"],
);

// PATCH /api/admin/final-results/[id] — manual override (withheld, remarks)
export const PATCH = withHandler(
  async (req: NextRequest, { params }) => {
    const body = patchSchema.parse(await req.json());

    const result = await prisma.finalResult.findUnique({
      where: { id: params.id },
    });
    if (!result) return notFound("Final result not found");

    if (result.isPublished && body.resultStatus) {
      return badRequest(
        "Cannot change the result status after publishing. Withheld status must be set before publication.",
      );
    }

    const updated = await prisma.finalResult.update({
      where: { id: params.id },
      data: body,
    });

    return ok(updated, "Final result updated");
  },
  ["ADMIN"],
);
