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
  USER: "user",
  GUEST: "guest",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

// ── Routes ───────────────────────────────────────────────────
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  SETTINGS: "/dashboard/settings",
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
