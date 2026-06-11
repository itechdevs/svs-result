"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, CheckCircle, XCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Email verified successfully!");
          setTimeout(() => router.push("/login"), 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("An unexpected error occurred");
      }
    };

    verify();
  }, [token, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#020b18] via-[#091b36] to-[#040f21] px-4 py-12">
      <div className="w-full max-w-md z-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#9ff5c1] flex items-center justify-center text-[#002045] shadow-[0_0_20px_rgba(159,245,193,0.3)]">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Email Verification</h1>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center space-y-4">
          {status === "loading" && (
            <>
              <div className="w-12 h-12 border-4 border-[#9ff5c1] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-300 text-sm">Verifying your email...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">{message}</h2>
              <p className="text-slate-400 text-sm">Redirecting to login...</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto" />
              <h2 className="text-xl font-bold text-white">Verification Failed</h2>
              <p className="text-slate-400 text-sm">{message}</p>
              <Link
                href="/login"
                className="inline-block mt-4 px-6 py-2 bg-[#9ff5c1] text-[#002045] rounded-xl font-semibold text-sm hover:bg-[#8ee5b1] transition"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#020b18] via-[#091b36] to-[#040f21]">
        <div className="text-white">Loading...</div>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
