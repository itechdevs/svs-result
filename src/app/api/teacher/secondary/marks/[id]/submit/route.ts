import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

// POST /api/teacher/secondary/marks/[id]/submit
export const POST = withHandler(
  async (_req: NextRequest, { params, user }) => {
    const { id } = await params;
    
    const result = await prisma.secondaryComponentMark.findUnique({
      where: { id },
    });
    
    if (!result) return notFound("Mark record not found");

    if (result.status !== "DRAFT") {
      return badRequest(`Cannot submit a record with status '${result.status}'`);
    }

    if (user.role === "TEACHER" && result.enteredById !== user.id) {
      return forbidden("You can only submit results you entered");
    }

    const updated = await prisma.secondaryComponentMark.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    return ok(updated, "Result submitted successfully");
  },
  ["TEACHER", "ADMIN"]
);
