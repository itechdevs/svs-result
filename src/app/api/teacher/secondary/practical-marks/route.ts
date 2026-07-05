import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, ok, notFound } from "@/lib/response";
import { upsertSecondaryPracticalMarksSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

// POST /api/teacher/secondary/practical-marks
// Enters marks per practical heading and automatically aggregates them into the SecondaryComponentMark
export const POST = withHandler(
  async (req: NextRequest, ctx) => {
    const body = upsertSecondaryPracticalMarksSchema.parse(await req.json());
    
    // Validate heading and component
    const heading = await prisma.secondaryPracticalHeading.findUnique({
      where: { id: body.headingId },
      include: { component: true }
    });

    if (!heading) return notFound("Practical heading not found");
    if (heading.componentId !== body.componentId) return badRequest("Heading does not belong to provided component");
    if (heading.component.type !== "PRACTICAL") return badRequest("Component is not practical");

    // Validate marks do not exceed heading full marks
    const invalidMarks = body.marks.filter(m => m.marksObtained > Number(heading.fullMarks));
    if (invalidMarks.length > 0) {
      return badRequest(`Marks cannot exceed heading full marks (${heading.fullMarks})`);
    }

    const userId = ctx.user.id;
    
    await prisma.$transaction(async (tx) => {
      // 1. Upsert all the individual heading marks
      for (const m of body.marks) {
        await tx.secondaryPracticalHeadingMark.upsert({
          where: {
            syncedStudentId_headingId_examId: {
              syncedStudentId: m.syncedStudentId,
              headingId: body.headingId,
              examId: body.examId,
            }
          },
          update: { marksObtained: m.marksObtained },
          create: {
            syncedStudentId: m.syncedStudentId,
            headingId: body.headingId,
            examId: body.examId,
            marksObtained: m.marksObtained
          }
        });
      }

      // 2. Aggregate across ALL headings for this component for these students
      // Find all headings for this component
      const componentHeadings = await tx.secondaryPracticalHeading.findMany({
        where: { componentId: body.componentId }
      });
      const componentHeadingIds = componentHeadings.map(h => h.id);

      // Unique student IDs to update
      const studentIds = Array.from(new Set(body.marks.map(m => m.syncedStudentId)));

      for (const studentId of studentIds) {
        // Find all heading marks for this student for this component's headings
        const studentHeadingMarks = await tx.secondaryPracticalHeadingMark.findMany({
          where: {
            syncedStudentId: studentId,
            examId: body.examId,
            headingId: { in: componentHeadingIds }
          }
        });

        const totalPracticalMarks = studentHeadingMarks.reduce((sum, h) => sum + Number(h.marksObtained), 0);

        // Upsert the main component mark record
        await tx.secondaryComponentMark.upsert({
          where: {
            syncedStudentId_componentId_examId: {
              syncedStudentId: studentId,
              componentId: body.componentId,
              examId: body.examId,
            }
          },
          update: {
            marksObtained: totalPracticalMarks,
            isAbsent: false, // If they have practical marks, they are not absent
            status: "DRAFT",
          },
          create: {
            syncedStudentId: studentId,
            componentId: body.componentId,
            examId: body.examId,
            enteredById: userId,
            marksObtained: totalPracticalMarks,
            isAbsent: false,
            status: "DRAFT"
          }
        });
      }
    });

    return ok({ updatedCount: body.marks.length }, "Practical marks saved and aggregated successfully");
  },
  ["TEACHER", "ADMIN"],
);
