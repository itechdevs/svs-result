import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { z } from "zod";

const updateSchema = z.object({
  marksObtained: z.number().nullable(),
  isAbsent: z.boolean(),
  remarks: z.string().max(500).optional(),
});

// PUT /api/admin/secondary/marks/[id]
export const PUT = withHandler(
  async (req: NextRequest, { params }) => {
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const mark = await prisma.secondaryComponentMark.findUnique({
      where: { id },
      include: {
        component: {
          select: { fullMarks: true, passMarks: true, type: true },
        },
      },
    });

    if (!mark) return notFound("Mark record not found");

    if (body.marksObtained !== null) {
      const fullMarks = Number(mark.component.fullMarks);
      if (body.marksObtained < 0 || body.marksObtained > fullMarks) {
        return badRequest(`Marks must be between 0 and ${fullMarks}`);
      }
    }

    // Admin edits always set the mark back to SUBMITTED so it can be
    // (re-)verified. This prevents a MIXED state (e.g., Theory=DRAFT,
    // Practical=SUBMITTED) that would block the Verify button on the UI.
    const newStatus = "SUBMITTED";

    const updated = await prisma.secondaryComponentMark.update({
      where: { id },
      data: {
        marksObtained: body.isAbsent ? null : body.marksObtained,
        isAbsent: body.isAbsent,
        ...(body.remarks !== undefined && { remarks: body.remarks }),
        status: newStatus,
        verifiedById: null,
        verifiedAt: null,
      },
    });

    return ok(updated, "Mark updated successfully");
  },
  ["ADMIN"]
);
