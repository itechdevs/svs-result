// ============================================================================
// SECONDARY MARKS ENTRY TYPES
// ============================================================================

export type SecondaryComponentType = "INTERNAL" | "THEORY" | "PRACTICAL";

export type MarksStatus = "DRAFT" | "SUBMITTED" | "VERIFIED" | "LOCKED";

// ============================================================================
// Subject Configuration
// ============================================================================

export interface SecondarySubjectConfig {
  id: string;
  syncedSubjectId: string;
  academicYearId: string;
  gradeLevel: string;
  creditHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncedSubject?: {
    id: string;
    name: string;
    code: string;
    gradeLevel: string;
  };
  components: SecondarySubjectComponent[];
}

export interface SecondarySubjectComponent {
  id: string;
  subjectConfigId: string;
  type: SecondaryComponentType;
  fullMarks: number;
  passMarks: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  practicalHeadings?: SecondaryPracticalHeading[];
  _count?: {
    componentMarks: number;
    practicalHeadings: number;
  };
}

export interface SecondaryPracticalHeading {
  id: string;
  componentId: string;
  name: string;
  fullMarks: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Marks Entry
// ============================================================================

export interface SecondaryComponentMark {
  id: string;
  syncedStudentId: string;
  componentId: string;
  examId: string;
  enteredById: string;
  marksObtained: number | null;
  isAbsent: boolean;
  status: MarksStatus;
  submittedAt: string | null;
  verifiedById: string | null;
  verifiedAt: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  syncedStudent?: {
    id: string;
    name: string;
    rollNumber: string;
    section: string;
  };
}

export interface SecondaryPracticalHeadingMark {
  id: string;
  syncedStudentId: string;
  headingId: string;
  examId: string;
  marksObtained: number;
  createdAt: string;
  updatedAt: string;
  heading?: SecondaryPracticalHeading;
}

// ============================================================================
// UI State & Forms
// ============================================================================

export interface MarkEntryFilters {
  academicYearId: string;
  gradeLevel: string;
  syncedSubjectId: string;
  examId: string;
}

export interface StudentMarkInput {
  syncedStudentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks?: string;
}

export interface PracticalHeadingMarkInput {
  syncedStudentId: string;
  headingId: string;
  marksObtained: number;
}

export interface MarkEntryRow {
  studentId: string;
  studentName: string;
  rollNumber: string;
  section: string;
  marksObtained: number | null;
  isAbsent: boolean;
  status: MarksStatus;
  remarks: string | null;
  hasUnsavedChanges: boolean;
  validationError: string | null;
}

export interface PracticalMarkEntryRow {
  studentId: string;
  studentName: string;
  rollNumber: string;
  section: string;
  isAbsent: boolean;
  headingMarks: Record<string, number | null>; // headingId -> marks
  totalMarks: number | null;
  status: MarksStatus;
  hasUnsavedChanges: boolean;
  validationError: string | null;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface SaveMarksRequest {
  componentId: string;
  examId: string;
  marks: StudentMarkInput[];
}

export interface SavePracticalMarksRequest {
  componentId: string;
  examId: string;
  marks: PracticalHeadingMarkInput[];
}

export interface SubmitMarksRequest {
  marksIds: string[];
}

export interface MarksEntryStats {
  totalStudents: number;
  enteredCount: number;
  absentCount: number;
  draftCount: number;
  submittedCount: number;
  verifiedCount: number;
  errorCount: number;
  completionPercentage: number;
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface BulkValidationResult {
  isValid: boolean;
  errors: Record<string, string>; // studentId -> error message
  errorCount: number;
}
