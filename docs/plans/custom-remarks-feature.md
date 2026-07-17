# Plan: Custom Teacher Remarks for Pre-Primary Grade Sheet

## Summary

Add a feature for class teachers to write a free-text **custom remark** per student per exam for pre-primary classes. The remark is stored in the database, entered via a new teacher page, and rendered on the pre-primary grade sheet PDF **after the observations section**.

---

## Architecture Overview

```
Teacher enters text per student per exam → Admin compiles grade sheet, fetches remarks + observations → Grade sheet PDF renders remark after observation section
```

---

## Files to Create

### 1. Database — Prisma Model

Add to `prisma/schema.prisma` after `StudentObservationResult`:

```prisma
model StudentCustomRemark {
  id              String   @id @default(cuid())
  syncedStudentId String
  examId          String
  enteredById     String
  remark          String   @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  syncedStudent SyncedStudent @relation(fields: [syncedStudentId], references: [id], onDelete: Cascade)
  exam          Exam          @relation(fields: [examId], references: [id], onDelete: Cascade)
  enteredBy     User          @relation(fields: [enteredById], references: [id])

  @@unique([syncedStudentId, examId])
  @@index([examId])
  @@map("student_custom_remarks")
}
```

Run migration: `npx prisma migrate dev --name add_student_custom_remarks`

### 2. API Routes

#### 2a. Teacher — `src/app/api/teacher/custom-remarks/route.ts`
- **GET** `?examId=` → Returns `{ remarks: Record<syncedStudentId, { id, remark }> }`
- **POST** `{ examId, remarks: [{ syncedStudentId, remark }] }` → Batch upsert via `$transaction` (delete stale + upsert)
- Zod: `remark: z.string().max(2000)`
- Role: `TEACHER`, guards on `classTeacherId`

#### 2b. Admin — `src/app/api/admin/custom-remarks/route.ts`
- **GET** `?examId=&class=` → Returns `{ remarks: Record<syncedStudentId, string> }`
- Role: `ADMIN`

### 3. Teacher Page — `src/app/(teacher)/teacher/custom-remarks/page.tsx`

Dynamic import, no SSR (same pattern as observations page).

### 4. Teacher Client Component — `src/components/teacher/TeacherCustomRemarksClient.tsx`

Follows `TeacherObservationEntryClient.tsx` pattern:
- `useProfile()` → guard on `classTeacherId`
- Query classroom students from `/teacher/observations/classroom`
- `useExams({ gradeLevel, isActive })` → exam dropdown
- Fetch existing remarks on exam change via `GET /teacher/custom-remarks`
- `remarksMap: Record<studentId, string>` local state with change detection
- Table: [Roll No, Student Name, Remark textarea]
- Save button → `POST /teacher/custom-remarks`
- Character counter per remark (max 2000)

### 5. Route Constant — `src/constants/index.ts`

Add `TEACHER_CUSTOM_REMARKS: "/teacher/custom-remarks"` to ROUTES.

---

## Files to Modify

### 6. Teacher Sidebar — `src/components/teacher/TeacherSidebar.tsx`

Add "Remarks" link after the "Observations" link, same conditional block (`showObservations && isClassTeacher`), using `PenLine` icon.

### 7. Admin Compilation — `src/components/admin/ExamResultCompilation.tsx`

- Add `customRemarksMap` state and `loadCustomRemarks()` fetch function (same trigger pattern as `loadObservations`)
- Thread `customRemarksMap[result.studentId]` into `toPrePrimaryData()` return

### 8. Pre-Primary Grade Sheet Interfaces

**`PrePrimaryStudentData`** in `PrePrimaryTranscriptModal.tsx`: Add `customRemark?: string | null`

**`PrePrimaryGradeSheetData`** in `pre-primarygrade.tsx`: Add `customRemark: string | null`

**`buildPrePrimaryData()`** in `pre-primarygrade.tsx`: Accept and pass through `customRemark` param

### 9. Grade Sheet PDF — `src/components/shared/pre-primarygrade-components.tsx`

Add `CustomRemarkSection` component that renders after `ObservationSection`:
- Only renders if `data.customRemark` is truthy
- Displays "Class Teacher's Remarks" header + remark text in a bordered box

### 10. Bulk Modal — `src/components/shared/PrePrimaryBulkGradeSheetsModal.tsx`

Pass `student.customRemark` through to `buildPrePrimaryData()`.

---

## Implementation Order

1. Prisma schema + migration
2. Constants + route
3. Teacher API route
4. Admin API route
5. Teacher page + component
6. Teacher sidebar link
7. Admin compilation — fetch + thread
8. Grade sheet interfaces + data flow
9. Grade sheet PDF rendering
