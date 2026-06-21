/**
 * GET  — list marksheets (admin) or own marksheets (teacher filtered by student)
 * POST — admin generates a marksheet snapshot for a published FinalResult
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  badRequest,
  conflict,
  created,
  ok,
  unprocessable,
} from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import { generateMarksheetSchema } from "@/lib/schemas";

export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const academicYearId = searchParams.get("academicYearId") ?? undefined;
    const syncedStudentId = searchParams.get("syncedStudentId") ?? undefined;

    const marksheets = await prisma.marksheet.findMany({
      where: {
        ...(academicYearId && { academicYearId }),
        ...(syncedStudentId && { syncedStudentId }),
      },
      include: {
        syncedStudent: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            class: true,
            section: true,
          },
        },
        academicYear: { select: { id: true, name: true } },
        generatedBy: { select: { id: true, name: true } },
      },
      orderBy: { generatedAt: "desc" },
    });

    return ok(marksheets);
  },
  ["ADMIN"],
);

export const POST = withHandler(
  async (req: NextRequest, { user }) => {
    const { finalResultId } = generateMarksheetSchema.parse(await req.json());

    const finalResult = await prisma.finalResult.findUnique({
      where: { id: finalResultId },
      include: {
        syncedStudent: true,
        academicYear: true,
        subjectResults: {
          include: {
            syncedSubject: true,
          },
        },
      },
    });

    if (!finalResult) return badRequest("Final result not found");
    if (!finalResult.isPublished) {
      return unprocessable(
        "Result must be published before generating a marksheet",
      );
    }

    // Check if marksheet already exists
    const existing = await prisma.marksheet.findUnique({
      where: { finalResultId },
    });
    if (existing)
      return conflict("Marksheet already generated for this result");

    // Build snapshot metadata
    const metadata = {
      student: {
        name: finalResult.syncedStudent.name,
        rollNumber: finalResult.syncedStudent.rollNumber,
        grade: finalResult.syncedStudent.class,
        section: finalResult.syncedStudent.section,
      },
      academicYear: finalResult.academicYear.name,
      cgpa: finalResult.cgpa,
      percentage: finalResult.percentage,
      classRank: finalResult.classRank,
      resultStatus: finalResult.resultStatus,
      overallGrade: finalResult.overallGrade,
      subjectResults: finalResult.subjectResults.map((sr) => ({
        subjectName: sr.syncedSubject.name,
        subjectCode: sr.syncedSubject.code,
        totalFullMarks: sr.totalFullMarks,
        obtainedMarks: sr.obtainedMarks,
        percentage: sr.percentage,
        grade: sr.grade,
        gradePoint: sr.gradePoint,
        isPassed: sr.isPassed,
      })),
      generatedAt: new Date().toISOString(),
      generatedBy: user.name,
    };

    const marksheet = await prisma.marksheet.create({
      data: {
        syncedStudentId: finalResult.syncedStudentId,
        finalResultId,
        academicYearId: finalResult.academicYearId,
        generatedById: user.id,
        metadata,
      },
      include: {
        syncedStudent: { select: { id: true, name: true, rollNumber: true } },
      },
    });

    return created(marksheet, "Marksheet generated");
  },
  ["ADMIN"],
);
