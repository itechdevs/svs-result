import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; details?: unknown };

export function ok<T>(data: T, message?: string, status = 200) {
  const body: ApiResponse<T> = message
    ? { success: true, data, message }
    : { success: true, data };
  return NextResponse.json<ApiResponse<T>>(body, { status });
}

export function created<T>(data: T, message?: string) {
  return ok(data, message, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(error: string, details?: unknown) {
  const body: ApiResponse = details !== undefined
    ? { success: false, error, details }
    : { success: false, error };
  return NextResponse.json<ApiResponse>(body, { status: 400 });
}

export function unauthorized(error = "Unauthorized") {
  return NextResponse.json<ApiResponse>({ success: false, error }, { status: 401 });
}

export function forbidden(error = "Forbidden") {
  return NextResponse.json<ApiResponse>({ success: false, error }, { status: 403 });
}

export function notFound(error = "Not found") {
  return NextResponse.json<ApiResponse>({ success: false, error }, { status: 404 });
}

export function conflict(error: string) {
  return NextResponse.json<ApiResponse>({ success: false, error }, { status: 409 });
}

export function unprocessable(error: string, details?: unknown) {
  const body: ApiResponse = details !== undefined
    ? { success: false, error, details }
    : { success: false, error };
  return NextResponse.json<ApiResponse>(body, { status: 422 });
}

export function serverError(error = "Internal server error") {
  return NextResponse.json<ApiResponse>({ success: false, error }, { status: 500 });
}

export function handleZodError(err: ZodError) {
  return badRequest("Validation failed", err.flatten().fieldErrors);
}
