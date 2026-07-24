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
import { SCHOOL_CONFIG } from "@/constants";
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
        {SCHOOL_CONFIG.abbrev}
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
        gridTemplateColumns: "80px 1fr 80px",
        alignItems: "center",
        paddingBottom: "8px",
        marginBottom: "8px",
      }}
    >
      {/* Logo — left column */}
      <div
        style={{
          width: "80px",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={result.logo}
          alt={`${result.schoolName} logo`}
          width={80}
          height={80}
          style={{ objectFit: "contain", mixBlendMode: "multiply" }}
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
            fontSize: "24px",
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
            fontSize: "13px",
            color: "#1f5e9d",
            fontWeight: 600,
            marginTop: "1px",
          }}
        >
          {result.schoolAddress}
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#1f5e9d",
            fontWeight: 500,
            marginTop: "1px",
          }}
        >
          Email: {result.schoolEmail}
          {result.schoolWebsite ? `  |  Website: ${result.schoolWebsite}` : ""}
        </div>
      </div>

      {/* Right column — empty for symmetry */}
      <div />
    </div>
  );
}

// ── Exam title block ─────────────────────────────────────────────────────────
function ExamTitle({ examName }: { examName?: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "5px 0 3px",
        // borderBottom: "1px solid #4a7aa8",
        marginBottom: "8px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 800,
          color: "#1f5e9d",
          letterSpacing: "3px",
          textTransform: "uppercase",
        }}
      >
        {examName || "FINAL EXAMINATION"}
      </div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: 900,
          color: "#1f5e9d",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginTop: "8px",
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
    const root = document.querySelector<HTMLElement>(".grade-sheet-root");
    if (!root) {
      console.warn("[GradeSheet] .grade-sheet-root not found in DOM");
      return;
    }

    // Collect all stylesheets and inline styles from the current document
    const styleNodes = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((el) => el.outerHTML)
      .join("\n");

    const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Grade Sheet - Print</title>
  ${styleNodes}
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: white;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print { display: none !important; }
    .grade-sheet-root {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      box-shadow: none !important;
    }
    @media print {
      @page { size: A4 portrait; margin: 0; }
      html, body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
      .grade-sheet-root { box-shadow: none !important; }
    }
  </style>
</head>
<body>
  ${root.outerHTML}
</body>
</html>`;

    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=1200,menubar=no,toolbar=no,location=no,status=no",
    );
    if (!printWindow) {
      // Popup blocked — fallback: use iframe approach
      let iframe = document.getElementById(
        "grade-sheet-print-iframe",
      ) as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "grade-sheet-print-iframe";
        Object.assign(iframe.style, {
          position: "fixed",
          right: "0",
          bottom: "0",
          width: "1px",
          height: "1px",
          border: "none",
        });
        document.body.appendChild(iframe);
      }
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) return;
      iframeDoc.open();
      iframeDoc.write(printHTML);
      iframeDoc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 500);
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Wait for images/fonts to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Auto-close after print dialog is dismissed
      printWindow.onafterprint = () => printWindow.close();
    };

    // Safety net: if onload doesn't fire (some browsers)
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }
    }, 1000);
  };

  return (
    <>
      {/* ── Print styles (injected once in the page) ── */}
      <style>{`
        /* Minimal screen overrides */
        @media print {
          .no-print { display: none !important; }
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
              fontSize: "14px",
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
        {/* <BackgroundPattern schoolName={result.schoolName} /> */}

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

                margin: "3px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "10px 14px",
              }}
            >
              {/* School header */}
              <SchoolHeader result={result} />

              {/* "FINAL EXAMINATION / GRADE SHEET" */}
              <ExamTitle examName={result.examName} />

              {/* Student info sentence */}
              <StudentInfo
                studentName={result.studentName}
                rollNo={result.rollNo}
                grade={result.grade}
                nepaliYear={result.nepaliYear}
                englishYear={result.englishYear}
                dateOfBirth={result.dateOfBirth}
                dateOfBirthAD={result.dateOfBirthAD}
                examName={result.examName}
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
