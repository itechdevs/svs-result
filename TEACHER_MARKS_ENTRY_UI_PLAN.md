# Teacher-Side Marks Entry UI - Implementation Plan

## Overview
Build a comprehensive marks entry system for teachers to enter marks for both **Primary (Grades 1-5)** and **Secondary (Grades 6-12)** students with support for different evaluation types and components.

---

## System Architecture

### 1. Two Distinct Mark Entry Systems

#### A. **Primary System (Grades 1-5)** - Already Exists ✅
- **Location**: `/teacher/mark-entry`
- **Component**: `MarkEntryOverviewTable.tsx`
- **Features**:
  - Evaluation-based mark entry
  - Outcome-based assessments
  - Simple marks entry (no components)
  - Status tracking (DRAFT, SUBMITTED, VERIFIED, LOCKED)

#### B. **Secondary System (Grades 6-12)** - To Build 🔨
- **Location**: `/teacher/secondary/mark-entry`
- **Features Needed**:
  - Component-based entry (INTERNAL, THEORY, PRACTICAL)
  - Practical sub-heading marks entry with auto-sum
  - Credit hour based system (CDC/NEB standard)
  - Per-component submission workflow

---

## Phase 1: Data Structure & API Understanding ✅

### Database Schema (Already Exists)
```
SecondarySubjectConfig
  ├─ SecondarySubjectComponent (INTERNAL, THEORY, PRACTICAL)
      ├─ SecondaryPracticalHeading (for PRACTICAL only)
      │   └─ SecondaryPracticalHeadingMark (student marks per heading)
      └─ SecondaryComponentMark (for INTERNAL & THEORY direct entry)
```

### API Endpoints (Already Exist)
- `POST /api/teacher/secondary/marks` - Bulk save INTERNAL/THEORY marks
- `POST /api/teacher/secondary/marks/[id]/submit` - Submit for verification
- `POST /api/teacher/secondary/practical-marks` - Save PRACTICAL sub-heading marks
- Admin verification: `POST /api/admin/secondary/marks/[id]/verify`

---

## Phase 2: UI Component Structure

### Main Page Structure
```
/teacher/secondary/mark-entry/
│
├─ Filter Panel (Top)
│   ├─ Academic Year Selector
│   ├─ Grade Level Dropdown (dynamic secondary grades)
│   ├─ Subject Dropdown (teacher's assigned subjects)
│   └─ Exam/Term Selector
│
├─ Component Type Tabs
│   ├─ INTERNAL Tab
│   ├─ THEORY Tab
│   └─ PRACTICAL Tab (with sub-headings)
│
└─ Marks Entry Table
    ├─ Student List (roll number, name, section)
    ├─ Marks Input Cells
    ├─ Absent Checkbox
    ├─ Status Indicators
    └─ Bulk Actions (Save All, Submit All)
```

---

## Phase 3: Component Breakdown

### 3.1 Main Page Component
**File**: `src/app/(app)/teacher/secondary/mark-entry/page.tsx`

**Responsibilities**:
- Handle filter state management
- Fetch subject configs and components
- Render component tabs
- Coordinate between filter and table

**State Management**:
```typescript
- selectedYear: string
- selectedGrade: string
- selectedSubject: string (from teacher's assigned subjects)
- selectedExam: string (term exam)
- activeComponentTab: "INTERNAL" | "THEORY" | "PRACTICAL"
```

### 3.2 Filter Panel Component
**File**: `src/components/teacher/secondary/SecondaryMarkEntryFilters.tsx`

**Features**:
- Academic year dropdown
- Dynamic secondary grade levels
- Teacher's assigned subjects only
- Exam selector (filtered by year + grade)
- Validation: Ensure all filters selected before showing table

### 3.3 Component Tabs
**File**: `src/components/teacher/secondary/ComponentTabs.tsx`

**Features**:
- Visual tabs for INTERNAL, THEORY, PRACTICAL
- Badge showing marks entry status for each component
- Display component full marks and pass marks
- Disable tab if component not configured

### 3.4 Marks Entry Table - INTERNAL & THEORY
**File**: `src/components/teacher/secondary/DirectMarksEntryTable.tsx`

