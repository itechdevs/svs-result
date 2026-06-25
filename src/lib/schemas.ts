import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

export const cuidParam = z.string().cuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(5000).default(20),
});

export const gradeLevels = [
  "Playgroup",
  "KG",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
] as const;

export const gradeLevelSchema = z.string();

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
    name: z.string().min(1).max(120),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Users (Admin)

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  name: z.string().min(1).max(120),
  role: z.enum(["ADMIN", "TEACHER"]),
  syncedTeacherId: z.string().cuid().optional(), // required when role=TEACHER
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
  syncedTeacherId: z.string().cuid().nullable().optional(),
});

export const listUsersSchema = paginationSchema.extend({
  role: z.enum(["ADMIN", "TEACHER"]).optional(),
  isActive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  search: z.string().optional(),
});

// ─── Academic Year ────────────────────────────────────────────────────────────

export const createAcademicYearSchema = z.object({
  name: z.string().min(1).max(20),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isCurrent: z.boolean().default(false),
});

export const updateAcademicYearSchema = createAcademicYearSchema.partial();

// ─── Grade Config ─────────────────────────────────────────────────────────────

export const createGradeConfigSchema = z.object({
  academicYearId: z.string().cuid(),
  gradeLevel: gradeLevelSchema,
  gradeType: z.enum(["LETTER", "GPA", "DESCRIPTIVE"]).default("DESCRIPTIVE"),
  passCriteria: z.string().max(500).optional(),
});

export const updateGradeConfigSchema = createGradeConfigSchema
  .omit({ academicYearId: true, gradeLevel: true })
  .partial();

// ─── Grade Scale ──────────────────────────────────────────────────────────────

export const createGradeScaleSchema = z.object({
  minPercent: z.number().min(0).max(100),
  maxPercent: z.number().min(0).max(100),
  grade: z.string().min(1).max(30),
  gradePoint: z.number().min(0).max(4).optional(),
  description: z.string().max(100).optional(),
});

export const bulkUpsertGradeScalesSchema = z.object({
  scales: z
    .array(createGradeScaleSchema)
    .min(1)
    .refine(
      (scales) => {
        // Ensure no overlapping ranges
        const sorted = [...scales].sort((a, b) => a.minPercent - b.minPercent);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].minPercent <= sorted[i - 1].maxPercent) return false;
        }
        return true;
      },
      { message: "Grade scale ranges must not overlap" },
    ),
});

// ─── Exam ────────────────────────────────────────────────────────

export const createExamSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  academicYearId: z.string().cuid(),
  gradeLevel: gradeLevelSchema,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const updateExamSchema = createExamSchema.partial();

export const listExamsSchema = z.object({
  academicYearId: z.string().cuid().optional(),
  gradeLevel: gradeLevelSchema.optional(),
  isActive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

// ─── Evaluation Template ──────────────────────────────────────────────────────

export const createEvaluationTemplateSchema = z.object({
  gradeConfigId: z.string().cuid(),
  syncedSubjectId: z.string().cuid(),
  examId: z.string().cuid().optional(),
  name: z.string().min(1).max(100),
  fullMarks: z.number().positive(),
  passMarks: z.number().nonnegative(),
  weightage: z.number().positive().max(100),
  scheduledDate: z.coerce.date().optional(),
  displayOrder: z.number().int().min(0).default(0),
});

export const updateEvaluationTemplateSchema = createEvaluationTemplateSchema
  .omit({ gradeConfigId: true, syncedSubjectId: true })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
    examId: z.string().cuid().nullable().optional(),
  });

