"use client";

import React, { useId, useState, useCallback, Suspense } from "react";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { ROUTES } from "@/lib/constants";

// ─── Validation Schema ────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required.")
    .email("Please enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required.")
});

type LoginFields = z.infer<typeof loginSchema>;
type FieldErrors = Partial<Record<keyof LoginFields, string>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns per-field Zod errors as a plain object. */
function parseFieldErrors(
  data: LoginFields
): { success: true } | { success: false; errors: FieldErrors } {
  const result = loginSchema.safeParse(data);
  if (result.success) return { success: true };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof LoginFields;
    if (!errors[field]) errors[field] = issue.message;
  }
  return { success: false, errors };
}

// ─── FieldErrorMessage ────────────────────────────────────────────────────────

function FieldErrorMessage({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="flex items-center gap-1.5 text-xs text-destructive mt-1.5 font-medium"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

// ─── LoginForm ────────────────────────────────────────────────────────────────

function LoginForm() {
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = `${emailId}-error`;
  const passwordErrorId = `${passwordId}-error`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Per-field validation errors (only shown after first submit or on change
  // if the form has been submitted once)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validate = useCallback(
    (data: LoginFields): boolean => {
      const result = parseFieldErrors(data);
      if (result.success) {
        setFieldErrors({});
        return true;
      }
      setFieldErrors(result.errors);
      return false;
    },
    []
  );

  // Re-validate on change only after the user has attempted to submit at least
  // once — prevents "screaming" validation on a fresh form.
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (submitted) validate({ email: value, password });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (submitted) validate({ email, password: value });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");

    const isValid = validate({ email, password });
    if (!isValid) return;

    setLoading(true);

    try {
      const callbackUrl = email.toLowerCase().includes("admin")
        ? ROUTES.ADMIN_DASHBOARD
        : ROUTES.TEACHER_DASHBOARD;

      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Invalid email or password. Please try again.");
        toast.error("Invalid email or password");
      } else if (result?.url) {
        toast.success("Signed in successfully");
        window.location.href = result.url;
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────────

  const emailInvalid = Boolean(fieldErrors.email);
  const passwordInvalid = Boolean(fieldErrors.password);

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

        <h1 className="text-xl font-bold text-foreground">
          Result Management System
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to access student results and academic records
        </p>
      </div>

      {/* ── Card Body ── */}
      <div className="px-8 pb-8 space-y-6">

        {/* Server / auth error banner */}
        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3"
          >
            <AlertCircle
              className="mt-0.5 shrink-0 w-4 h-4 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-destructive leading-snug">{serverError}</p>
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
              onChange={handleEmailChange}
              disabled={loading}
              aria-required="true"
              aria-invalid={emailInvalid}
              aria-describedby={emailInvalid ? emailErrorId : undefined}
              className={`h-10 px-3.5 text-sm rounded-xl transition-colors ${emailInvalid
                ? "border-destructive focus-visible:ring-destructive/30"
                : ""
                }`}
            />
            <FieldErrorMessage id={emailErrorId} message={fieldErrors.email} />
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
                onChange={handlePasswordChange}
                disabled={loading}
                aria-required="true"
                aria-invalid={passwordInvalid}
                aria-describedby={passwordInvalid ? passwordErrorId : undefined}
                className={`h-10 px-3.5 pr-10 text-sm rounded-xl transition-colors ${passwordInvalid
                  ? "border-destructive focus-visible:ring-destructive/30"
                  : ""
                  }`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword((prev) => !prev)}
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
            <FieldErrorMessage
              id={passwordErrorId}
              message={fieldErrors.password}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full h-10 text-sm font-semibold mt-1 rounded-xl"
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
