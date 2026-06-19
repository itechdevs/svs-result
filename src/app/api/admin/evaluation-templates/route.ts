import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, conflict, created, ok } from "@/lib/response";
import { withHandler } from "@/lib/handlers";
import {
  createEvaluationTemplateSchema,
  listEvaluationTemplatesSchema,
} from "@/lib/schemas";

// GET /api/admin/evaluation-templates
export const GET = withHandler(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    
    // Parse query params using schema (e.g. gradeConfigId, syncedSubjectId, isActive)
    const query = listEvaluationTemplatesSchema.parse(
      Object.fromEntries(searchParams),
    );

    const templates = await prisma.evaluationTemplate.findMany({
      where: {
        deletedAt: null,
        ...(query.gradeConfigId && { gradeConfigId: query.gradeConfigId }),
        ...(query.syncedSubjectId && { syncedSubjectId: query.syncedSubjectId }),
        ...(query.examId && { examId: query.examId }),
        ...(query.isActive !== undefined && { isActive: query.isActive }),
      },
      include: {
        gradeConfig: {
          select: {
            id: true,
            gradeLevel: true,
            academicYear: { select: { id: true, name: true } },
          },
        },
        syncedSubject: {
          select: { id: true, name: true, code: true, gradeLevel: true },
        },
        exam: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });

    return ok(templates);
  },
  ["ADMIN", "TEACHER"], // Both admin and teacher can list templates
);

// POST /api/admin/evaluation-templates
export const POST = withHandler(
  async (req: NextRequest) => {
    const body = createEvaluationTemplateSchema.parse(await req.json());

    // Verify gradeConfig exists
    const gradeConfig = await prisma.gradeConfig.findUnique({
      where: { id: body.gradeConfigId },
    });
    if (!gradeConfig) return badRequest("Grade configuration not found");

    // Verify syncedSubject exists
    const subject = await prisma.syncedSubject.findUnique({
      where: { id: body.syncedSubjectId },
    });
    if (!subject) return badRequest("Subject not found");

    // Ensure total weightage for the subject doesn't exceed 100
    const existingTemplates = await prisma.evaluationTemplate.findMany({
      where: {
        gradeConfigId: body.gradeConfigId,
        syncedSubjectId: body.syncedSubjectId,
        deletedAt: null,
      },
    });

    const currentWeightageSum = existingTemplates.reduce(
      (sum, t) => sum + Number(t.weightage),
      0,
    );

    if (currentWeightageSum + body.weightage > 100) {
      return badRequest(
        `Total weightage for this subject would exceed 100% (current sum: ${currentWeightageSum}%)`,
      );
    }

    // Check duplicate name
    const duplicate = await prisma.evaluationTemplate.findFirst({
      where: {
        gradeConfigId: body.gradeConfigId,
        syncedSubjectId: body.syncedSubjectId,
        name: body.name,
        deletedAt: null,
      },
    });
    if (duplicate) {
      return conflict("An evaluation template with this name already exists for this subject");
    }

    const template = await prisma.evaluationTemplate.create({
      data: {
        gradeConfigId: body.gradeConfigId,
        syncedSubjectId: body.syncedSubjectId,
        examId: body.examId,
        name: body.name,
        fullMarks: body.fullMarks,
        passMarks: body.passMarks,
        weightage: body.weightage,
        scheduledDate: body.scheduledDate,
        displayOrder: body.displayOrder,
      },
      include: {
        syncedSubject: true,
        gradeConfig: true,
        exam: { select: { id: true, name: true } },
      },
    });

    return created(template, "Evaluation template created");
  },
  ["ADMIN"], // Only Admin can create evaluation templates
);
