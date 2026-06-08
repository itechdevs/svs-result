import { auth } from "@/services/auth";
import { NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard"];

// Routes only accessible when NOT authenticated
const AUTH_ONLY_ROUTES = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const path = nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    path.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ONLY_ROUTES.some((route) => path === route);

  // Redirect unauthenticated users to login
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Run middleware on all routes except static files and Next internals
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
