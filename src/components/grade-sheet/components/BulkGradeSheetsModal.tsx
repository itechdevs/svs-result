"use client";

// ─────────────────────────────────────────────
//  BulkGradeSheetsModal — Print multiple grade sheets
//  Opens a dedicated print window to avoid modal clipping issues.
// ─────────────────────────────────────────────

import React from "react";
import { StudentResult } from "../types";
import GradeSheet from "./GradeSheet";

interface BulkGradeSheetsModalProps {
  students: StudentResult[];
  onClose: () => void;
}

export default function BulkGradeSheetsModal({
  students,
  onClose,
}: BulkGradeSheetsModalProps) {
  const handlePrintAll = () => {
    // Collect all rendered .grade-sheet-root elements from the DOM
    const sheetElements = document.querySelectorAll(".grade-sheet-root");
    if (!sheetElements.length) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Copy all stylesheets from the current page
    const styleSheets = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((r) => r.cssText).join("");
        } catch {
          return "";
        }
      })
      .join("");

    const baseUrl =
      document.querySelector("base")?.href || window.location.href;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <base href="${baseUrl}">
        <title>Grade Sheets</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          @media print {
            body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .grade-sheet-root { page-break-after: always; break-after: page; }
            .grade-sheet-root:last-child { page-break-after: auto !important; break-after: auto !important; }
          }
          body { background: #f0f0f0; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
          ${styleSheets}
        </style>
      </head>
      <body>
        ${Array.from(sheetElements)
          .map((s) => s.outerHTML)
          .join("")}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (!students.length) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            background: "white",
            width: "100%",
            maxWidth: "880px",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
          }}
        >
          {/* Modal header */}
          <div
            className="no-print"
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                fontFamily: "Arial, sans-serif",
              }}
            >
              Bulk Grade Sheets — {students.length} student
              {students.length !== 1 ? "s" : ""}
            </span>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={handlePrintAll}
                style={{
                  padding: "6px 18px",
                  background: "#1f5e9d",
                  color: "white",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Arial, sans-serif",
                  letterSpacing: "0.3px",
                }}
              >
                Print All
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: "6px 12px",
                  background: "transparent",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Scrollable sheets area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "32px",
              background: "#e8edf2",
            }}
          >
            {students.map((student, idx) => (
              <div
                key={student.rollNo + idx}
                style={{
                  marginBottom: idx < students.length - 1 ? "32px" : 0,
                }}
              >
                <GradeSheet result={student} showPrintButton={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
