import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

export const cuidParam = z.string().cuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(5000).default(20),
});

export const gradeLevels = [
  "Rabbit (Playgroup)",
  "Penguin (Nursery)",
  "Panda (L.K.G.)",
  "Panda - B",
  "Giraffe (U.K.G.)",
  "Giraffe - A",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
] as const;

// Grade level classification helper
export function categorizeGradeLevel(
  gradeLevel: string,
): "PRE_PRIMARY" | "PRIMARY" | "SECONDARY" | "HIGHER_SECONDARY" {
  // Pre-primary: Contains animal names or nursery-related keywords
  if (
    gradeLevel.toLowerCase().includes("rabbit") ||
    gradeLevel.toLowerCase().includes("penguin") ||
    gradeLevel.toLowerCase().includes("panda") ||
    gradeLevel.toLowerCase().includes("giraffe") ||
    gradeLevel.toLowerCase().includes("playgroup") ||
    gradeLevel.toLowerCase().includes("nursery") ||
    gradeLevel.toLowerCase().includes("kg") ||
    gradeLevel.toLowerCase().includes("k.g")
  ) {
    return "PRE_PRIMARY";
  }

  // Extract numeric grade if present
  const numericMatch = gradeLevel.match(/\d+/);
  if (numericMatch) {
    const grade = parseInt(numericMatch[0]);
    if (grade >= 1 && grade <= 5) return "PRIMARY";
    if (grade >= 6 && grade <= 10) return "SECONDARY";
    if (grade >= 11 && grade <= 12) return "HIGHER_SECONDARY";
  }

  // Default fallback based on common patterns
  if (gradeLevel.match(/^[1-5]$/)) return "PRIMARY";
  if (gradeLevel.match(/^([6-9]|10)$/)) return "SECONDARY";
  if (gradeLevel.match(/^(11|12)$/)) return "HIGHER_SECONDARY";

  // Default to primary if uncertain
  return "PRIMARY";
}

// Group grade levels by category
export function groupGradeLevelsByCategory(gradeLevels: string[]) {
  const groups = {
    PRE_PRIMARY: [] as string[],
    PRIMARY: [] as string[],
    SECONDARY: [] as string[],
    HIGHER_SECONDARY: [] as string[],
  };

  gradeLevels.forEach((level) => {
    const category = categorizeGradeLevel(level);
    groups[category].push(level);
  });

  return groups;
}

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
  name: z.string().min(1),
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

export const upsertEvaluationResultSchema =
  upsertEvaluationResultBaseSchema.refine(
    (d) => d.isAbsent || d.marksObtained !== undefined,
    {
      message: "marksObtained is required unless student is absent",
      path: ["marksObtained"],
    },
  );

export const bulkUpsertEvaluationResultsSchema = z.object({
  evaluationTemplateId: z.string().cuid(),
  submit: z.boolean().optional(), // if true, save as SUBMITTED (publish)
  results: z
    .array(
      upsertEvaluationResultBaseSchema
        .extend({
          syncedStudentId: z.string().cuid(),
        })
        .refine((d) => d.isAbsent || d.marksObtained !== undefined, {
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
  evaluationTemplateIds: z
    .string()
    .transform((val, ctx) => {
      if (!val) return undefined;
      const ids = val.split(",");
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
    })
    .optional(),
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
  scheduledDate: z.coerce.date().refine((d) => !isNaN(d.getTime()), {
    message: "Invalid scheduled date",
  }),
  remarks: z
    .string()
    .max(500)
    .optional()
    .transform((val) => val || undefined),
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

export const syncStudentSchema = z
  .object({
    sourceId: z.string(),
    name: z.string().min(1),
    rollNumber: z.string().min(1),
    grade: z.string().min(1),
    section: z.string().min(1),
    isActive: z.boolean().default(true),
    class: z.string().optional(),
    classroom: z.object({ name: z.string() }).optional(),
  })
  .passthrough();

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
  evaluationTemplateIds: z
    .array(z.string())
    .min(1, "At least one evaluation template is required"),
});

export const listTeacherCompilationsSchema = z.object({
  syncedSubjectId: z.string().optional(),
  academicYearId: z.string().optional(),
  gradeLevel: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
});

// ─── Secondary Level (Grades 6-10) ─────────────────────────────────────────────

export const secondaryPracticalHeadingSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1),
  fullMarks: z.number().positive(),
  passMarks: z.number().nonnegative().optional(), // Adding passMarks to align with component (though maybe not required by schema, user mentioned it in prompt)
  displayOrder: z.number().int().min(0).default(0),
});