**Features**:
- Student list with roll number, name
- Single marks input column (marksObtained)
- Absent checkbox per student
- Real-time validation (marks ≤ fullMarks)
- Auto-save on blur or debounced
- Status indicator per row (DRAFT, SUBMITTED, VERIFIED)
- Bulk actions:
  - Save All (DRAFT status)
  - Submit All (SUBMITTED status)
- Visual feedback:
  - Green border for saved
  - Yellow for unsaved changes
  - Red for validation errors

**Input Behavior**:
```typescript
- Input type: number, step: 0.01
- Max value: component.fullMarks
- Validation: 0 ≤ marks ≤ fullMarks
- Absent checkbox: if checked, marks = null
- Auto-calculate pass/fail indicator (marks >= passMarks)
```

### 3.5 Marks Entry Table - PRACTICAL (Complex)
**File**: `src/components/teacher/secondary/PracticalMarksEntryTable.tsx`

**Features**:
- Multi-column table with sub-headings
- Each practical heading gets its own column
- Auto-sum column showing total practical marks
- Individual heading mark inputs with validation
- Same status tracking as direct entry
- Visual total validation (sum must not exceed fullMarks)

**Table Structure**:
```
| Roll | Name | Absent | Experiment (30) | Viva (10) | Record (10) | Total | Status | Actions |
|------|------|--------|----------------|-----------|-------------|-------|--------|---------|
| 1    | John | [ ]    | 28.5           | 9         | 10          | 47.5  | ✓ DRAFT| Submit  |
```

**Validation Logic**:
```typescript
- Each heading mark ≤ heading.fullMarks
- Sum of all headings ≤ component.fullMarks
- If absent: all heading marks = null, total = null
- Visual indicator if total exceeds fullMarks (red warning)
```

### 3.6 Student Row Component
**File**: `src/components/teacher/secondary/StudentMarkRow.tsx`

**Responsibilities**:
- Render single student row
- Handle individual mark input
- Show validation errors
- Status badge
- Quick actions (Save, Submit)

### 3.7 Status Badge Component
**File**: `src/components/teacher/secondary/MarkStatusBadge.tsx`

**Status Colors**:
- `DRAFT` - Yellow (⚠️ Draft)
- `SUBMITTED` - Blue (📤 Submitted)
- `VERIFIED` - Green (✅ Verified)
- `LOCKED` - Gray (🔒 Locked)

---

## Phase 4: Custom Hooks

### 4.1 useSecondaryMarkEntry Hook
**File**: `src/hooks/use-secondary-mark-entry.ts`

**Purpose**: Centralized state and logic for marks entry

```typescript
export function useSecondaryMarkEntry(componentId: string, examId: string) {
  // Fetch existing marks from DB
  const { data: marks, refetch } = useQuery(...)
  
  // Local state for unsaved changes
  const [localMarks, setLocalMarks] = useState({})
  
  // Mutation for saving marks
  const saveMutation = useMutation(...)
  
  // Mutation for submitting marks
  const submitMutation = useMutation(...)
  
  // Helper functions
  const updateMark = (studentId, value) => { ... }
  const saveAll = async () => { ... }
  const submitAll = async () => { ... }
  
  return {
    marks: localMarks,
    updateMark,
    saveAll,
    submitAll,
    isSaving,
    hasUnsavedChanges,
    validationErrors
  }
}
```

### 4.2 useTeacherSubjects Hook
**File**: `src/hooks/use-teacher-subjects.ts`

**Purpose**: Fetch teacher's assigned subjects with grade levels

```typescript
export function useTeacherSubjects(gradeLevel?: string) {
  // Fetch from profile.syncedTeacher.subjects
  // Filter by gradeLevel if provided
  // Return only active subjects
}
```

### 4.3 useSecondaryComponents Hook
**File**: `src/hooks/use-secondary-components.ts`

**Purpose**: Fetch subject config and components

```typescript
export function useSecondaryComponents(
  syncedSubjectId: string,
  academicYearId: string,
  gradeLevel: string
) {
  // Fetch SecondarySubjectConfig
  // Include components and practical headings
  // Return structured data
}
```

---

## Phase 5: Validation & Error Handling

### Client-Side Validation
1. **Marks Range**: `0 ≤ marks ≤ fullMarks`
2. **Decimal Places**: Max 2 decimal places
3. **Required Fields**: All filters must be selected
4. **Practical Sum**: Total heading marks ≤ component fullMarks
5. **Absent Logic**: If absent, marks must be null

