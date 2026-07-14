import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { z } from "zod";

const verifySchema = z.object({
  remarks: z.string().max(500).optional(),
});

// POST /api/admin/secondary/marks/[id]/verify
export const POST = withHandler(
  async (req: NextRequest, { params, user }) => {
    const { id } = await params;
    const body = verifySchema.parse(await req.json());
    
    const result = await prisma.secondaryComponentMark.findUnique({
      where: { id },
    });
    
    if (!result) return notFound("Mark record not found");

    if (result.status !== "SUBMITTED") {
      return badRequest(`Cannot verify a record with status '${result.status}'. It must be SUBMITTED first.`);
    }

    const updated = await prisma.secondaryComponentMark.update({
      where: { id },
      data: {
        status: "VERIFIED",
        verifiedById: user.id,
        verifiedAt: new Date(),
        ...(body.remarks && { remarks: body.remarks }),
      },
    });

    return ok(updated, "Result verified successfully");
  },
  ["ADMIN"]
);
