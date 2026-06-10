import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError, ForbiddenError, getSession, requireRole } from "./auth";
import {
  forbidden,
  handleZodError,
  serverError,
  unauthorized,
} from "./response";
import type { UserRole } from "@prisma/client";
import type { SessionUser } from "./auth";

type Context = { params: Promise<Record<string, string>> };

type HandlerFn = (
  req: NextRequest,
  ctx: { params: Record<string, string>; user: SessionUser | null },
) => Promise<NextResponse>;

type AuthHandlerFn = (
  req: NextRequest,
  ctx: { params: Record<string, string>; user: SessionUser },
) => Promise<NextResponse>;

/**
 * Wraps a handler with unified ZodError / AuthError / ForbiddenError handling.
 * Pass `roles` to enforce role-based access.
 */
export function withHandler(fn: AuthHandlerFn, roles?: UserRole[]) {
  return async (req: NextRequest, context: Context) => {
    try {
      const params = await context.params;
      let user: SessionUser;
      if (roles && roles.length > 0) {
        user = await requireRole(...roles);
      } else {
        const s = await getSession();
        if (!s) return unauthorized();
        user = s;
      }
      return await fn(req, { params, user });
    } catch (err) {
      if (err instanceof ZodError) return handleZodError(err);
      if (err instanceof AuthError) return unauthorized(err.message);
      if (err instanceof ForbiddenError) return forbidden(err.message);
      console.error("[API ERROR]", err);
      return serverError();
    }
  };
}

/** Public handler — no auth required, but still catches errors */
export function withPublicHandler(fn: HandlerFn) {
  return async (req: NextRequest, context: Context) => {
    try {
      const params = await context.params;
      const user = await getSession();
      return await fn(req, { params, user });
    } catch (err) {
      if (err instanceof ZodError) return handleZodError(err);
      console.error("[API ERROR]", err);
      return serverError();
    }
  };
}