### Error Messages
```typescript
const ERROR_MESSAGES = {
  MARKS_EXCEED: "Marks cannot exceed {fullMarks}",
  INVALID_DECIMAL: "Maximum 2 decimal places allowed",
  NEGATIVE_MARKS: "Marks cannot be negative",
  PRACTICAL_SUM_EXCEED: "Total practical marks exceed component full marks",
  NO_COMPONENT_CONFIG: "Subject component not configured. Contact admin.",
  ALREADY_LOCKED: "Marks are locked and cannot be edited",
}
```

### Server-Side Validation
- Already handled in API routes
- Additional checks in submit endpoint
- Verify all students have marks before submission

---

## Phase 6: UI/UX Features

### 6.1 Auto-Save Mechanism
- Debounce input changes (500ms)
- Auto-save to DRAFT status
- Visual indicator: "Saving..." → "Saved ✓"
- Conflict resolution if another teacher editing same data

### 6.2 Keyboard Navigation
- Tab key to move between input cells
- Enter key to save current cell and move to next
- Arrow keys for grid navigation
- Esc key to cancel unsaved changes

### 6.3 Bulk Operations
- **Select All** checkbox
- **Bulk Absent**: Mark multiple students as absent
- **Copy Down**: Copy first cell value to all selected
- **Clear All**: Clear all unsaved marks

### 6.4 Visual Feedback
- **Unsaved Changes**: Yellow highlight on modified cells
- **Validation Error**: Red border + error tooltip
- **Success**: Green flash animation on save
- **Loading**: Skeleton loaders while fetching
- **Empty State**: Helpful message with instructions

### 6.5 Progress Tracking
Display statistics at top:
```
📊 Progress: 35/45 students entered | 10 absent | 0 errors
```

### 6.6 Mobile Responsiveness
- Stack filters vertically on mobile
- Horizontal scroll for table on small screens
- Larger touch targets for input fields
- Collapsible sidebar for filters

---

## Phase 7: Security & Permissions

### Teacher Restrictions
- Can only see their assigned subjects
- Cannot edit VERIFIED or LOCKED marks
- Cannot verify their own submissions (admin only)

### Admin Capabilities (Future)
- View all teachers' mark entry
- Bulk verification
- Override locked marks (with audit trail)

---

## Phase 8: Testing Checklist

### Unit Tests
- [ ] Validation functions
- [ ] Mark calculation logic
- [ ] Auto-sum for practical headings
- [ ] Status transitions

### Integration Tests
- [ ] API calls for saving marks
- [ ] API calls for submitting marks
- [ ] Fetch marks and display correctly
- [ ] Handle concurrent edits

### E2E Tests
- [ ] Complete mark entry flow (filter → enter → save → submit)
- [ ] Practical marks with sub-headings
- [ ] Absent student handling
- [ ] Validation error scenarios
- [ ] Status progression

---

## Phase 9: Implementation Steps

### Step 1: Setup (Week 1)
1. Create directory structure for secondary components
2. Set up custom hooks
3. Define TypeScript types and interfaces
4. Create reusable sub-components (badges, status indicators)

### Step 2: Filter Panel (Week 1)
1. Build `SecondaryMarkEntryFilters.tsx`
2. Integrate with existing hooks (useAcademicYears, useGradeLevels)
3. Add teacher subject filtering
4. Implement exam selector

### Step 3: Component Tabs (Week 1-2)
1. Build tab navigation component
2. Fetch and display components from config
3. Show component details (full marks, pass marks)
4. Handle tab switching state

### Step 4: Direct Marks Entry (Week 2)
1. Build `DirectMarksEntryTable.tsx` for INTERNAL/THEORY
2. Implement mark input with validation
3. Add absent checkbox logic
4. Integrate with `useSecondaryMarkEntry` hook
5. Implement auto-save functionality
6. Add bulk save/submit actions

### Step 5: Practical Marks Entry (Week 3)
1. Build `PracticalMarksEntryTable.tsx`
2. Dynamic columns based on practical headings
3. Implement auto-sum calculation
4. Add validation for sub-headings
5. Handle absent logic for all headings
6. Test with various practical configurations

