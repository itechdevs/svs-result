import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

export const GET = withHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  const className = searchParams.get("class");

  if (!examId) return badRequest("examId is required");
  if (!className) return badRequest("class is required");

  const remarks = await prisma.studentRemark.findMany({
    where: {
      examId,
      syncedStudent: {
        class: { equals: className, mode: "insensitive" },
      },
    },
    select: {
      syncedStudentId: true,
      remark: true,
    },
  });

  const remarkMap: Record<string, string> = {};
  for (const r of remarks) {
    remarkMap[r.syncedStudentId] = r.remark;
  }

  return ok({ remarks: remarkMap });
}, ["ADMIN"]);
