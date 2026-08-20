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
  async (req: NextRequest, { params, user }) => {
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

    // Admin edits automatically verify the mark
    const newStatus = "VERIFIED";

    // Track admin edit via remarks to avoid overriding the original enteredById
    let finalRemarks = body.remarks !== undefined ? body.remarks : (mark.remarks || "");
    const adminFlag = "[Edited by Admin]";
    if (!finalRemarks.includes(adminFlag)) {
      finalRemarks = finalRemarks ? `${finalRemarks} ${adminFlag}` : adminFlag;
    }

    // Check if the user ID from the session actually exists in the database
    // to prevent P2003 Foreign Key constraint errors caused by stale cookies
    // after a database reset.
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const verifiedById = dbUser ? user.id : null;

    const updated = await prisma.secondaryComponentMark.update({
      where: { id },
      data: {
        marksObtained: body.isAbsent ? null : body.marksObtained,
        isAbsent: body.isAbsent,
        remarks: finalRemarks,
        status: newStatus,
        verifiedById,
        verifiedAt: new Date(),
      },
    });

    return ok(updated, "Mark updated successfully");
  },
  ["ADMIN"]
);
