import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// POST /api/admin/secondary/exams/[examId]/publish
export const POST = withHandler(
  async (_req: NextRequest, { params, user }) => {
    const { examId } = await params;
    
    const results = await prisma.secondaryTermResult.findMany({
      where: { examId },
    });
    
    if (results.length === 0) return notFound("No compiled term results found for this exam");

    const updated = await prisma.secondaryTermResult.updateMany({
      where: { examId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        publishedById: user.id,
      },
    });

    return ok({ updatedCount: updated.count }, "Term results published successfully");
  },
  ["ADMIN"]
);
