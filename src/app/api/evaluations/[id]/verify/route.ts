/**
 * POST /api/evaluations/[id]/verify
 * Admin transitions SUBMITTED → VERIFIED.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, notFound, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { verifyEvaluationResultSchema } from "@/lib/schemas";

export const POST = withHandler(
  async (req: NextRequest, { params, user }) => {
    const body = verifyEvaluationResultSchema.parse(await req.json());

    const result = await prisma.studentEvaluationResult.findUnique({
      where: { id: params.id, deletedAt: null },
    });
    if (!result) return notFound("Evaluation result not found");

    if (result.status !== "SUBMITTED") {
      return badRequest(
        `Cannot verify a result with status '${result.status}'. Only SUBMITTED results can be verified.`,
      );
    }

    const updated = await prisma.studentEvaluationResult.update({
      where: { id: params.id },
      data: {
        status: "VERIFIED",
        verifiedById: user.id,
        verifiedAt: new Date(),
        ...(body.remarks && { remarks: body.remarks }),
      },
      include: {
        syncedStudent: { select: { id: true, name: true, rollNumber: true } },
        evaluationTemplate: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });

    return ok(updated, "Result verified");
  },
  ["ADMIN"],
);
