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

  /**
   * Splits a combined gradeLevel string like "7-A" into { gradeLevel: "7", section: "A" }.
   * If the source already sends them separately (section field present), those take priority.
   * If there is no dash-suffix (e.g. "Grade 5"), section is null.
   */
  private parseGradeLevel(raw: string | undefined | null, explicitSection?: string | null): { gradeLevel: string; section: string | null } {
    if (explicitSection != null) {
      return { gradeLevel: raw || "General", section: explicitSection || null };
    }
    if (!raw) return { gradeLevel: "General", section: null };
    // Match trailing "-<single-or-two-char>" e.g. "7-A", "Grade 7-B", "10-AB"
    const match = raw.match(/^(.+?)\s*-\s*([A-Za-z]{1,2})$/);
    if (match) {
      return { gradeLevel: match[1].trim(), section: match[2].toUpperCase() };
    }
    return { gradeLevel: raw, section: null };
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
            update: {
              name: teacher.user.name,
              email: teacher.user.email,
              phone: teacher.phone || null,
              imageUrl: teacher.imageUrl || null,
              classTeacherId: teacher.classTeacher || null,
              classTeacherClassName: teacher.classTeacherDetails?.name
                || (teacher.classTeacher && teacher.assignedClassroomsDetails?.length > 0
                  ? teacher.assignedClassroomsDetails.find((c: any) => c.id === teacher.classTeacher)?.name
                  : null)
                || null,
              syncedAt: new Date(),
            },
            create: {
              sourceId: teacher.id,
              name: teacher.user.name,
              email: teacher.user.email,
              phone: teacher.phone || null,
              imageUrl: teacher.imageUrl || null,
              classTeacherId: teacher.classTeacher || null,
              classTeacherClassName: teacher.classTeacherDetails?.name
                || (teacher.classTeacher && teacher.assignedClassroomsDetails?.length > 0
                  ? teacher.assignedClassroomsDetails.find((c: any) => c.id === teacher.classTeacher)?.name
                  : null)
                || null,
            },
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
            // Teacher API has the correct gradeLevel; create/update subjects as needed
            const teacherSubjects: { id: string; name: string; code?: string; gradeLevel?: string; section?: string }[] = teacher.subjects ?? [];
            if (teacherSubjects.length > 0) {
              const subjectIds = teacherSubjects.map(s => s.id);
              const existingSubjects = await prisma.syncedSubject.findMany({
                where: { sourceId: { in: subjectIds } },
              });

              // Build a lookup: grade → ordered list of sections from assigned classrooms
              // e.g. classrooms [{grade:"7", section:"A"}, {grade:"7", section:"B"}]
              // → { "7": ["A", "B"] }
              const classrooms: { grade?: string; section?: string }[] =
                teacher.assignedClassroomsDetails ?? teacher.classrooms ?? [];
              const gradeSectionMap = new Map<string, string[]>();
              for (const cls of classrooms) {
                const g = cls.grade?.trim();
                const s = cls.section?.trim();
                if (!g || !s) continue;
                if (!gradeSectionMap.has(g)) gradeSectionMap.set(g, []);
                gradeSectionMap.get(g)!.push(s.toUpperCase());
              }
              // Counter to cycle through sections per grade as we process subjects
              const gradeSectionCursor = new Map<string, number>();

              const existingMap = new Map(existingSubjects.map(s => [s.sourceId, s]));
              const allSyncedSubjects: typeof existingSubjects = [];

              for (const sub of teacherSubjects) {
                const existing = existingMap.get(sub.id);
                let { gradeLevel: parsedGrade, section: parsedSection } = this.parseGradeLevel(sub.gradeLevel, sub.section);

                // If section not embedded in gradeLevel, try to derive from classrooms
                if (!parsedSection) {
                  const sections = gradeSectionMap.get(parsedGrade);
                  if (sections && sections.length > 0) {
                    const cursor = gradeSectionCursor.get(parsedGrade) ?? 0;
                    parsedSection = sections[cursor % sections.length];
                    gradeSectionCursor.set(parsedGrade, cursor + 1);
                  }
                }

                if (existing) {
                  // If source provides no section, preserve whatever is already stored
                  const effectiveSection = parsedSection ?? existing.section;
                  // Update gradeLevel/section from teacher data
                  if (parsedGrade !== existing.gradeLevel || effectiveSection !== existing.section) {
                    await prisma.syncedSubject.update({
                      where: { id: existing.id },
                      data: {
                        gradeLevel: parsedGrade,
                        section: effectiveSection,
                        name: sub.name,
                        code: sub.code || sub.name.toUpperCase().substring(0, 6),
                      },
                    });
                  }
                  allSyncedSubjects.push({ ...existing, gradeLevel: parsedGrade });
                } else {
                  // Create missing subject from teacher data
                  const created = await prisma.syncedSubject.create({
                    data: {
                      sourceId: sub.id,
                      name: sub.name,
                      code: sub.code || sub.name.toUpperCase().substring(0, 6),
                      gradeLevel: parsedGrade,
                      section: parsedSection,
                    },
                  });
                  allSyncedSubjects.push(created);
                }
              }

              if (allSyncedSubjects.length > 0) {
                await prisma.syncedTeacher.update({
                  where: { id: syncedTeacher.id },
                  data: {
                    subjects: {
                      set: allSyncedSubjects.map(s => ({ id: s.id })),
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
              dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
              syncedAt: new Date(),
            },
            create: {
              sourceId: student.id,
              name: studentName,
              rollNumber: student.rollNumber || "",
              class: classroomName,
              section: student.section || "A",
              dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
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

          const { gradeLevel: parsedGrade, section: parsedSection } = this.parseGradeLevel(subject.gradeLevel, subject.section);

          // Preserve existing section if source provides none
          const existingSubject = await prisma.syncedSubject.findUnique({ where: { sourceId: subject.id } });
          const effectiveSection = parsedSection ?? existingSubject?.section ?? null;

          await prisma.syncedSubject.upsert({
            where: { sourceId: subject.id },
            update: {
              name: subject.name,
              code: subject.code || subject.name.toUpperCase().substring(0, 6),
              gradeLevel: parsedGrade,
              section: effectiveSection,
              ...(teachersConnect.length > 0 && {
                teachers: { connect: teachersConnect },
              }),
              syncedAt: new Date(),
            },
            create: {
              sourceId: subject.id,
              name: subject.name,
              code: subject.code || subject.name.toUpperCase().substring(0, 6),
              gradeLevel: parsedGrade,
              section: parsedSection,
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
   *
   * Uses the same cursor-cycling section logic as syncTeachers() so that when a
   * teacher is assigned the same subject for multiple sections (e.g. 1Subject 1-A
   * and 1Subject 1-B), each gets its own SyncedSubject row with the correct section.
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

          const teacherSubjects: { id: string; name: string; code?: string; gradeLevel?: string; section?: string }[] = teacher.subjects ?? [];
          if (teacherSubjects.length === 0) continue;

          // Build grade→sections map from assigned classrooms (same as syncTeachers)
          const classrooms: { grade?: string; section?: string }[] =
            teacher.assignedClassroomsDetails ?? teacher.classrooms ?? [];
          const gradeSectionMap = new Map<string, string[]>();
          for (const cls of classrooms) {
            const g = cls.grade?.trim();
            const s = cls.section?.trim();
            if (!g || !s) continue;
            if (!gradeSectionMap.has(g)) gradeSectionMap.set(g, []);
            gradeSectionMap.get(g)!.push(s.toUpperCase());
          }
          const gradeSectionCursor = new Map<string, number>();

          // Fetch ALL existing subjects for these sourceIds — there may be multiple
          // rows per sourceId when the same subject was created for different sections.
          const subjectSourceIds = teacherSubjects.map(s => s.id);
          const existingSubjects = await prisma.syncedSubject.findMany({
            where: { sourceId: { in: subjectSourceIds } },
          });

          // Group existing subjects by sourceId so we can match them positionally
          // (first occurrence → first section, second → second section, etc.)
          const existingBySourceId = new Map<string, typeof existingSubjects>();
          for (const sub of existingSubjects) {
            if (!existingBySourceId.has(sub.sourceId)) existingBySourceId.set(sub.sourceId, []);
            existingBySourceId.get(sub.sourceId)!.push(sub);
          }
          // Track how many times we've consumed each sourceId so positional matching works
          const sourceIdCursor = new Map<string, number>();

          const allSyncedSubjects: typeof existingSubjects = [];

          for (const sub of teacherSubjects) {
            let { gradeLevel: parsedGrade, section: parsedSection } = this.parseGradeLevel(sub.gradeLevel, sub.section);

            // If section not embedded in gradeLevel/section field, derive from classrooms
            if (!parsedSection) {
              const sections = gradeSectionMap.get(parsedGrade);
              if (sections && sections.length > 0) {
                const cursor = gradeSectionCursor.get(parsedGrade) ?? 0;
                parsedSection = sections[cursor % sections.length];
                gradeSectionCursor.set(parsedGrade, cursor + 1);
              }
            }

            // Pick the matching existing row for this occurrence of sourceId
            const existingList = existingBySourceId.get(sub.id) ?? [];
            const idx = sourceIdCursor.get(sub.id) ?? 0;
            sourceIdCursor.set(sub.id, idx + 1);
            const existing = existingList[idx] ?? null;

            if (existing) {
              const effectiveSection = parsedSection ?? existing.section;
              if (
                parsedGrade !== existing.gradeLevel ||
                effectiveSection !== existing.section ||
                sub.name !== existing.name
              ) {
                await prisma.syncedSubject.update({
                  where: { id: existing.id },
                  data: {
                    gradeLevel: parsedGrade,
                    section: effectiveSection,
                    name: sub.name,
                    code: sub.code || sub.name.toUpperCase().substring(0, 6),
                  },
                });
              }
              allSyncedSubjects.push({ ...existing, gradeLevel: parsedGrade, section: effectiveSection });
            } else {
              // No existing row for this occurrence — create a new one
              const created = await prisma.syncedSubject.create({
                data: {
                  sourceId: sub.id,
                  name: sub.name,
                  code: sub.code || sub.name.toUpperCase().substring(0, 6),
                  gradeLevel: parsedGrade,
                  section: parsedSection,
                },
              });
              allSyncedSubjects.push(created);
            }
          }

          if (allSyncedSubjects.length > 0) {
            await prisma.syncedTeacher.update({
              where: { id: syncedTeacher.id },
              data: {
                subjects: {
                  set: allSyncedSubjects.map(s => ({ id: s.id })),
                },
              },
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
