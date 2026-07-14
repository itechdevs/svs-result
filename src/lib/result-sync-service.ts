import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type SyncEntityType = "STUDENT" | "TEACHER" | "SUBJECT" | "TEACHER_SUBJECT_LINK";
type SyncAction = "UPSERT" | "DEACTIVATE";

/**
 * Splits "1 - A", "1-A", "Grade 7 - B" into { gradeLevel, section }.
 * Handles spaces around the dash (the school API sends "1 - A").
 */
const parseGradeLevel = (raw: string | undefined | null): { gradeLevel: string; section: string | null } => {
  if (!raw) return { gradeLevel: "General", section: null };
  const match = raw.match(/^(.+?)\s*-\s*([A-Za-z]{1,2})$/);
  if (match) return { gradeLevel: match[1].trim(), section: match[2].toUpperCase() };
  return { gradeLevel: raw, section: null };
};

type StudentPayload = {
  sourceStudentId: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  grade: string;
  dateOfBirth?: string | null;
  updatedAt: string;
};

type TeacherPayload = {
  sourceTeacherId: string;
  name: string;
  email?: string | null;
  passwordHash?: string | null;
  phone?: string | null;
  imageUrl?: string | null;
  classTeacherId?: string | null;
  classTeacherClassName?: string | null;
  subjectSourceIds: string[];
  updatedAt: string;
};

type SubjectPayload = {
  sourceSubjectId: string;
  name: string;
  code: string;
  gradeLevel: string;
  isActive: boolean;
  teacherSourceIds?: string[];
  updatedAt: string;
};

type TeacherSubjectLinkPayload = {
  sourceTeacherId: string;
  sourceSubjectId: string;
};

type SyncEventEnvelope = {
  eventId: string;
  entityType: SyncEntityType;
  action: SyncAction;
  entityId: string;
  payload: Prisma.InputJsonObject;
};

const DEFAULT_RETRY_LIMIT = 5;

