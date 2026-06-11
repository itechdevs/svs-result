import { prisma } from "@/lib/prisma";

interface SyncResult {
  entity: string;
  synced: number;
  failed: number;
  errors: string[];
}

export class UnifiedSyncService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.EXTERNAL_API_URL || "http://localhost:4000";
  }

  private async fetchData<T>(endpoint: string): Promise<T[]> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from ${endpoint}: ${response.statusText}`);
    }

    return response.json();
  }

  async syncTeachers(): Promise<SyncResult> {
    const result: SyncResult = { entity: "teacher", synced: 0, failed: 0, errors: [] };

    try {
      const teachers = await this.fetchData<any>("/api/sync/teachers");
      const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });

      for (const teacher of teachers) {
        try {
          // Upsert synced teacher
          const syncedTeacher = await prisma.syncedTeacher.upsert({
            where: { sourceId: teacher.id },
            update: { name: teacher.user.name, syncedAt: new Date() },
            create: { sourceId: teacher.id, name: teacher.user.name },
          });

          // Auto-create or update user account
          if (teacher.user.email && teacher.user.password) {
            const user = await prisma.user.upsert({
              where: { email: teacher.user.email },
              update: {
                name: teacher.user.name,
                passwordHash: teacher.user.password,
                syncedTeacherId: syncedTeacher.id,
              },
              create: {
                email: teacher.user.email,
                passwordHash: teacher.user.password,
                name: teacher.user.name,
                role: "TEACHER",
                syncedTeacherId: syncedTeacher.id,
                isActive: true,
                emailVerified: new Date(),
              },
            });

            // Create teacher assignments if subjects and classrooms exist
            if (currentYear && teacher.subjects?.length > 0) {
              for (const subject of teacher.subjects) {
                await prisma.teacherAssignment.upsert({
                  where: {
                    userId_gradeLevel_syncedSubjectId_academicYearId: {
                      userId: user.id,
                      gradeLevel: subject.gradeLevel,
                      syncedSubjectId: subject.id,
                      academicYearId: currentYear.id,
                    },
                  },
                  update: {},
                  create: {
                    userId: user.id,
                    gradeLevel: subject.gradeLevel,
                    syncedSubjectId: subject.id,
                    academicYearId: currentYear.id,
                    assignedBy: "system",
                  },
                });
              }
            }
          }

          await prisma.syncLog.create({
            data: {
              entity: "teacher",
              sourceId: teacher.id,
              action: "sync",
              payload: teacher,
              status: "success",
            },
          });

          result.synced++;
        } catch (error) {
          result.failed++;
          result.errors.push(`${teacher.id}: ${error instanceof Error ? error.message : "Unknown"}`);
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  }

  async syncStudents(): Promise<SyncResult> {
    const result: SyncResult = { entity: "student", synced: 0, failed: 0, errors: [] };

    try {
      const students = await this.fetchData<any>("/api/sync/students");

      for (const student of students) {
        try {
          await prisma.syncedStudent.upsert({
            where: { sourceId: student.id },
            update: {
              name: student.name,
              rollNumber: student.rollNumber || "",
              grade: student.grade,
              section: student.section || "A",
              syncedAt: new Date(),
            },
            create: {
              sourceId: student.id,
              name: student.name,
              rollNumber: student.rollNumber || "",
              grade: student.grade,
              section: student.section || "A",
            },
          });

          await prisma.syncLog.create({
            data: {
              entity: "student",
              sourceId: student.id,
              action: "sync",
              payload: student,
              status: "success",
            },
          });

          result.synced++;
        } catch (error) {
          result.failed++;
          result.errors.push(`${student.id}: ${error instanceof Error ? error.message : "Unknown"}`);
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  }

  async syncSubjects(): Promise<SyncResult> {
    const result: SyncResult = { entity: "subject", synced: 0, failed: 0, errors: [] };

    try {
      const subjects = await this.fetchData<any>("/api/sync/subjects");

      for (const subject of subjects) {
        try {
          await prisma.syncedSubject.upsert({
            where: { sourceId: subject.id },
            update: {
              name: subject.name,
              code: subject.code || subject.name.toUpperCase().substring(0, 6),
              gradeLevel: subject.gradeLevel || "General",
              syncedAt: new Date(),
            },
            create: {
              sourceId: subject.id,
              name: subject.name,
              code: subject.code || subject.name.toUpperCase().substring(0, 6),
              gradeLevel: subject.gradeLevel || "General",
            },
          });

          await prisma.syncLog.create({
            data: {
              entity: "subject",
              sourceId: subject.id,
              action: "sync",
              payload: subject,
              status: "success",
            },
          });

          result.synced++;
        } catch (error) {
          result.failed++;
          const errorMsg = error instanceof Error ? error.message : "Unknown";
          result.errors.push(`${subject.id}: ${errorMsg}`);
          
          await prisma.syncLog.create({
            data: {
              entity: "subject",
              sourceId: subject.id,
              action: "sync",
              payload: subject,
              status: "error",
              error: errorMsg,
            },
          }).catch(() => {});
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  }

  async syncAll() {
    const results = {
      teachers: await this.syncTeachers(),
      students: await this.syncStudents(),
      subjects: await this.syncSubjects(),
    };

    const totalSynced = results.teachers.synced + results.students.synced + results.subjects.synced;
    const totalFailed = results.teachers.failed + results.students.failed + results.subjects.failed;

    return {
      success: totalFailed === 0,
      totalSynced,
      totalFailed,
      details: results,
    };
  }
}
