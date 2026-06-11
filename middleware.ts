import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Allow API auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/verify-email") || pathname.startsWith("/reset-password") || pathname.startsWith("/forgot-password")) {
    if (user) {
      const redirectPath = user.role === "ADMIN" ? "/admin/dashboard" : "/teacher/dashboard";
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }
    return NextResponse.next();
  }

  // Protected routes require authentication
  if (pathname.startsWith("/admin") || pathname.startsWith("/teacher")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Only redirect if user is on WRONG dashboard
    const isAdmin = user.role === "ADMIN";
    const isOnAdminPage = pathname.startsWith("/admin");
    const isOnTeacherPage = pathname.startsWith("/teacher");

    // ADMIN trying to access teacher pages -> redirect to admin
    if (isAdmin && isOnTeacherPage) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    // TEACHER trying to access admin pages -> redirect to teacher
    if (!isAdmin && isOnAdminPage) {
      return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
    }

    // User is on correct dashboard, allow
    return NextResponse.next();
  }

  // Protected API routes (except /api/auth)
  if (pathname.startsWith("/api")) {
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}) as never;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