const parseDate = (value?: string) => {
  if (!value) return null;
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

// =============================================================================
// STUDENT SYNC
// =============================================================================

const syncStudent = async (action: SyncAction, rawPayload: Record<string, unknown>) => {
  const payload = rawPayload as unknown as StudentPayload;

  if (!payload.sourceStudentId) {
    throw new Error("Student payload requires sourceStudentId");
  }

  if (action === "DEACTIVATE") {
    await prisma.syncedStudent.updateMany({
      where: { sourceId: payload.sourceStudentId },
      data: { isActive: false },
    });

    await prisma.syncLog.create({
      data: {
        entity: "student",
        sourceId: payload.sourceStudentId,
        action: "DEACTIVATE",
        payload: rawPayload as Prisma.InputJsonValue,
        status: "success",
      },
    });
    return;
  }

  if (!payload.name) {
    throw new Error("Student payload requires name for UPSERT");
  }

  await prisma.syncedStudent.upsert({
    where: { sourceId: payload.sourceStudentId },
    create: {
      sourceId: payload.sourceStudentId,
      name: payload.name,
      rollNumber: payload.rollNumber || "",
      class: payload.class || "",
      section: payload.section || "A",
      dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
      isActive: true,
    },
    update: {
      name: payload.name,
      rollNumber: payload.rollNumber || "",
      class: payload.class || "",
      section: payload.section || "A",
      dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
      isActive: true,
    },
  });

  await prisma.syncLog.create({
    data: {
      entity: "student",
      sourceId: payload.sourceStudentId,
      action: "UPSERT",
      payload: rawPayload as Prisma.InputJsonValue,
      status: "success",
    },
  });
};

// =============================================================================
// TEACHER SYNC
// =============================================================================

const syncTeacher = async (action: SyncAction, rawPayload: Record<string, unknown>) => {
  const payload = rawPayload as unknown as TeacherPayload;

  if (!payload.sourceTeacherId) {
    throw new Error("Teacher payload requires sourceTeacherId");
  }

  if (action === "DEACTIVATE") {
    // Soft-deactivate teacher
    const teacher = await prisma.syncedTeacher.updateMany({
      where: { sourceId: payload.sourceTeacherId },
      data: { isActive: false },
    });

    // Also deactivate linked user if exists
    const syncedTeacher = await prisma.syncedTeacher.findUnique({
      where: { sourceId: payload.sourceTeacherId },
      include: { user: true },
    });

    if (syncedTeacher?.user) {
      await prisma.user.update({
        where: { id: syncedTeacher.user.id },
        data: { isActive: false },
      });
    }

    await prisma.syncLog.create({
      data: {
        entity: "teacher",
        sourceId: payload.sourceTeacherId,
        action: "DEACTIVATE",
        payload: rawPayload as Prisma.InputJsonValue,
        status: "success",
      },
    });
    return;
  }

  if (!payload.name) {
    throw new Error("Teacher payload requires name for UPSERT");
  }

  // Upsert synced teacher
  const syncedTeacher = await prisma.syncedTeacher.upsert({
    where: { sourceId: payload.sourceTeacherId },
    update: {
      name: payload.name,
      email: payload.email || null,
      phone: payload.phone || null,
      imageUrl: payload.imageUrl || null,
      classTeacherId: payload.classTeacherId || null,
      classTeacherClassName: payload.classTeacherClassName || null,
      isActive: true,
      syncedAt: new Date(),
    },
    create: {
      sourceId: payload.sourceTeacherId,
      name: payload.name,
      email: payload.email || null,
      phone: payload.phone || null,
      imageUrl: payload.imageUrl || null,
      classTeacherId: payload.classTeacherId || null,
      classTeacherClassName: payload.classTeacherClassName || null,
      isActive: true,
    },
  });

  // Auto-create or update user account if email + passwordHash present
  if (payload.email && payload.passwordHash) {
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (existingUser) {
      // Update existing user - only update password if provided
      await prisma.user.update({
        where: { email: payload.email },
        data: {
          name: payload.name,
          ...(payload.passwordHash && { passwordHash: payload.passwordHash }),
          syncedTeacherId: syncedTeacher.id,
          isActive: true,
        },
      });
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          email: payload.email,
          passwordHash: payload.passwordHash,
          name: payload.name,
          role: "TEACHER",
          syncedTeacherId: syncedTeacher.id,
          isActive: true,
          emailVerified: new Date(),
        },
      });
    }
  }

  // Set teacher-subject M2M relationships from subjectSourceIds
  if (Array.isArray(payload.subjectSourceIds)) {
    // findMany by sourceId can return multiple rows when the same subject
    // was assigned to multiple sections (each stored as a separate row).
    const syncedSubjects = await prisma.syncedSubject.findMany({
      where: { sourceId: { in: payload.subjectSourceIds } },
    });

    await prisma.syncedTeacher.update({
      where: { id: syncedTeacher.id },
      data: {
        subjects: {
          set: syncedSubjects.map((s) => ({ id: s.id })),
        },
      },
    });
  }

  await prisma.syncLog.create({
    data: {
      entity: "teacher",
      sourceId: payload.sourceTeacherId,
      action: "UPSERT",
      payload: rawPayload as Prisma.InputJsonValue,
      status: "success",
    },
  });
};

// =============================================================================
// SUBJECT SYNC
// =============================================================================

