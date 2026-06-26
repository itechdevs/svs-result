"use client";

// ─────────────────────────────────────────────
//  GradeSheet — Root A4 printable component
//
//  Usage:
//    <GradeSheet result={studentResult} />
//
//  Print:
//    window.print()   (print-grade-sheet class on body)
// ─────────────────────────────────────────────

import React from "react";
import { StudentResult, DEMO_STUDENT } from "../types";
import BackgroundPattern from "./BackgroundPattern";
import Watermark from "./Watermark";
import StudentInfo from "./StudentInfo";
import GradeTable from "./GradeTable";
import GPASummary from "./GPASummary";
import GradeLegend from "./GradeLegend";
import SignatureSection from "./SignatureSection";

interface GradeSheetProps {
  result?: StudentResult;
  /** When true, renders a print-trigger button above the sheet */
  showPrintButton?: boolean;
}

// ── Logo SVG (used when no image is available) ──────────────────────────────
function LogoSVG() {
  return (
    <svg
      viewBox="0 0 100 100"
      width="62"
      height="62"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke="#1f5e9d"
        strokeWidth="3"
      />
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="#1f5e9d"
        strokeWidth="1.5"
      />
      <polygon
        points="50,15 56,30 72,30 60,39 65,55 50,46 35,55 40,39 28,30 44,30"
        fill="none"
        stroke="#1f5e9d"
        strokeWidth="1.5"
      />
      <text
        x="50"
        y="70"
        textAnchor="middle"
        fontSize="9"
        fontFamily="Arial"
        fontWeight="900"
        fill="#1f5e9d"
      >
        SVS
      </text>
    </svg>
  );
}

// ── School header ────────────────────────────────────────────────────────────
function SchoolHeader({ result }: { result: StudentResult }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "64px 1fr 64px",
        alignItems: "center",
        paddingBottom: "8px",
        borderBottom: "1.5px solid #4a7aa8",
        marginBottom: "8px",
      }}
    >
      {/* Logo — left column */}
      <div
        style={{
          width: "64px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={result.logo}
          alt={`${result.schoolName} logo`}
          width={62}
          height={62}
          style={{ objectFit: "contain" }}
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = "none";
            const fb = el.nextElementSibling as HTMLElement | null;
            if (fb) fb.style.display = "flex";
          }}
        />
        <div
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LogoSVG />
        </div>
      </div>

      {/* Centre text — middle column */}
      <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif" }}>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 900,
            color: "#1f5e9d",
            letterSpacing: "1px",
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}
        >
          {result.schoolName}
        </div>
        <div
          style={{
            fontSize: "10.5px",
            color: "#1f5e9d",
            fontWeight: 600,
            marginTop: "1px",
          }}
        >
          {result.schoolAddress}
        </div>
        <div
          style={{
            fontSize: "9.5px",
            color: "#1f5e9d",
            fontWeight: 500,
            marginTop: "1px",
          }}
        >
          Phone: {result.schoolPhone}&nbsp;&nbsp;|&nbsp;&nbsp;Email:{" "}
          {result.schoolEmail}
        </div>
      </div>

      {/* Right column — empty for symmetry */}
      <div />
    </div>
  );
}

// ── Exam title block ─────────────────────────────────────────────────────────
function ExamTitle() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "5px 0 3px",
        borderBottom: "1px solid #4a7aa8",
        marginBottom: "8px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 800,
          color: "#1f5e9d",
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        FINAL EXAMINATION
      </div>
      <div
        style={{
          fontSize: "19px",
          fontWeight: 900,
          color: "#1f5e9d",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginTop: "1px",
        }}
      >
        GRADE SHEET
      </div>
    </div>
  );
}

// ── Root component ───────────────────────────────────────────────────────────
export default function GradeSheet({
  result = DEMO_STUDENT,
  showPrintButton = true,
}: GradeSheetProps) {
  const handlePrint = () => {
    document.body.classList.add("printing-grade-sheet");
    window.print();
    window.addEventListener(
      "afterprint",
      () => document.body.classList.remove("printing-grade-sheet"),
      { once: true },
    );
  };

  return (
    <>
      {/* ── Print styles (injected once in the page) ── */}
      <style>{`
        @media print {
          body > *:not(.grade-sheet-root) { display: none !important; }
          .no-print { display: none !important; }
          .grade-sheet-root {
            box-shadow: none !important;
            margin: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* Print button */}
      {showPrintButton && (
        <div
          className="no-print"
          style={{ textAlign: "center", marginBottom: "16px" }}
        >
          <button
            onClick={handlePrint}
            style={{
              padding: "8px 28px",
              background: "#1f5e9d",
              color: "white",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "Arial, sans-serif",
              letterSpacing: "0.5px",
            }}
          >
            🖨 Print Grade Sheet
          </button>
        </div>
      )}

      {/* ── A4 Page ── */}
      <div
        className="grade-sheet-root"
        style={{
          width: "210mm",
          minHeight: "297mm",
          background: "white",
          position: "relative",
          margin: "0 auto",
          overflow: "hidden",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {/* Layer 0a: Repeating text pattern */}
        <BackgroundPattern schoolName={result.schoolName} />

        {/* Layer 0b: Logo watermark */}
        <Watermark logo={result.logo} schoolName={result.schoolName} />

        {/* ── Content (z-index 1) ── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "6mm",
            minHeight: "297mm",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Outer border */}
          <div
            style={{
              border: "2px solid #4a7aa8",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Inner border */}
            <div
              style={{
                border: "1px solid #4a7aa8",
                margin: "4px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "10px 14px",
              }}
            >
              {/* School header */}
              <SchoolHeader result={result} />

              {/* "FINAL EXAMINATION / GRADE SHEET" */}
              <ExamTitle />

              {/* Student info sentence */}
              <StudentInfo
                studentName={result.studentName}
                rollNo={result.rollNo}
                grade={result.grade}
                nepaliYear={result.nepaliYear}
                englishYear={result.englishYear}
              />

              {/* Marks table */}
              <GradeTable subjects={result.subjects} />

              {/* GPA + Rank strip */}
              <GPASummary gpa={result.gpa} rank={result.rank} />

              {/* Notes + Intervals */}
              <GradeLegend />

              {/* Signatures + date */}
              <SignatureSection
                issueDate={result.issueDate}
                issueDateAD={result.issueDateAD}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
