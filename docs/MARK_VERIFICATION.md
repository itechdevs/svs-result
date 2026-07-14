# Mark Verification Feature

## Overview
This feature allows administrators to review and verify secondary component marks submitted by teachers before compiling term results.

## Why is this needed?
The term result compilation requires all component marks to be in "VERIFIED" status. If any marks are in "DRAFT" or "SUBMITTED" status, the compilation will fail with a warning message.

## How to Access
1. Log in as an administrator
2. Navigate to **Exam Plan > Mark Verification** from the sidebar
3. Select filters:
   - Academic Year
   - Grade Level
   - Exam
   - Status Filter (All/Draft/Submitted/Verified)

## Features

### 1. Dashboard Overview
- View total marks count
- See marks by status (Draft, Submitted, Verified)
- Quick stats at a glance

### 2. Filter Marks
- Filter by academic year, grade, and exam
- Filter by verification status
- View marks that need attention

### 3. Individual Verification
- Review each mark entry with full details:
  - Student name, roll number, section
  - Subject and component type
  - Marks obtained or absent status
  - Teacher who entered the marks
- Verify marks one by one

### 4. Bulk Verification
- When multiple marks are in "SUBMITTED" status
- Bulk action button appears
- Verify all submitted marks at once
- Useful for efficient processing

## Workflow

### Teacher Side
1. Teachers enter marks (status: DRAFT)
2. Teachers submit marks for verification (status: SUBMITTED)

### Admin Side
1. Admin reviews submitted marks in the verification dashboard
2. Admin verifies marks individually or in bulk (status: VERIFIED)
3. Once all marks are verified, admin can compile term results

## Status Types
- **DRAFT**: Mark is entered but not submitted by teacher
- **SUBMITTED**: Mark is submitted and waiting for admin verification
- **VERIFIED**: Mark is verified by admin and ready for compilation

## Bulk Verification Script
For emergency situations or bulk operations, there's a script available:

```bash
npm run verify:marks
```

This script:
- Finds all unverified marks in the database
- Shows details of each mark
- Bulk verifies all marks using an admin user
- Useful for initial setup or data migration

## Before Compilation Checklist
Before compiling term results, ensure:
1. ✅ All teachers have submitted their marks
2. ✅ All marks are verified (no DRAFT or SUBMITTED status)
3. ✅ Check the verification dashboard for any pending marks
4. ✅ Run the compilation from Compile Engine

## Troubleshooting

### Compilation shows "X unverified marks" error
**Solution**: 
1. Go to Mark Verification dashboard
2. Filter by the exam that's failing
3. Filter by "Submitted Only" status
4. Verify all submitted marks
5. Try compilation again

### Some marks are stuck in DRAFT status
**Cause**: Teachers haven't submitted the marks yet
**Solution**: Contact the teacher to submit their marks

### Need to verify all marks quickly
**Solution**: Use the bulk verification button or run `npm run verify:marks` script

## API Endpoints

### Get Marks for Verification
```
GET /api/admin/secondary/marks?examId={examId}&status={status}
```

### Verify Single Mark
```
POST /api/admin/secondary/marks/{markId}/verify
Body: { remarks?: string }
```

## Files Created
- `src/app/(admin)/admin/secondary/mark-verification/page.tsx` - Main UI
- `src/app/api/admin/secondary/marks/route.ts` - API to fetch marks
- `src/app/api/admin/secondary/marks/[id]/verify/route.ts` - Verification API (already existed)
- `scripts/verify-all-marks.ts` - Bulk verification script
- `src/components/ui/badge.tsx` - Badge component for status display
