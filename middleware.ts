import { auth } from "@/services/auth";
import { NextResponse } from "next/server";

const ADMIN_PREFIX = "/admin";
const TEACHER_PREFIX = "/teacher";
const AUTH_ONLY_ROUTES = ["/login"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const path = nextUrl.pathname;
  const role = session?.user?.role;

  const isAdminRoute = path.startsWith(ADMIN_PREFIX);
  const isTeacherRoute = path.startsWith(TEACHER_PREFIX);
  const isProtected = isAdminRoute || isTeacherRoute;
  const isAuthRoute = AUTH_ONLY_ROUTES.some((r) => path === r);

  // Redirect unauthenticated users trying to access protected routes
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  if (isLoggedIn && isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/teacher/dashboard", nextUrl.origin));
  }
  if (isLoggedIn && isTeacherRoute && role !== "teacher") {
    return NextResponse.redirect(new URL("/admin/dashboard", nextUrl.origin));
  }

  // Redirect authenticated users away from login
  if (isAuthRoute && isLoggedIn) {
    const dest = role === "admin" ? "/admin/dashboard" : "/teacher/dashboard";
    return NextResponse.redirect(new URL(dest, nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
