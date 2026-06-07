"use client";

import React, { useState, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { GraduationCap, Mail, Lock, ArrowRight, ShieldCheck, UserCheck, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const registered = searchParams.get("registered");
  const queryEmail = searchParams.get("email");
  const queryRole = searchParams.get("role");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Pre-fill email and show success message if returning from registration
  useEffect(() => {
    if (registered === "success" && queryEmail) {
      setEmail(decodeURIComponent(queryEmail));
      setSuccessMessage(`Registration complete! Account created for role: ${queryRole?.toUpperCase()}. Please sign in below.`);
    }
  }, [registered, queryEmail, queryRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: "teacher" | "admin") => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    const credentials = {
      teacher: { email: "teacher@school.com", password: "password" },
      admin: { email: "admin@school.com", password: "password" },
    }[role];

    try {
      const result = await signIn("credentials", {
        ...credentials,
        redirect: false,
      });

      if (result?.error) {
        setError("Quick login failed.");
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred during quick login.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">Sign In to Dashboard</h2>
        <p className="text-xs text-slate-400 mt-1">Enter your school credentials or select Quick Login below</p>
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-250 text-xs py-3 px-4 rounded-xl text-center font-medium flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#9ff5c1] mt-0.5" />
          <span className="text-left">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs py-3 px-4 rounded-xl text-center font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@school.com"
              required
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#9ff5c1] focus:border-[#9ff5c1] transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#9ff5c1] focus:border-[#9ff5c1] transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#0a6c44] to-[#0d7c4f] text-white hover:from-[#0d7c4f] hover:to-[#0f8c5a] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Login Section */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center">Quick Portal Sign-In</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleQuickLogin("teacher")}
            disabled={loading}
            className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all hover:border-[#9ff5c1]/30 transform active:scale-95 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#9ff5c1]" />
            <span>Teacher Mode</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("admin")}
            disabled={loading}
            className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all hover:border-blue-400/30 transform active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Admin Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#020b18] via-[#091b36] to-[#040f21] px-4 py-12 relative overflow-hidden font-sans">
      
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-8">
        
        {/* Logo and Intro */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#9ff5c1] flex items-center justify-center text-[#002045] font-black shadow-[0_0_20px_rgba(159,245,193,0.3)] transform transition-transform hover:scale-105 duration-300">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">EduGrade Pro</h1>
            <p className="text-xs uppercase font-bold text-blue-300/60 tracking-widest mt-1">School Result Management System</p>
          </div>
        </div>

        {/* Suspense Wrapped Login Form */}
        <Suspense fallback={
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center text-slate-400 text-xs py-12">
            <span className="w-6 h-6 border-2 border-[#9ff5c1] border-t-transparent rounded-full animate-spin inline-block mb-3"></span>
            <p>Loading EduGrade portal components...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>

        <div className="text-center">
          <span className="text-xs text-slate-400">Need a staff account? </span>
          <Link href={ROUTES.REGISTER} className="text-xs font-bold text-[#9ff5c1] hover:underline cursor-pointer">
            Create Account
          </Link>
        </div>

      </div>
    </main>
  );
}
