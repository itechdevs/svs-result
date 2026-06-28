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
      throw new Error(
        `Failed to fetch from ${endpoint}: ${response.statusText}`,
      );
    }

    return response.json();
  }

  async syncTeachers(): Promise<SyncResult> {
    const result: SyncResult = {
      entity: "teacher",
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      const teachers = await this.fetchData<any>("/api/sync/teachers");

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
            await prisma.user.upsert({
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

            // Update subjects assigned to this teacher
            // dhalpa-school API returns "subjects" (array of objects), not "subjectIds"
            const subjectIds = teacher.subjects?.map((s: any) => s.id) ?? [];
            if (subjectIds.length > 0) {
              // Find synced subjects by their sourceIds
              const syncedSubjects = await prisma.syncedSubject.findMany({
                where: { sourceId: { in: subjectIds } },
              });

              // Assign teacher to these subjects
              if (syncedSubjects.length > 0) {
                await prisma.syncedTeacher.update({
                  where: { id: syncedTeacher.id },
                  data: {
                    subjects: {
                      set: syncedSubjects.map((s) => ({ id: s.id })),
                    },
                  },
                });
              }
            } else {
              await prisma.syncedTeacher.update({
                where: { id: syncedTeacher.id },
                data: {
                  subjects: {
                    set: [],
                  },
                },
              });
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
          result.errors.push(
            `${teacher.id}: ${error instanceof Error ? error.message : "Unknown"}`,
          );
        }
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    return result;
  }

  async syncStudents(): Promise<SyncResult> {
    const result: SyncResult = {
      entity: "student",
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      const url = `${this.apiUrl}/api/sync/students`;
      console.log(`[SYNC] Fetching students from: ${url}`);

      const response: any = await this.fetchData<any>("/api/sync/students");
      const students: any[] = Array.isArray(response) ? response : (response?.data ?? []);

      console.log(`[SYNC] Received ${students.length} students. IsArray: ${Array.isArray(response)}, hasData: ${!Array.isArray(response) && !!response?.data}`);

      if (students.length > 0) {
        const sample = students[0];
        console.log(`[SYNC] First student sample:`, {
          id: sample.id,
          name: sample.name,
          firstName: sample.firstName,
          lastName: sample.lastName,
          grade: sample.grade,
          classroom: sample.classroom,
          classroomName: sample.classroom?.name,
          keys: Object.keys(sample),
        });
      }

      for (const student of students) {
        try {
          const classroomName = student.class ?? student.classroom?.name ?? student.grade ?? "";
          const studentName = student.name ?? ([student.firstName, student.lastName].filter(Boolean).join(" ").trim() || "Unknown");

          const upserted = await prisma.syncedStudent.upsert({
            where: { sourceId: student.id },
            update: {
              name: studentName,
              rollNumber: student.rollNumber || "",
              class: classroomName,
              section: student.section || "A",
              syncedAt: new Date(),
            },
            create: {
              sourceId: student.id,
              name: studentName,
              rollNumber: student.rollNumber || "",
              class: classroomName,
              section: student.section || "A",
            },
          });

          if (result.synced === 0) {
            console.log(`[SYNC] First upsert result:`, {
              sourceId: student.id,
              storedClass: upserted.class,
              inputClass: classroomName,
              rawClassroom: student.classroom,
              rawGrade: student.grade,
            });
          }

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
          result.errors.push(
            `${student.id}: ${error instanceof Error ? error.message : "Unknown"}`,
          );
        }
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    return result;
  }

  async syncSubjects(): Promise<SyncResult> {
    const result: SyncResult = {
      entity: "subject",
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      const subjects = await this.fetchData<any>("/api/sync/subjects");

      for (const subject of subjects) {
        try {
          let teachersConnect: { id: string }[] = [];
          if (subject.teacherId) {
            const teacher = await prisma.syncedTeacher.findUnique({
              where: { sourceId: subject.teacherId },
            });
            if (teacher) {
              teachersConnect.push({ id: teacher.id });
            }
          }

          await prisma.syncedSubject.upsert({
            where: { sourceId: subject.id },
            update: {
              name: subject.name,
              code: subject.code || subject.name.toUpperCase().substring(0, 6),
              gradeLevel: subject.gradeLevel || "General",
              ...(teachersConnect.length > 0 && {
                teachers: { connect: teachersConnect },
              }),
              syncedAt: new Date(),
            },
            create: {
              sourceId: subject.id,
              name: subject.name,
              code: subject.code || subject.name.toUpperCase().substring(0, 6),
              gradeLevel: subject.gradeLevel || "General",
              teachers: { connect: teachersConnect },
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

          await prisma.syncLog
            .create({
              data: {
                entity: "subject",
                sourceId: subject.id,
                action: "sync",
                payload: subject,
                status: "error",
                error: errorMsg,
              },
            })
            .catch(() => {});
        }
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    return result;
  }

  /**
   * Second pass: assign subjects to teachers based on teacher.subjects from the
   * dhalpa-school API. This runs AFTER both teachers and subjects are synced so
   * the SyncedSubject records already exist in the database.
   */
  async assignSubjectsToTeachers(): Promise<SyncResult> {
    const result: SyncResult = {
      entity: "teacher-subject-assignment",
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      const teachers = await this.fetchData<any>("/api/sync/teachers");

      for (const teacher of teachers) {
        try {
          const syncedTeacher = await prisma.syncedTeacher.findUnique({
            where: { sourceId: teacher.id },
          });
          if (!syncedTeacher) continue;

          const subjectIds = teacher.subjects?.map((s: any) => s.id) ?? [];
          if (subjectIds.length === 0) continue;

          // Find synced subjects by their sourceIds
          const syncedSubjects = await prisma.syncedSubject.findMany({
            where: { sourceId: { in: subjectIds } },
          });

          // Update teacher subjects — only if we found matching subjects
          if (syncedSubjects.length > 0) {
            await prisma.syncedTeacher.update({
              where: { id: syncedTeacher.id },
              data: {
                subjects: {
                  set: syncedSubjects.map(s => ({ id: s.id }))
                }
              }
            });
            result.synced++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(
            `${teacher.id}: ${error instanceof Error ? error.message : "Unknown"}`,
          );
        }
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    return result;
  }

  async syncAll() {
    // Sync in order: teachers first, then subjects (since subjects reference teachers), then students
    const results = {
      teachers: await this.syncTeachers(),
      subjects: await this.syncSubjects(),
      // Second pass: assign subjects to teachers after both are synced
      teacherSubjectAssignment: await this.assignSubjectsToTeachers(),
      students: await this.syncStudents(),
    };

    const totalSynced =
      results.teachers.synced +
      results.students.synced +
      results.subjects.synced +
      results.teacherSubjectAssignment.synced;
    const totalFailed =
      results.teachers.failed +
      results.students.failed +
      results.subjects.failed +
      results.teacherSubjectAssignment.failed;

    return {
      success: totalFailed === 0,
      totalSynced,
      totalFailed,
      details: results,
    };
  }
}