const syncSubject = async (action: SyncAction, rawPayload: Record<string, unknown>) => {
  const payload = rawPayload as unknown as SubjectPayload;

  if (!payload.sourceSubjectId) {
    throw new Error("Subject payload requires sourceSubjectId");
  }

  if (action === "DEACTIVATE") {
    await prisma.syncedSubject.updateMany({
      where: { sourceId: payload.sourceSubjectId },
      data: { isActive: false },
    });

    await prisma.syncLog.create({
      data: {
        entity: "subject",
        sourceId: payload.sourceSubjectId,
        action: "DEACTIVATE",
        payload: rawPayload as Prisma.InputJsonValue,
        status: "success",
      },
    });
    return;
  }

  if (!payload.name || !payload.code) {
    throw new Error("Subject payload requires name and code for UPSERT");
  }

  const { gradeLevel: parsedGrade, section: parsedSection } = parseGradeLevel(payload.gradeLevel);

  // Find existing subject by sourceId — there may be multiple rows if the same
  // subject was assigned to multiple sections (each gets its own row).
  // For a plain SUBJECT event we upsert the first/only matching row.
  const existing = await prisma.syncedSubject.findFirst({
    where: { sourceId: payload.sourceSubjectId },
    orderBy: { syncedAt: "asc" },
  });

  let syncedSubject;
  if (existing) {
    // Preserve existing section if the new event doesn't carry one
    const effectiveSection = parsedSection ?? existing.section;
    syncedSubject = await prisma.syncedSubject.update({
      where: { id: existing.id },
      data: {
        name: payload.name,
        code: payload.code,
        gradeLevel: parsedGrade,
        section: effectiveSection,
        isActive: payload.isActive ?? true,
        syncedAt: new Date(),
      },
    });
  } else {
    syncedSubject = await prisma.syncedSubject.create({
      data: {
        sourceId: payload.sourceSubjectId,
        name: payload.name,
        code: payload.code,
        gradeLevel: parsedGrade,
        section: parsedSection,
        isActive: payload.isActive ?? true,
      },
    });
  }

  // Connect teachers if teacherSourceIds provided
  if (Array.isArray(payload.teacherSourceIds) && payload.teacherSourceIds.length > 0) {
    const syncedTeachers = await prisma.syncedTeacher.findMany({
      where: { sourceId: { in: payload.teacherSourceIds } },
    });

    if (syncedTeachers.length > 0) {
      await prisma.syncedSubject.update({
        where: { id: syncedSubject.id },
        data: {
          teachers: {
            set: syncedTeachers.map((t) => ({ id: t.id })),
          },
        },
      });
    }
  }

  await prisma.syncLog.create({
    data: {
      entity: "subject",
      sourceId: payload.sourceSubjectId,
      action: "UPSERT",
      payload: rawPayload as Prisma.InputJsonValue,
      status: "success",
    },
  });
};

// =============================================================================
// TEACHER-SUBJECT LINK SYNC
// =============================================================================

const syncTeacherSubjectLink = async (
  action: SyncAction,
  rawPayload: Record<string, unknown>
) => {
  const payload = rawPayload as unknown as TeacherSubjectLinkPayload;

  if (!payload.sourceTeacherId || !payload.sourceSubjectId) {
    throw new Error("Teacher-subject link requires sourceTeacherId and sourceSubjectId");
  }

  const [teacher, subject] = await Promise.all([
    prisma.syncedTeacher.findUnique({ where: { sourceId: payload.sourceTeacherId } }),
    prisma.syncedSubject.findUnique({ where: { sourceId: payload.sourceSubjectId } }),
  ]);

  if (!teacher || !subject) {
    throw new Error(
      `Teacher-subject link references unknown teacher (${!teacher ? "missing" : "found"}) or subject (${!subject ? "missing" : "found"})`
    );
  }

  if (action === "DEACTIVATE") {
    // Disconnect M2M relationship
    await prisma.syncedTeacher.update({
      where: { id: teacher.id },
      data: {
        subjects: {
          disconnect: { id: subject.id },
        },
      },
    });

    await prisma.syncLog.create({
      data: {
        entity: "teacher_subject_link",
        sourceId: `${payload.sourceTeacherId}:${payload.sourceSubjectId}`,
        action: "DEACTIVATE",
        payload: rawPayload as Prisma.InputJsonValue,
        status: "success",
      },
    });
    return;
  }

  // UPSERT: Connect teacher and subject
  await prisma.syncedTeacher.update({
    where: { id: teacher.id },
    data: {
      subjects: {
        connect: { id: subject.id },
      },
    },
  });

  await prisma.syncLog.create({
    data: {
      entity: "teacher_subject_link",
      sourceId: `${payload.sourceTeacherId}:${payload.sourceSubjectId}`,
      action: "UPSERT",
      payload: rawPayload as Prisma.InputJsonValue,
      status: "success",
    },
  });
};

// =============================================================================
// DISPATCHER
// =============================================================================

const dispatchSyncAction = async (
  entityType: SyncEntityType,
  action: SyncAction,
  payload: Record<string, unknown>
) => {
  if (entityType === "STUDENT") {
    await syncStudent(action, payload);
    return;
  }

  if (entityType === "TEACHER") {
    await syncTeacher(action, payload);
    return;
  }

  if (entityType === "SUBJECT") {
    await syncSubject(action, payload);
    return;
  }

  if (entityType === "TEACHER_SUBJECT_LINK") {
    await syncTeacherSubjectLink(action, payload);
    return;
  }

  throw new Error(`Unsupported entityType: ${entityType}`);
};

// =============================================================================
// PUBLIC API
// =============================================================================