export const secondaryComponentTypeSchema = z.enum([
  "INTERNAL",
  "THEORY",
  "PRACTICAL",
]);

export const secondarySubjectComponentSchema = z.object({
  id: z.string().cuid().optional(), // optional for creates, required for updates
  type: secondaryComponentTypeSchema,
  fullMarks: z.number().positive(),
  passMarks: z.number().nonnegative(),
  displayOrder: z.number().int().min(0).default(0),
  practicalHeadings: z.array(secondaryPracticalHeadingSchema).optional(),
});

export const createSecondarySubjectConfigSchema = z.object({
  syncedSubjectId: z.string().cuid(),
  academicYearId: z.string().cuid(),
  gradeLevel: z.string(),
  creditHours: z.number().int().positive(),
  components: z.array(secondarySubjectComponentSchema).min(1),
});

export const updateSecondarySubjectConfigSchema =
  createSecondarySubjectConfigSchema
    .extend({
      isActive: z.boolean().optional(),
    })
    .partial();

export const createSecondaryPracticalHeadingSchema = z.object({
  headings: z.array(secondaryPracticalHeadingSchema).min(1),
});

export const secondaryTermWeightSchema = z.object({
  academicYearId: z.string().cuid(),
  gradeLevel: z.string(),
  examId: z.string().cuid(),
  termName: z.string().min(1),
  weightPercent: z.number().positive().max(100),
  displayOrder: z.number().int().min(0).default(0),
});

export const setSecondaryTermWeightsSchema = z.object({
  gradeLevel: z.string(),
  academicYearId: z.string().cuid(),
  weights: z
    .array(secondaryTermWeightSchema)
    .min(1)
    .refine(
      (weights) => {
        const sum = weights.reduce((acc, curr) => acc + curr.weightPercent, 0);
        // Allow small floating point inaccuracies but generally should equal 100
        return Math.abs(sum - 100) < 0.01;
      },
      {
        message: "Term weights must sum to exactly 100",
      },
    ),
});

export const secondaryComponentMarkSchema = z.object({
  syncedStudentId: z.string().cuid(),
  marksObtained: z.number().min(0).optional(),
  isAbsent: z.boolean().default(false),
  remarks: z.string().max(500).optional(),
});

export const upsertSecondaryMarksSchema = z.object({
  componentId: z.string().cuid(),
  examId: z.string().cuid(), // Term exam
  marks: z
    .array(secondaryComponentMarkSchema)
    .min(1)
    .refine(
      (marks) =>
        marks.every((m) => m.isAbsent || m.marksObtained !== undefined),
      {
        message: "marksObtained is required unless student is absent",
        path: ["marksObtained"],
      },
    ),
});

export const secondaryHeadingMarkSchema = z.object({
  syncedStudentId: z.string().cuid(),
  headingId: z.string().cuid(),
  marksObtained: z.number().min(0),
});

export const upsertSecondaryPracticalMarksSchema = z.object({
  componentId: z.string().cuid(),
  examId: z.string().cuid(),
  marks: z.array(secondaryHeadingMarkSchema).min(1),
});

export const compileSecondaryTermSchema = z.object({
  examId: z.string().cuid(),
});

export const publishSecondaryTermSchema = z.object({
  examId: z.string().cuid(),
});

export const compileSecondaryAnnualSchema = z.object({
  academicYearId: z.string().cuid(),
  gradeLevel: z.string(),
});

export const secondaryMarksheetSchema = z
  .object({
    termResultId: z.string().cuid().optional(),
    annualResultId: z.string().cuid().optional(),
  })
  .refine((d) => d.termResultId || d.annualResultId, {
    message: "Must provide either termResultId or annualResultId",
  });

// ─── Observation Categories ───────────────────────────────────────────────────

export const createObservationCategorySchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim(),
  displayOrder: z.number().int().min(0).default(0),
});

export const updateObservationCategorySchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const listObservationCategoriesSchema = z.object({
  includeItems: z
    .string()
    .transform((v) => v === "true")
    .optional(),
});

// ─── Observation Items ────────────────────────────────────────────────────────

export const createObservationItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500).trim(),
  displayOrder: z.number().int().min(0).default(0),
});

export const updateObservationItemSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(500)
    .trim()
    .optional(),
  displayOrder: z.number().int().min(0).optional(),
});
