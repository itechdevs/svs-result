# Admin UI Revamp: School-Level Exam Configuration

## Current State
- Admin sidebar "Exam Plan" has 4 sub-items, all secondary-specific
- Exam detail page (`/admin/exams/[id]`) shows `ExamResultCompilation` with manual "Include Observation" toggle for ALL exams
- No school-level awareness in admin compilation logic

## Target State  
- Exam detail page auto-detects school level and renders appropriate compilation UI
- Pre-primary → observation grade sheet mode auto-enabled  
- Primary → standard weighted compilation, no observation section
- Secondary → redirects/prompts to use secondary mark entry & compilation
- Sidebar shows school-level sub-items under Exam Plan

## Implementation

### 1. ExamDetailClient — School Level Detection
File: `src/components/admin/ExamDetailClient.tsx`
- Import `useGradeLevelCategories` and `categorizeGradeLevel`
- Build school level lookup from DB + fallback
- Pass `schoolLevel` to `ExamResultCompilation`

### 2. ExamResultCompilation — Level-Conditional UI
File: `src/components/admin/ExamResultCompilation.tsx`
- Accept `schoolLevel` prop
- PRE_PRIMARY: auto-enable observation mode (skip manual toggle)
- PRIMARY: show standard compilation, remove observation toggle  
- SECONDARY/HIGHER: show notice prompting secondary mark entry page

### 3. AdminSidebar — Restructure Exam Plan Children
File: `src/components/admin/AdminSidebar.tsx`
- "Exam Management" → `/admin/exams`
- "Secondary Setup" (expandable) → existing 4 sub-items
- "Observations" stays as top-level item
- "Grade Levels" stays as top-level item