export const verifySyncSecret = (providedSecret: string | null) => {
  const expected = process.env.SYNC_SERVICE_SECRET;
  
  // Debug logging
  console.log("[VERIFY_SYNC_SECRET]", {
    hasExpected: !!expected,
    expectedLength: expected?.length,
    expectedFirst10: expected?.substring(0, 10),
    expectedLast10: expected?.substring(expected.length - 10),
    hasProvided: !!providedSecret,
    providedLength: providedSecret?.length,
    providedFirst10: providedSecret?.substring(0, 10),
    providedLast10: providedSecret?.substring(providedSecret?.length - 10),
    match: providedSecret === expected,
  });
  
  if (!expected) {
    throw new Error("SYNC_SERVICE_SECRET is not configured");
  }
  return providedSecret === expected;
};

export const validateSyncEnvelope = (input: unknown): SyncEventEnvelope => {
  if (!input || typeof input !== "object") {
    throw new Error("Body must be a JSON object");
  }

  const event = input as Record<string, unknown>;
  const eventId = String(event.eventId || "").trim();
  const entityType = String(event.entityType || "").trim() as SyncEntityType;
  const action = String(event.action || "").trim() as SyncAction;
  const entityId = String(event.entityId || "").trim();
  const payload = event.payload;

  if (
    !eventId ||
    !entityType ||
    !action ||
    !entityId ||
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new Error("eventId, entityType, action, entityId and payload are required");
  }

  return {
    eventId,
    entityType,
    action,
    entityId,
    payload: payload as Prisma.InputJsonObject,
  };
};

export const enqueueSyncEvent = async (event: SyncEventEnvelope) => {
  // Check for duplicate eventId
  const existing = await prisma.syncEvent.findUnique({
    where: { eventId: event.eventId },
  });

  if (existing) {
    return { ...existing, duplicate: true };
  }

  return prisma.syncEvent.create({
    data: {
      eventId: event.eventId,
      entityType: event.entityType,
      action: event.action,
      entityId: event.entityId,
      payload: event.payload,
      status: "PENDING",
    },
  });
};

export const processSyncEventByEventId = async (eventId: string) => {
  const event = await prisma.syncEvent.findUnique({ where: { eventId } });
  if (!event) {
    throw new Error(`Sync event not found: ${eventId}`);
  }

  if (event.status === "PROCESSED" || event.status === "IGNORED") {
    return event;
  }

  try {
    await prisma.syncEvent.update({
      where: { id: event.id },
      data: {
        attempts: { increment: 1 },
        lastError: null,
      },
    });

    await dispatchSyncAction(
      event.entityType as SyncEntityType,
      event.action as SyncAction,
      event.payload as Record<string, unknown>
    );

    return prisma.syncEvent.update({
      where: { id: event.id },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    return prisma.syncEvent.update({
      where: { id: event.id },
      data: {
        status: event.attempts + 1 >= DEFAULT_RETRY_LIMIT ? "FAILED" : "PENDING",
        lastError: message,
      },
    });
  }
};

export const processPendingSyncEvents = async (limit = 100) => {
  const pendingEvents = await prisma.syncEvent.findMany({
    where: { status: "PENDING" },
    orderBy: { receivedAt: "asc" },
    take: Math.max(1, Math.min(limit, 200)),
  });

  if (pendingEvents.length === 0) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const event of pendingEvents) {
    const result = await processSyncEventByEventId(event.eventId);
    if (result.status === "PROCESSED") processed += 1;
    if (result.status === "FAILED") failed += 1;
  }

  return { processed, failed };
};

export const getSyncEventStats = async () => {
  const [pending, processed, failed, lastProcessed] = await Promise.all([
    prisma.syncEvent.count({ where: { status: "PENDING" } }),
    prisma.syncEvent.count({ where: { status: "PROCESSED" } }),
    prisma.syncEvent.count({ where: { status: "FAILED" } }),
    prisma.syncEvent.findFirst({
      where: { status: "PROCESSED" },
      orderBy: { processedAt: "desc" },
      select: { processedAt: true, entityType: true, action: true },
    }),
  ]);

  return {
    pending,
    processed,
    failed,
    lastProcessedAt: lastProcessed?.processedAt,
    lastProcessedEntity: lastProcessed?.entityType,
    lastProcessedAction: lastProcessed?.action,
  };
};