export const listEvaluationTemplatesSchema = z.object({
  gradeConfigId: z.string().cuid().optional(),
  syncedSubjectId: z.string().cuid().optional(),
  examId: z.string().cuid().optional(),
  academicYearId: z.string().cuid().optional(),
  isActive: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

// ─── Teacher Assignment ───────────────────────────────────────────────────────

export const createTeacherAssignmentSchema = z.object({
  userId: z.string().cuid(),
  gradeLevel: gradeLevelSchema,
  syncedSubjectId: z.string().cuid().optional(),
  academicYearId: z.string().cuid(),
});

export const listTeacherAssignmentsSchema = z.object({
  userId: z.string().cuid().optional(),
  gradeLevel: gradeLevelSchema.optional(),
  academicYearId: z.string().cuid().optional(),
});

// ─── Student Evaluation Result ────────────────────────────────────────────────

const upsertEvaluationResultBaseSchema = z.object({
  marksObtained: z.number().min(0).optional(),
  isAbsent: z.boolean().default(false),
  remarks: z.string().max(500).optional(),
});

export const upsertEvaluationResultSchema = upsertEvaluationResultBaseSchema
  .refine((d) => d.isAbsent || d.marksObtained !== undefined, {
    message: "marksObtained is required unless student is absent",
    path: ["marksObtained"],
  });

export const bulkUpsertEvaluationResultsSchema = z.object({
  evaluationTemplateId: z.string().cuid(),
  submit: z.boolean().optional(), // if true, save as SUBMITTED (publish)
  results: z
    .array(
      upsertEvaluationResultBaseSchema.extend({
        syncedStudentId: z.string().cuid(),
      }).refine((d) => d.isAbsent || d.marksObtained !== undefined, {
        message: "marksObtained is required unless student is absent",
        path: ["marksObtained"],
      }),
    )
    .min(1),
});

export const verifyEvaluationResultSchema = z.object({
  remarks: z.string().max(500).optional(),
});

export const listEvaluationResultsSchema = paginationSchema.extend({
  evaluationTemplateId: z.string().cuid().optional(),
  evaluationTemplateIds: z.string().transform((val, ctx) => {
    if (!val) return undefined;
    const ids = val.split(',');
    for (const id of ids) {
      const result = z.string().cuid().safeParse(id);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid CUID format: ${id}`,
        });
        return z.NEVER;
      }
    }
    return ids;
  }).optional(),
  syncedStudentId: z.string().cuid().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "VERIFIED", "LOCKED"]).optional(),
});

// ─── Re-Exam ──────────────────────────────────────────────────────────────────

export const createReExamScheduleSchema = z.object({
  evaluationTemplateId: z.string().cuid(),
  scheduledDate: z.coerce.date(),
  entryOpenDate: z.coerce.date().optional(),
  entryCloseDate: z.coerce.date().optional(),
  fullMarks: z.number().positive(),
  passMarks: z.number().positive(),
  remarks: z.string().max(500).optional(),
});

export const updateReExamScheduleSchema = createReExamScheduleSchema
  .omit({ evaluationTemplateId: true })
  .partial();

export const enrollStudentsSchema = z.object({
  syncedStudentIds: z.array(z.string().cuid()).min(1),
});

export const upsertReExamResultSchema = z.object({
  marksObtained: z.number().min(0),
  remarks: z.string().max(500).optional(),
});

export const reExamAssessmentSchema = z.object({
  evaluationTemplateId: z.string().cuid(),
  syncedStudentId: z.string().cuid(),
  marksObtained: z.coerce.number().min(0),
  scheduledDate: z.coerce.date(),
  remarks: z.string().max(500).optional().transform(val => val || undefined),
});

// ─── Aggregation ──────────────────────────────────────────────────────────────

export const aggregateResultsSchema = z.object({
  academicYearId: z.string().cuid(),
  gradeLevel: gradeLevelSchema,
  // If omitted → aggregate all students in the grade
  syncedStudentIds: z.array(z.string().cuid()).optional(),
});

export const publishResultsSchema = z.object({
  academicYearId: z.string().cuid(),
  gradeLevel: gradeLevelSchema,
  // If omitted → publish all
  syncedStudentIds: z.array(z.string().cuid()).optional(),
  remarks: z.string().max(500).optional(),
});

// ─── Marksheet ────────────────────────────────────────────────────────────────

export const generateMarksheetSchema = z.object({
  finalResultId: z.string().cuid(),
});

// ─── Sync ─────────────────────────────────────────────────────────────────────

export const syncStudentSchema = z.object({
  sourceId: z.string(),
  name: z.string().min(1),
  rollNumber: z.string().min(1),
  grade: z.string().min(1),
  section: z.string().min(1),
  isActive: z.boolean().default(true),
  class: z.string().optional(),
  classroom: z.object({ name: z.string() }).optional(),
}).passthrough();

export const syncTeacherSchema = z.object({
  sourceId: z.string(),
  name: z.string().min(1),
  isActive: z.boolean().default(true),
});

export const syncSubjectSchema = z.object({
  sourceId: z.string(),
  name: z.string().min(1),
  code: z.string().min(1),
  gradeLevel: gradeLevelSchema,
  isActive: z.boolean().default(true),
});

export const syncWebhookSchema = z.object({
  entity: z.enum(["student", "teacher", "subject"]),
  action: z.enum(["create", "update", "deactivate"]),
  payload: z.union([syncStudentSchema, syncTeacherSchema, syncSubjectSchema]),
});

export const listSyncLogsSchema = paginationSchema.extend({
  entity: z.enum(["student", "teacher", "subject"]).optional(),
  status: z.enum(["success", "error"]).optional(),
  sourceId: z.string().optional(),
});

// ─── Teacher Subject Compilation ──────────────────────────────────────────────

export const createTeacherCompilationSchema = z.object({
  syncedSubjectId: z.string().min(1, "Subject is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
  gradeLevel: z.string().min(1, "Grade level is required"),
  evaluationTemplateIds: z.array(z.string()).min(1, "At least one evaluation template is required"),
});

export const listTeacherCompilationsSchema = z.object({
  syncedSubjectId: z.string().optional(),
  academicYearId: z.string().optional(),
  gradeLevel: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
});
