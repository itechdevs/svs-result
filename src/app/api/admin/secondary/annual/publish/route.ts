import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, ok, badRequest } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { z } from "zod";

const publishSchema = z.object({
  academicYearId: z.string().cuid(),
});

// POST /api/admin/secondary/annual/publish
export const POST = withHandler(
  async (req: NextRequest, { user }) => {
    const body = publishSchema.parse(await req.json());
    
    // We just find all unpublshed ones for this year and publish them.
    const results = await prisma.secondaryAnnualResult.findMany({
      where: { academicYearId: body.academicYearId, isPublished: false },
    });
    
    if (results.length === 0) return badRequest("No unpublished annual results found for this academic year.");

    // Defensive: verify the user actually exists in DB before writing publishedById.
    const publishingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    const updated = await prisma.secondaryAnnualResult.updateMany({
      where: { academicYearId: body.academicYearId, isPublished: false },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        publishedById: publishingUser?.id ?? null,
      },
    });

    return ok({ updatedCount: updated.count }, "Annual results published successfully");
  },
  ["ADMIN"]
);
