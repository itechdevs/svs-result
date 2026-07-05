import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, ok, notFound } from "@/lib/response";
import { upsertSecondaryMarksSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

// POST /api/teacher/secondary/marks
// Bulk insert/update component marks for a given component and exam
export const POST = withHandler(
  async (req: NextRequest, ctx) => {
    const body = upsertSecondaryMarksSchema.parse(await req.json());
    
    // Validate component exists and is not PRACTICAL
    const component = await prisma.secondarySubjectComponent.findUnique({
      where: { id: body.componentId }
    });

    if (!component) {
      return notFound("Component not found");
    }

    if (component.type === "PRACTICAL") {
      return badRequest("Practical component marks must be entered via /api/teacher/secondary/practical-marks");
    }

    // Validate marks do not exceed component full marks
    const invalidMarks = body.marks.filter(m => !m.isAbsent && m.marksObtained !== undefined && m.marksObtained > Number(component.fullMarks));
    if (invalidMarks.length > 0) {
      return badRequest(`Marks obtained cannot exceed component full marks (${component.fullMarks})`);
    }

    const userId = ctx.user.id;
    
    const results = await prisma.$transaction(
      body.marks.map((m) =>
        prisma.secondaryComponentMark.upsert({
          where: {
            syncedStudentId_componentId_examId: {
              syncedStudentId: m.syncedStudentId,
              componentId: body.componentId,
              examId: body.examId,
            },
          },
          update: {
            marksObtained: m.isAbsent ? null : m.marksObtained,
            isAbsent: m.isAbsent,
            remarks: m.remarks,
            // Re-draft if they edit it
            status: "DRAFT",
          },
          create: {
            syncedStudentId: m.syncedStudentId,
            componentId: body.componentId,
            examId: body.examId,
            enteredById: userId,
            marksObtained: m.isAbsent ? null : m.marksObtained,
            isAbsent: m.isAbsent,
            remarks: m.remarks,
            status: "DRAFT",
          },
        })
      )
    );

    return ok({ updatedCount: results.length }, "Marks saved successfully");
  },
  ["TEACHER", "ADMIN"],
);
