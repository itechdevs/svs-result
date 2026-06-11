# Data Sync API Format

## Overview
Updated sync service to support direct teacher-subject association model.

## Sync Order
1. **Teachers** (must be synced first)
2. **Subjects** (references teachers)
3. **Students**

## Expected Data Formats

### Teacher Sync (`/api/sync/teachers`)

```json
{
  "id": "teacher-source-id",
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "hashed-password"
  },
  "subjectIds": ["subject-source-id-1", "subject-source-id-2"]
}
```

**Fields:**
- `id` (required): Source ID from school management system
- `user.name` (required): Teacher's full name
- `user.email` (optional): Email for login account creation
- `user.password` (optional): Hashed password for login
- `subjectIds` (optional): Array of subject source IDs assigned to this teacher

**Logic:**
- Creates/updates `SyncedTeacher` record
- Creates/updates `User` account if email/password provided
- Assigns teacher to subjects by:
  - Finding synced subjects matching `subjectIds`
  - Setting `teacherId` on those subjects
  - Clearing `teacherId` on subjects no longer assigned

### Subject Sync (`/api/sync/subjects`)

```json
{
  "id": "subject-source-id",
  "name": "Mathematics",
  "code": "MATH",
  "gradeLevel": "Grade 1",
  "teacherId": "teacher-source-id"
}
```

**Fields:**
- `id` (required): Source ID from school management system
- `name` (required): Subject name
- `code` (optional): Subject code (auto-generated from name if missing)
- `gradeLevel` (optional): Grade level (defaults to "General")
- `teacherId` (optional): Teacher source ID from school management system

**Logic:**
- Finds `SyncedTeacher` by `sourceId` matching `teacherId`
- Creates/updates `SyncedSubject` with internal `teacherId` reference

### Student Sync (`/api/sync/students`)

```json
{
  "id": "student-source-id",
  "name": "Jane Smith",
  "rollNumber": "001",
  "grade": "Grade 1",
  "section": "A"
}
```

**Fields:**
- `id` (required): Source ID from school management system
- `name` (required): Student's full name
- `rollNumber` (optional): Roll number (defaults to empty string)
- `grade` (required): Grade level
- `section` (optional): Section (defaults to "A")

## Teacher Dashboard Access

Teachers can now access their subjects via:

```typescript
const subjects = await prisma.syncedSubject.findMany({
  where: {
    teacherId: user.syncedTeacherId,
    isActive: true
  },
  include: {
    evaluationTemplates: true
  }
});
```

## Migration Notes

- **TeacherAssignment table removed** - no longer used
- Teacher-subject relationship is now direct via `SyncedSubject.teacherId`
- Sync service handles both approaches:
  - Teacher-centric: Send `subjectIds` array in teacher data
  - Subject-centric: Send `teacherId` field in subject data
  - Both can be used simultaneously for validation
