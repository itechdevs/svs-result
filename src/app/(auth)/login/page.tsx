"use client";

import React, { useId, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { Loader2,UserCheck,ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/lib/constants";


// ─── LoginForm ────────────────────────────────────────────────────────────────

function LoginForm() {
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const callbackUrl = email.toLowerCase().includes("admin")
        ? ROUTES.ADMIN_DASHBOARD
        : ROUTES.TEACHER_DASHBOARD;

      await signIn("credentials", { email, password, callbackUrl });
    } catch {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: "teacher" | "admin") => {
    setLoading(true);
    setError("");

    const credentials = {
      teacher: { email: "teacher@school.com", password: "password" },
      admin: { email: "admin@school.com", password: "password" },
    }[role];

    try {
      const callbackUrl =
        role === "admin" ? ROUTES.ADMIN_DASHBOARD : ROUTES.TEACHER_DASHBOARD;

      await signIn("credentials", { ...credentials, callbackUrl });
    } catch {
      setError("An unexpected error occurred during quick login.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-card border border-border rounded-2xl shadow-lg overflow-hidden">

      {/* ── Card Header ── */}
      
      <div className="px-8 pt-8 pb-6 text-center">
        <div className="flex justify-center mb-5">
          <img
            src="/SVS LOGO NEW.png"
            alt="SVS School Logo"
            className="h-16 w-auto object-contain"
          />
        </div>

        <h3 className="text-xl font-bold text-foreground">
          Result Management System
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to access student results
        </p>
      </div>

      {/* ── Card Body ── */}
      <div className="px-8 pb-8 space-y-6">

        {/* Error alert */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3"
          >
            <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center text-destructive text-[10px] font-bold">
              !
            </span>
            <p className="text-sm text-destructive leading-snug">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor={emailId}
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest"
            >
              Email Address
            </label>
            <Input
              id={emailId}
              type="email"
              autoComplete="email"
              placeholder="teacher@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-10 px-3.5 text-sm rounded-md"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor={passwordId}
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                
                className="h-10 px-3.5 pr-10 text-sm rounded-md"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full h-10 text-sm font-medium mt-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Signing in…</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
            Quick portal sign-in
          </span>
          <Separator className="flex-1" />
        </div>

        {/* Quick-login buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleQuickLogin("teacher")}
            aria-label="Quick sign in as Teacher"
            className="h-10 text-sm font-medium gap-2"
          >
            <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            Teacher mode
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => handleQuickLogin("admin")}
            aria-label="Quick sign in as Admin"
            className="h-10 text-sm font-medium gap-2"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            Admin mode
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── LoginPage (shell) ────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <div className="bg-card border border-border rounded-2xl shadow-lg p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading portal…</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
