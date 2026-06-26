# Grade Sheet — Component System

Production-ready printable A4 grade sheet for Sanskar Vidhyapith School.
Built for Next.js 15 + React + TypeScript. No external UI libraries required.

---

## File Structure

```
grade-sheet/
├── types.ts                        ← Shared interfaces + demo data
└── components/
    ├── GradeSheet.tsx              ← Root A4 page (compose everything here)
    ├── BackgroundPattern.tsx       ← Diagonal repeating school name text
    ├── Watermark.tsx               ← Large centred semi-transparent logo
    ├── StudentInfo.tsx             ← Certificate-style student fields
    ├── GradeTable.tsx              ← Subject table with merged TH/IN rows
    ├── GPASummary.tsx              ← Blue GPA + Rank strip
    ├── GradeLegend.tsx             ← Notes (left) + Grade intervals (right)
    ├── SignatureSection.tsx        ← Teacher / Principal / Date
    └── BulkGradeSheetsModal.tsx    ← Print-all modal for multiple students
```

---

## Quick Start

### Single sheet

```tsx
import GradeSheet from '@/components/grade-sheet/components/GradeSheet'
import { DEMO_STUDENT } from '@/components/grade-sheet/types'

export default function Page() {
  return <GradeSheet result={DEMO_STUDENT} showPrintButton />
}
```

### Bulk print modal

```tsx
'use client'
import { useState } from 'react'
import BulkGradeSheetsModal from '@/components/grade-sheet/components/BulkGradeSheetsModal'
import { StudentResult } from '@/components/grade-sheet/types'

export default function ClassPage() {
  const [open, setOpen] = useState(false)
  const students: StudentResult[] = [] // load from API

  return (
    <>
      <button onClick={() => setOpen(true)}>Print All Grade Sheets</button>
      {open && <BulkGradeSheetsModal students={students} onClose={() => setOpen(false)} />}
    </>
  )
}
```

---

## Props

### `StudentResult` (types.ts)

| Field          | Type       | Description                          |
|----------------|------------|--------------------------------------|
| schoolName     | string     | Full school name (uppercase)         |
| schoolAddress  | string     | Street / district                    |
| schoolPhone    | string     | Contact number                       |
| schoolEmail    | string     | Contact email                        |
| logo           | string     | Path or URL to logo image            |
| studentName    | string     | Full student name                    |
| rollNo         | string     | Roll / admission number              |
| grade          | string     | Class / grade label                  |
| nepaliYear     | string     | B.S. year (e.g. "2082")             |
| englishYear    | string     | A.D. year (e.g. "2026")             |
| issueDate      | string     | B.S. date of issue                   |
| issueDateAD    | string     | A.D. date of issue                   |
| gpa            | number     | Computed GPA                         |
| rank           | number     | Class rank                           |
| subjects       | Subject[]  | Array of subject results             |

### `Subject`

| Field               | Type   | Description                       |
|---------------------|--------|-----------------------------------|
| name                | string | Subject name (e.g. "ENGLISH")     |
| creditHourTheory    | number | Theory credit hours               |
| creditHourInternal  | number | Internal/practical credit hours   |
| gpTheory            | number | Theory grade point                |
| gradeTheory         | string | Theory grade letter               |
| gpInternal          | number | Internal grade point              |
| gradeInternal       | string | Internal grade letter             |
| finalGrade          | string | Combined final grade              |
| remarks             | string | Descriptive remark                |

---

## Print Support

The component injects `@media print` styles automatically.
Call `window.print()` or use the built-in Print button.

For bulk sheets, the modal adds `page-break-after: always` between sheets.

Colors, backgrounds, and borders all use:
```css
-webkit-print-color-adjust: exact;
print-color-adjust: exact;
```

---

## Colors

| Token          | Hex       | Usage                         |
|----------------|-----------|-------------------------------|
| Primary Blue   | `#1f5e9d` | Text, borders, headers        |
| Border Blue    | `#4a7aa8` | Table/box borders             |
| Light Blue     | `#dbeeff` | GPA strip, table header tints |
| Row Tint       | `#f8fbff` | Alternating table rows        |
| Merged Cell    | `#f0f6ff` | Final Grade / Remarks cells   |
