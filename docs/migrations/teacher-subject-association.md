# Teacher-Subject Direct Association Migration

## Date
2026-06-11

## Summary
Removed `TeacherAssignment` table and established direct association between teachers and subjects through a `teacherId` field on `SyncedSubject`.

## Changes

### Removed
- **TeacherAssignment** model (entire table dropped)
- Complex assignment logic with grade levels and academic years
- `teacherAssignments` relation from `User`, `AcademicYear` models

### Added
- **SyncedSubject.teacherId** field (nullable, references `SyncedTeacher.id`)
- Direct `teacher` relation on `SyncedSubject`
- `subjects` relation on `SyncedTeacher`
- Index on `SyncedSubject.teacherId`

## New Access Model

**Before:**
- Teachers were assigned to grade + subject + academic year combinations via `TeacherAssignment`
- A teacher could have multiple assignments across different grades/subjects
- Access was controlled by checking `TeacherAssignment` records

**After:**
- Each subject is directly assigned to one teacher via `SyncedSubject.teacherId`
- Teacher accesses subjects where `SyncedSubject.teacherId` matches their `User.syncedTeacherId`
- Simpler, more direct relationship

## Dashboard Access Logic

Teachers can now query their subjects with:
```typescript
const teacherSubjects = await prisma.syncedSubject.findMany({
  where: {
    teacherId: currentUser.syncedTeacherId,
    isActive: true
  },
  include: {
    evaluationTemplates: true
  }
});
```

## Migration SQL Applied
- Dropped `teacher_assignments` table
- Added `teacherId` column to `synced_subjects`
- Created foreign key constraint from `synced_subjects.teacherId` to `synced_teachers.id`
- Created index on `synced_subjects.teacherId`

## Next Steps
1. Restart dev server to clear Prisma client file locks
2. Run `npm run db:generate` or `npx prisma generate` 
3. Update teacher dashboard queries to use `SyncedSubject.teacherId`
4. Update admin UI to assign teachers directly to subjects
5. Remove any references to `TeacherAssignment` in application code
