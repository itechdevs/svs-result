import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, ok, notFound } from "@/lib/response";
import { upsertSecondaryPracticalMarksSchema } from "@/lib/schemas";
import { withHandler } from "@/lib/handlers";

// GET /api/teacher/secondary/practical-marks
// Fetch all practical heading marks for a component and exam
export const GET = withHandler(
  async (req: NextRequest, ctx) => {
    const { searchParams } = new URL(req.url);
    const componentId = searchParams.get("componentId");
    const examId = searchParams.get("examId");

    if (!componentId || !examId) {
      return badRequest("componentId and examId are required");
    }

    // Get all headings for this component
    const component = await prisma.secondarySubjectComponent.findUnique({
      where: { id: componentId },
      include: {
        practicalHeadings: true,
      },
    });

    if (!component) {
      return notFound("Component not found");
    }

    if (component.type !== "PRACTICAL") {
      return badRequest("Component is not a practical component");
    }

    const headingIds = component.practicalHeadings.map((h) => h.id);

    // Fetch all marks for these headings and exam
    const marks = await prisma.secondaryPracticalHeadingMark.findMany({
      where: {
        headingId: { in: headingIds },
        examId,
      },
      include: {
        heading: true,
        syncedStudent: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            section: true,
          },
        },
      },
      orderBy: {
        syncedStudent: {
          rollNumber: "asc",
        },
      },
    });

    return ok(marks);
  },
  ["TEACHER", "ADMIN"]
);

// POST /api/teacher/secondary/practical-marks
// Enters marks per practical heading and automatically aggregates them into the SecondaryComponentMark
// Supports multiple headings in a single request by grouping marks by headingId
export const POST = withHandler(
  async (req: NextRequest, ctx) => {
    const body = upsertSecondaryPracticalMarksSchema.parse(await req.json());
    
    // Validate component exists and is practical
    const component = await prisma.secondarySubjectComponent.findUnique({
      where: { id: body.componentId },
    });

    if (!component) return notFound("Component not found");
    if (component.type !== "PRACTICAL") return badRequest("Component is not practical");

    const userId = ctx.user.id;

    // Group marks by headingId
    const marksByHeading = new Map<string, typeof body.marks>();
    for (const m of body.marks) {
      const existing = marksByHeading.get(m.headingId) || [];
      existing.push(m);
      marksByHeading.set(m.headingId, existing);
    }
    
    await prisma.$transaction(async (tx) => {
      for (const [headingId, headingMarks] of marksByHeading) {
        // Validate heading
        const heading = await tx.secondaryPracticalHeading.findUnique({
          where: { id: headingId },
        });
        if (!heading) throw new Error(`Practical heading ${headingId} not found`);
        if (heading.componentId !== body.componentId) throw new Error(`Heading ${headingId} does not belong to provided component`);

        // Validate marks do not exceed heading full marks
        const invalidMarks = headingMarks.filter(m => m.marksObtained > Number(heading.fullMarks));
        if (invalidMarks.length > 0) {
          throw new Error(`Marks cannot exceed heading full marks (${heading.fullMarks})`);
        }

        // 1. Upsert heading marks for this heading
        for (const m of headingMarks) {
          await tx.secondaryPracticalHeadingMark.upsert({
            where: {
              syncedStudentId_headingId_examId: {
                syncedStudentId: m.syncedStudentId,
                headingId: m.headingId,
                examId: body.examId,
              }
            },
            update: { marksObtained: m.marksObtained },
            create: {
              syncedStudentId: m.syncedStudentId,
              headingId: m.headingId,
              examId: body.examId,
              marksObtained: m.marksObtained
            }
          });
        }
      }

      // 2. Aggregate across ALL headings for this component for these students
      const componentHeadings = await tx.secondaryPracticalHeading.findMany({
        where: { componentId: body.componentId }
      });
      const componentHeadingIds = componentHeadings.map(h => h.id);

      const studentIds = Array.from(new Set(body.marks.map(m => m.syncedStudentId)));

      for (const studentId of studentIds) {
        const studentHeadingMarks = await tx.secondaryPracticalHeadingMark.findMany({
          where: {
            syncedStudentId: studentId,
            examId: body.examId,
            headingId: { in: componentHeadingIds }
          }
        });

        const totalPracticalMarks = studentHeadingMarks.reduce((sum, h) => sum + Number(h.marksObtained), 0);

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
            isAbsent: false,
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
