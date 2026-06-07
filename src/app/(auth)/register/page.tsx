"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Mail, Lock, User, ArrowRight, UserCheck, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"teacher" | "admin">("teacher");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate database insertion and account registration
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      // Redirect to login page, passing user registration params
      setTimeout(() => {
        router.push(`${ROUTES.LOGIN}?registered=success&email=${encodeURIComponent(email)}&role=${role}`);
      }, 1500);
    }, 1500);
  };

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

        {/* Register Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">Create Portal Account</h2>
            <p className="text-xs text-slate-400 mt-1">Set up your school staff profile below</p>
          </div>

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-250 text-xs py-5 px-4 rounded-2xl text-center space-y-2 font-medium">
              <span className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin inline-block mb-1"></span>
              <p className="font-bold">Staff Account Generated Successfully!</p>
              <p className="text-slate-400 text-[10px]">Loading authentication details, routing to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prof. James Henderson"
                    required
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#9ff5c1] focus:border-[#9ff5c1] transition-all"
                  />
                </div>
              </div>

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

              {/* Portal Role Selector */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assigned Role</label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setRole("teacher")}
                    disabled={loading}
                    className={`py-2.5 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all transform active:scale-95 cursor-pointer ${
                      role === "teacher"
                        ? "bg-[#0b6c44]/20 border-[#9ff5c1] text-[#9ff5c1]"
                        : "bg-white/5 border-white/10 text-slate-450 hover:bg-white/10"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Teacher Role</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    disabled={loading}
                    className={`py-2.5 px-3 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all transform active:scale-95 cursor-pointer ${
                      role === "admin"
                        ? "bg-blue-600/20 border-blue-500 text-blue-400"
                        : "bg-white/5 border-white/10 text-slate-450 hover:bg-white/10"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Role</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#0a6c44] to-[#0d7c4f] text-white hover:from-[#0d7c4f] hover:to-[#0f8c5a] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all shadow-md cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Submit staff registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <span className="text-xs text-slate-400">Already registered? </span>
            <Link href={ROUTES.LOGIN} className="text-xs font-bold text-[#9ff5c1] hover:underline cursor-pointer">
              Sign In
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
