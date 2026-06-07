import type { User as PrismaUser } from "@prisma/client";

// ── DB Row Types ───────────────────────────────────────────────
export type User = PrismaUser;
export type NewUser = Omit<PrismaUser, "id" | "createdAt" | "updatedAt">;

// ── Auth Types ─────────────────────────────────────────────────
export type UserRole = "admin" | "teacher" | "user";

// Extend next-auth session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}

// ── API Response envelope ──────────────────────────────────────
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Pagination ─────────────────────────────────────────────────
export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ── Action Results (Server Actions) ───────────────────────────
export type ActionSuccess<T = void> = {
  success: true;
  data?: T;
  message?: string;
};

export type ActionError = {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T = void> = ActionSuccess<T> | ActionError;
