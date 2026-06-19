import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, created } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import {
  createTeacherCompilationSchema,
  listTeacherCompilationsSchema,
} from "@/lib/schemas";

export const GET = withHandler(
  async (req: NextRequest, { user }) => {
    const { searchParams } = new URL(req.url);
    const query = listTeacherCompilationsSchema.parse({
      syncedSubjectId: searchParams.get("syncedSubjectId") ?? undefined,
      academicYearId: searchParams.get("academicYearId") ?? undefined,
      gradeLevel: searchParams.get("gradeLevel") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    const where: Record<string, unknown> = {};
    if (query.syncedSubjectId) where.syncedSubjectId = query.syncedSubjectId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.gradeLevel) where.gradeLevel = query.gradeLevel;
    if (query.status) where.status = query.status;

    // Teachers can only see their own compilations
    if (user.role === "TEACHER") {
      where.teacherId = user.id;
    }

    const compilations = await prisma.teacherSubjectCompilation.findMany({
      where,
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
      orderBy: { computedAt: "desc" },
    });

    return ok(compilations);
  },
  ["ADMIN", "TEACHER"]
);

export const POST = withHandler(
  async (req: NextRequest, { user }) => {
    const body = createTeacherCompilationSchema.parse(await req.json());
    const userId = user.id;

    // Verify the evaluation templates exist and belong to the subject
    const templates = await prisma.evaluationTemplate.findMany({
      where: {
        id: { in: body.evaluationTemplateIds },
        syncedSubjectId: body.syncedSubjectId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (templates.length !== body.evaluationTemplateIds.length) {
      return badRequest("One or more evaluation templates are invalid or inactive");
    }

    // Fetch all students for this grade level
    const students = await prisma.syncedStudent.findMany({
      where: { grade: body.gradeLevel, isActive: true },
    });

    if (students.length === 0) {
      return badRequest("No students found for this grade level");
    }

    // Fetch all evaluation results for the selected templates
    const templateIds = templates.map((t) => t.id);
    const results = await prisma.studentEvaluationResult.findMany({
      where: {
        evaluationTemplateId: { in: templateIds },
        syncedStudentId: { in: students.map((s) => s.id) },
      },
      include: {
        evaluationTemplate: {
          select: { id: true, fullMarks: true, passMarks: true, weightage: true },
        },
      },
    });

    // Fetch grade config for grade scale lookup
    const gradeConfig = await prisma.gradeConfig.findFirst({
      where: {
        gradeLevel: body.gradeLevel,
        academicYearId: body.academicYearId,
      },
      include: {
        gradeScales: { orderBy: { minPercent: "asc" } },
      },
    });

    const lookupGrade = (percent: number) => {
      if (!gradeConfig) return { grade: null, gradePoint: null };
      const scale = gradeConfig.gradeScales.find(
        (s) => percent >= Number(s.minPercent) && percent <= Number(s.maxPercent)
      );
      return {
        grade: scale?.grade ?? null,
        gradePoint: scale?.gradePoint ?? null,
      };
    };

    // Build marks lookup: [studentId][templateId] = marksObtained
    const marksLookup = new Map<string, Map<string, number | null>>();
    for (const r of results) {
      if (!marksLookup.has(r.syncedStudentId)) {
        marksLookup.set(r.syncedStudentId, new Map());
      }
      marksLookup.get(r.syncedStudentId)!.set(
        r.evaluationTemplateId,
        r.marksObtained !== null ? Number(r.marksObtained) : null
      );
    }

    // Compute weighted accumulation per student
    const compilationResults = students.map((student) => {
      const studentMarks = marksLookup.get(student.id);
      let totalWeightedObtained = 0;
      let totalFullMarks = 0;
      let failedEvaluations = 0;
      let hasAnyMarks = false;

      for (const template of templates) {
        const obtained = studentMarks?.get(template.id) ?? null;
        const fullMarks = Number(template.fullMarks);
        const passMarks = Number(template.passMarks);
        const weight = Number(template.weightage) / 100;

        totalFullMarks += fullMarks * weight;

        if (obtained !== null) {
          hasAnyMarks = true;
          totalWeightedObtained += (obtained / fullMarks) * fullMarks * weight;
          if (obtained < passMarks) {
            failedEvaluations++;
          }
        }
      }

      const fullMarksDecimal = totalFullMarks;
      const obtainedDecimal = Number(totalWeightedObtained.toFixed(2));
      const percentage = fullMarksDecimal > 0
        ? Number(((obtainedDecimal / fullMarksDecimal) * 100).toFixed(2))
        : 0;

      const { grade, gradePoint } = lookupGrade(percentage);
      const isPassed = failedEvaluations === 0 && hasAnyMarks;

      return {
        syncedStudentId: student.id,
        totalFullMarks: fullMarksDecimal,
        obtainedMarks: obtainedDecimal,
        percentage,
        grade,
        gradePoint: gradePoint ? Number(gradePoint) : null,
        isPassed,
        failedEvaluations,
      };
    });

    // Upsert compilation and results in a transaction
    const compilation = await prisma.$transaction(async (tx) => {
      const comp = await tx.teacherSubjectCompilation.upsert({
        where: {
          teacherId_syncedSubjectId_academicYearId_gradeLevel: {
            teacherId: userId,
            syncedSubjectId: body.syncedSubjectId,
            academicYearId: body.academicYearId,
            gradeLevel: body.gradeLevel,
          },
        },
        create: {
          teacherId: userId,
          syncedSubjectId: body.syncedSubjectId,
          academicYearId: body.academicYearId,
          gradeLevel: body.gradeLevel,
          evaluationTemplateIds: body.evaluationTemplateIds,
          status: "DRAFT",
          computedAt: new Date(),
        },
        update: {
          evaluationTemplateIds: body.evaluationTemplateIds,
          computedAt: new Date(),
        },
      });

      // Delete old results and insert new ones
      await tx.teacherSubjectCompilationResult.deleteMany({
        where: { compilationId: comp.id },
      });

      await tx.teacherSubjectCompilationResult.createMany({
        data: compilationResults.map((r) => ({
          compilationId: comp.id,
          ...r,
        })),
      });

      return tx.teacherSubjectCompilation.findUnique({
        where: { id: comp.id },
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
    });

    return created(compilation, "Compilation saved successfully");
  },
  ["TEACHER"]
);
