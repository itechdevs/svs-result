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
      examId: searchParams.get("examId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    const where: Record<string, unknown> = {};
    if (query.syncedSubjectId) where.syncedSubjectId = query.syncedSubjectId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.gradeLevel) where.gradeLevel = query.gradeLevel;
    if (query.examId) where.examId = query.examId;
    if (query.status) where.status = query.status;

    // Teachers can only see their own compilations
    if (user.role === "TEACHER") {
      where.teacherId = user.id;
    }

    const compilations = await (prisma.teacherSubjectCompilation as any).findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true, gradeLevel: true } },
        academicYear: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        results: {
          include: {
            student: { select: { id: true, name: true, rollNumber: true, class: true, section: true } },
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
    // class stores values like "Panda (L.K.G.)", gradeLevel is just "Panda"
    const students = await prisma.syncedStudent.findMany({
      where: { class: { startsWith: body.gradeLevel }, isActive: true },
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
        reExamResult: {
          select: { marksObtained: true, isPassed: true, status: true },
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

    // Build marks lookup: [studentId][templateId] = marksObtained (use re-exam if better)
    const marksLookup = new Map<string, Map<string, number | null>>();
    for (const r of results) {
      if (!marksLookup.has(r.syncedStudentId)) {
        marksLookup.set(r.syncedStudentId, new Map());
      }

      // Use re-exam marks if available (they are the better score)
      let effectiveMarks: number | null = r.marksObtained !== null ? Number(r.marksObtained) : null;
      if (r.reExamResult?.marksObtained !== null && r.reExamResult?.marksObtained !== undefined) {
        const reExamMarks = Number(r.reExamResult.marksObtained);
        if (effectiveMarks === null || reExamMarks > effectiveMarks) {
          effectiveMarks = reExamMarks;
        }
      }

      marksLookup.get(r.syncedStudentId)!.set(r.evaluationTemplateId, effectiveMarks);
    }

    // Compute per-student totals using RAW marks (not weighted percentages)
    const compilationResults = students.map((student) => {
      const studentMarks = marksLookup.get(student.id);
      let totalObtained = 0;
      let totalFull = 0;
      let failedEvaluations = 0;
      let hasAnyMarks = false;

      for (const template of templates) {
        const obtained = studentMarks?.get(template.id) ?? null;
        const fullMarks = Number(template.fullMarks);
        const passMarks = Number(template.passMarks);

        totalFull += fullMarks;

        if (obtained !== null) {
          hasAnyMarks = true;
          totalObtained += obtained;
          if (obtained < passMarks) {
            failedEvaluations++;
          }
        }
      }

      const percentage = totalFull > 0
        ? Number(((totalObtained / totalFull) * 100).toFixed(2))
        : 0;

      const { grade, gradePoint } = lookupGrade(percentage);
      const isPassed = failedEvaluations === 0 && hasAnyMarks;

      return {
        syncedStudentId: student.id,
        totalFullMarks: totalFull,
        obtainedMarks: totalObtained,
        percentage,
        grade,
        gradePoint: gradePoint ? Number(gradePoint) : null,
        isPassed,
        failedEvaluations,
      };
    });

    // Upsert compilation and results in a transaction
    // The unique key now includes examId so the same teacher can have different
    // compilations for different exams of the same subject
    const compilation = await prisma.$transaction(async (tx) => {
      // Try to find an existing compilation for this teacher+subject+year+grade+exam
      const existingComp = await (tx.teacherSubjectCompilation as any).findFirst({
        where: {
          teacherId: userId,
          syncedSubjectId: body.syncedSubjectId,
          academicYearId: body.academicYearId,
          gradeLevel: body.gradeLevel,
          examId: body.examId ?? null,
        },
      });

      let comp;
      if (existingComp) {
        comp = await tx.teacherSubjectCompilation.update({
          where: { id: existingComp.id },
          data: {
            evaluationTemplateIds: body.evaluationTemplateIds,
            status: "DRAFT",
            submittedAt: null,
            computedAt: new Date(),
          },
        });
      } else {
        comp = await (tx.teacherSubjectCompilation as any).create({
          data: {
            teacherId: userId,
            syncedSubjectId: body.syncedSubjectId,
            academicYearId: body.academicYearId,
            gradeLevel: body.gradeLevel,
            examId: body.examId ?? null,
            evaluationTemplateIds: body.evaluationTemplateIds,
            status: "DRAFT",
            computedAt: new Date(),
          },
        });
      }

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
              student: { select: { id: true, name: true, rollNumber: true, class: true, section: true } },
            },
          },
        },
      });
    });

    return created(compilation, "Compilation saved successfully");
  },
  ["TEACHER"]
);
