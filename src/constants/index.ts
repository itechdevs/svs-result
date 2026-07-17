// ─────────────────────────────────────────────────────────────
// lib/constants.ts
// NO magic strings or numbers anywhere else in the codebase.
// Add every shared constant here.
// ─────────────────────────────────────────────────────────────

// ── App ──────────────────────────────────────────────────────
export const APP_NAME = "SVS Result" as const;
export const APP_DESCRIPTION = "Result Management System" as const;

// ── Auth ─────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

// ── Routes ───────────────────────────────────────────────────
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  // Admin routes
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_EXAMS: "/admin/exams",
  ADMIN_EXAM_DETAIL: "/admin/exams/[id]",
  ADMIN_ALLOCATIONS: "/admin/allocations",
  ADMIN_OBSERVATIONS: "/admin/observations",
  ADMIN_RE_EXAM: "/admin/re-exam-portal",
  ADMIN_MARK_ENTRY: "/admin/mark-entry",
  ADMIN_RESULT_COMPILATION: "/admin/result-compilation",
  ADMIN_SYNC: "/admin/sync",
  ADMIN_SYNCED_STUDENTS: "/admin/synced-students",
  ADMIN_SECONDARY_SUBJECT_CONFIG: "/admin/secondary/subject-config",
  ADMIN_SECONDARY_TERM_WEIGHTS: "/admin/secondary/term-weights",
  ADMIN_SECONDARY_RESULT_COMPILATION: "/admin/secondary/result-compilation",
  // Teacher routes
  TEACHER_DASHBOARD: "/teacher/dashboard",
  TEACHER_EVALUATIONS: "/teacher/evaluations",
  TEACHER_MARK_ENTRY: "/teacher/mark-entry",
  TEACHER_SECONDARY_MARK_ENTRY: "/teacher/secondary/mark-entry",
  TEACHER_RE_EXAM: "/teacher/re-exam-portal",
  TEACHER_OBSERVATIONS: "/teacher/observations",
} as const;

// ── Pagination ───────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ── API ──────────────────────────────────────────────────────
export const API_PREFIX = "/api" as const;

// ── Cache / Revalidation (seconds) ───────────────────────────
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

// ── Rate Limiting ─────────────────────────────────────────────
export const RATE_LIMIT = {
  PUBLIC_API_REQUESTS: 60, // requests
  PUBLIC_API_WINDOW: 60, // seconds
} as const;
