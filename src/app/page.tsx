import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, ArrowRight, UserCheck, ShieldCheck, BookOpen, Settings, Library, TrendingUp } from "lucide-react";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "EduGrade Pro - School Result Management System",
  description: "Dynamic academic grading, evaluation rubrics, GPA compilation, and re-exam scheduling portal.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#020b18] text-white font-sans relative overflow-hidden flex flex-col justify-between">
      
      {/* Background Radial Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[180px] pointer-events-none"></div>

      {/* --- HEADER NAVBAR --- */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9ff5c1] flex items-center justify-center text-[#002045] font-black shadow-[0_0_15px_rgba(159,245,193,0.25)]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white leading-none">EduGrade Pro</h1>
            <p className="text-[9px] uppercase font-bold text-blue-300/60 tracking-widest mt-1">Academic ERP</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Link
            href={ROUTES.LOGIN}
            className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-xs font-semibold hover:border-white/20 transition-all text-white"
          >
            Portal Sign In
          </Link>
          <Link
            href={ROUTES.REGISTER}
            className="rounded-xl bg-gradient-to-r from-[#0a6c44] to-[#0d7c4f] text-white hover:opacity-95 px-4 py-2 text-xs font-semibold shadow-md shadow-emerald-950/20 transition-all"
          >
            Register Account
          </Link>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-5xl mx-auto relative z-10 space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase font-bold text-blue-300 tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>centralized result publishing system ready</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Centralized Academic Evaluations &amp; <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9ff5c1] via-blue-300 to-indigo-400">
              Dynamic GPA Compiler
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Bridging the gap between instruction and administration. Empower teachers to customize learning outcomes and enter marks, and provide admins with robust compilation blocks, re-exam tools, and official transcripts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm mx-auto pt-2">
          <Link
            href={ROUTES.LOGIN}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#0a6c44] to-[#0d7c4f] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all shadow-lg shadow-emerald-950/30 group hover:from-[#0d7c4f] hover:to-[#0f8c5a]"
          >
            <span>Access control panel</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={ROUTES.REGISTER}
            className="w-full sm:w-auto px-8 py-3.5 bg-white/5 border border-white/10 text-white font-bold text-xs rounded-xl hover:bg-white/10 hover:border-white/20 flex items-center justify-center transition-all"
          >
            Request registration
          </Link>
        </div>

        {/* Quick Stats Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl w-full max-w-4xl text-center backdrop-blur-md">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Allocated Faculty</span>
            <span className="text-2xl font-black text-white mt-1 block">124 Staff</span>
          </div>
          <div className="border-l border-white/10">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Managed Students</span>
            <span className="text-2xl font-black text-white mt-1 block">1,200+</span>
          </div>
          <div className="border-l border-white/10">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Passing Rate</span>
            <span className="text-2xl font-black text-[#9ff5c1] mt-1 block">98.2% GPA</span>
          </div>
          <div className="border-l border-white/10">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Active Classes</span>
            <span className="text-2xl font-black text-white mt-1 block">32 Sections</span>
          </div>
        </div>
      </section>

      {/* --- FEATURE MATRIX GRID --- */}
      <section className="w-full max-w-7xl mx-auto px-6 py-12 relative z-10 border-t border-white/5">
        <h3 className="text-center font-bold text-xs text-slate-500 uppercase tracking-widest mb-10">centralized role mapping workspace</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Teacher Role Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col justify-between space-y-6 hover:border-[#9ff5c1]/30 hover:shadow-[0_10px_30px_rgba(159,245,193,0.05)] transition-all group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#9ff5c1] flex items-center justify-center shadow-inner">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">instruction role</span>
              </div>
              <h4 className="text-lg font-bold text-white group-hover:text-[#9ff5c1] transition-colors">Teacher Workspace</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure curriculum assessments dynamically, specify learning outcome submarks, manage regular outcomes grading lists, schedule re-examinations, and submit grading documents directly to administration review.
              </p>
            </div>
            <ul className="text-xs text-slate-400 grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-medium">
              <li className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Evaluations Setup</li>
              <li className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Draft/Commit Grades</li>
              <li className="flex items-center gap-1.5"><Library className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Assigned Subjects</li>
              <li className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Re-Exam Portal</li>
            </ul>
          </div>

          {/* Admin Role Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col justify-between space-y-6 hover:border-blue-400/30 hover:shadow-[0_10px_30px_rgba(59,130,246,0.05)] transition-all group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">governance role</span>
              </div>
              <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Admin Governance Center</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Oversee assignments, manage staff Excel sheet accounts importing, audit teacher evaluations drafts, and compile overall class grades. Run weighted aggregations, generate transcripts, verify calculations, and publish final report sheets.
              </p>
            </div>
            <ul className="text-xs text-slate-400 grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-medium">
              <li className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Excel Imports Registry</li>
              <li className="flex items-center gap-1.5"><Library className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Staff Class Mapping</li>
              <li className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Weighted GPA Compiler</li>
              <li className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Official Transcript Print</li>
            </ul>
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="w-full border-t border-white/5 py-6 px-6 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10 bg-[#010710]">
        &copy; {new Date().getFullYear()} EduGrade Academy Inc. Central Grading Registry. All rights reserved.
      </footer>

    </main>
  );
}
