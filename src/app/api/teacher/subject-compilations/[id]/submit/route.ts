import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, notFound } from "@/lib/response";
import { withHandler } from "@/lib/handlers";

export const POST = withHandler(
  async (req: NextRequest, { params, user }) => {
    const compilation = await prisma.teacherSubjectCompilation.findUnique({
      where: { id: params.id },
    });

    if (!compilation) {
      return notFound("Compilation not found");
    }

    if (compilation.teacherId !== user.id) {
      return badRequest("You can only submit your own compilations");
    }

    if (compilation.status === "SUBMITTED") {
      return badRequest("Compilation is already submitted");
    }

    // Check that results exist
    const resultCount = await prisma.teacherSubjectCompilationResult.count({
      where: { compilationId: params.id },
    });

    if (resultCount === 0) {
      return badRequest("No results to submit. Please save the compilation first.");
    }

    const updated = await prisma.teacherSubjectCompilation.update({
      where: { id: params.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      include: {
        subject: { select: { id: true, name: true, code: true, gradeLevel: true } },
        academicYear: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        results: {
          include: {
            student: { select: { id: true, name: true, rollNumber: true, grade: true, section: true } },
          },
        },
      },
    });

    return ok(updated, "Compilation submitted to admin successfully");
  },
  ["TEACHER"]
);
