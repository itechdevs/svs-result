# Result Compilation Flow (Exam-Based)

## Overview
Admin creates **Exams** (e.g., "First Term Exam 2024") to compile and store final results for a class.

---

## Complete Workflow

### 1. Teacher Creates Evaluations (Per Subject)
**Example: Science - Class 1**
- Teacher creates 4 evaluation tests for Science
- Each evaluation has pass criteria
- Each has learning outcomes with marks

**Who:** Teachers  
**API:** Regular evaluation creation

---

### 2. Teacher Enters Marks
- Teachers enter marks for each evaluation
- System flags failed students

**Who:** Teachers  
**API:** Marks entry endpoints

---

### 3. Re-Exam (If Needed)
- Admin schedules re-exam for failed evaluations
- Teachers enter re-exam marks

**Who:** Admin + Teachers  
**API:** Re-exam scheduling

---

### 4. Admin Creates Exam
**Admin creates an Exam record** for result compilation:
```json
{
  "name": "First Term Exam 2024",
  "classId": "class-1-id",
  "examDate": "2024-12-15",
  "status": "DRAFT"
}
```

**Who:** Admin  
**API:** `POST /api/admin/exams`

---

### 5. Admin Triggers Result Compilation
Admin triggers compilation **into the Exam**:

**Step A: Compile Subject Results**
- System compiles each subject (Science, Math, Social Studies)
- Includes best marks from re-exams
- Creates SubjectResult records

**Step B: Compile Final Results**
- System aggregates all subject results
- Creates FinalResult records **linked to the Exam**
- Calculates:
  - Total marks across all subjects
  - Overall percentage
  - CGPA
  - Grade
  - Class rank
  - Result status (PROMOTED/FAILED/PROBATION)

**Who:** Admin triggers  
**API:** `POST /api/admin/exams/{examId}/compile`

---

### 6. Admin Reviews Results
- Admin reviews compiled results
- Can regenerate if needed (e.g., after re-exams)
- Exam status: DRAFT

---

### 7. Admin Publishes Exam
- Admin publishes the exam
- Exam status: PUBLISHED
- Students/parents can now view results

**Who:** Admin  
**API:** `POST /api/admin/exams/{examId}/publish`

---

## Data Structure

```
Exam ("First Term Exam 2024" - Class 1)
  ├─> FinalResult (Student A)
  │     ├─ Science: 175/200 (87.5%)
  │     ├─ Math: 162/200 (81%)
  │     └─ Social: 155/200 (77.5%)
  │     Total: 492/600 (82%) - Grade: A - PROMOTED
  │
  ├─> FinalResult (Student B)
  │     └─ ...
  │
  └─> FinalResult (Student C)
        └─ ...
```

---

## Key Points

✅ **One Exam = One Result Compilation**  
✅ **Exam stores all final results for a class**  
✅ **Admin controls when to compile**  
✅ **Admin controls when to publish**  
✅ **Can have multiple exams per year** (Mid-term, Final, etc.)

---

## API Endpoints

### 1. Create Exam
`POST /api/admin/exams`
```json
{ "name": "First Term 2024", "classId": "...", "examDate": "2024-12-15" }
```

### 2. Compile Results into Exam
`POST /api/admin/exams/{examId}/compile`
- Compiles all subjects
- Generates final results
- Stores in exam

### 3. Publish Exam
`POST /api/admin/exams/{examId}/publish`
- Changes status to PUBLISHED
- Makes results visible

### 4. Get Exam Results
`GET /api/admin/exams/{examId}/results`
- Returns all final results for the exam