### Step 6: Status & Workflow (Week 3)
1. Implement status badges
2. Add submit confirmation dialog
3. Handle locked marks (read-only mode)
4. Show verification status
5. Admin verification UI (if needed)

### Step 7: Polish & Optimization (Week 4)
1. Add keyboard navigation
2. Implement bulk operations
3. Add progress tracking
4. Mobile responsiveness
5. Loading states and skeletons
6. Error boundary and fallback UI

### Step 8: Testing & Deployment (Week 4)
1. Write unit tests
2. Manual testing across scenarios
3. Performance optimization (virtualization for large lists)
4. Documentation and user guide
5. Deploy to staging
6. User acceptance testing

---

## Phase 10: Future Enhancements

### V2 Features
- **Import/Export**: Excel import/export for marks
- **Bulk Upload**: CSV upload with validation
- **Analytics Dashboard**: Teacher performance metrics
- **Historical View**: View past term marks
- **Comparison View**: Side-by-side term comparison
- **Print View**: Printable mark sheets
- **Notifications**: Alert when marks need submission
- **Collaboration**: Comments/notes on student marks
- **Audit Trail**: Track who changed what and when

---

## Technical Considerations

### Performance
- Use **React Query** for caching and background refetching
- Implement **virtualization** for 100+ student lists (react-window)
- **Debounce** input changes to reduce API calls
- **Optimistic updates** for better UX

### Accessibility
- Proper ARIA labels for screen readers
- Keyboard-only navigation support
- High contrast mode support
- Focus management for dialogs

### Data Integrity
- Client-side validation before API calls
- Server-side validation as final gatekeeper
- Transaction-based updates in database
- Conflict resolution for concurrent edits

---

## File Structure

```
src/
├── app/
│   └── (app)/teacher/secondary/
│       └── mark-entry/
│           └── page.tsx                           # Main page
│
├── components/teacher/secondary/
│   ├── SecondaryMarkEntryFilters.tsx              # Filter panel
│   ├── ComponentTabs.tsx                          # Tab navigation
│   ├── DirectMarksEntryTable.tsx                  # INTERNAL/THEORY table
│   ├── PracticalMarksEntryTable.tsx               # PRACTICAL table
│   ├── StudentMarkRow.tsx                         # Individual row
│   ├── MarkStatusBadge.tsx                        # Status indicator
│   ├── BulkActionsBar.tsx                         # Bulk operations
│   ├── ProgressStats.tsx                          # Progress display
│   └── MarkEntryEmptyState.tsx                    # Empty state UI
│
├── hooks/
│   ├── use-secondary-mark-entry.ts                # Main marks hook
│   ├── use-teacher-subjects.ts                    # Teacher subjects
│   ├── use-secondary-components.ts                # Subject components
│   └── use-secondary-practical-headings.ts        # Practical headings
│
├── lib/
│   ├── validations/
│   │   └── secondary-marks-validation.ts          # Validation functions
│   └── utils/
│       └── marks-calculations.ts                  # Calculation helpers
│
└── types/
    └── secondary-marks.ts                         # TypeScript types
```

---

## Success Metrics

### User Experience
- ✅ Teacher can enter marks for 50 students in under 5 minutes
- ✅ Zero data loss with auto-save
- ✅ < 200ms response time for save operations
- ✅ 100% keyboard accessible

### Data Quality
- ✅ 0% invalid marks due to client validation
- ✅ All marks within configured ranges
- ✅ Practical sub-headings always sum correctly

### Adoption
- ✅ 90%+ of teachers use the system within first month
- ✅ < 5% support tickets related to marks entry
- ✅ Positive feedback from user interviews

---

## Summary

This plan provides a comprehensive roadmap for building a robust, user-friendly teacher marks entry system for secondary grades. The phased approach ensures:

1. **Clarity**: Clear understanding of requirements and structure
2. **Modularity**: Reusable components and hooks
3. **Scalability**: Can handle large student lists efficiently
4. **Maintainability**: Well-organized code with proper separation of concerns
5. **Quality**: Built-in validation, error handling, and testing

**Estimated Timeline**: 4 weeks for core features + 2 weeks for testing and polish = **6 weeks total**

**Priority**: High - Critical for secondary grade result management

---

*Last Updated: 2026-07-05*
*Author: Kiro AI Assistant*
