/**
 * POST /api/sync/webhook
 * Receives sync events from the school management system.
 * Secured via HMAC signature on the X-Sync-Signature header.
 */
import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { badRequest, ok, unauthorized } from "@/lib/response";
import { withPublicHandler } from "@/lib/handlers";
import { syncWebhookSchema } from "@/lib/schemas";

const SYNC_SECRET = process.env.SYNC_WEBHOOK_SECRET ?? "";

function parseGradeLevel(raw: string | undefined | null, explicitSection?: string | null): { gradeLevel: string; section: string | null } {
  if (explicitSection != null) {
    return { gradeLevel: raw || "General", section: explicitSection || null };
  }
  if (!raw) return { gradeLevel: "General", section: null };
  const match = raw.match(/^(.+?)\s*-\s*([A-Za-z]{1,2})$/);
  if (match) return { gradeLevel: match[1].trim(), section: match[2].toUpperCase() };
  return { gradeLevel: raw, section: null };
}

function verifySignature(rawBody: string, signature: string): boolean {
  if (!SYNC_SECRET) return true; // Skip in dev if secret not set
  const expected = crypto
    .createHmac("sha256", SYNC_SECRET)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expected}`),
    Buffer.from(signature),
  );
}

export const POST = withPublicHandler(async (req: NextRequest) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-sync-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return unauthorized("Invalid webhook signature");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return badRequest("Invalid JSON payload");
  }

  const event = syncWebhookSchema.parse(payload);

  let status = "success";
  let error: string | null = null;

  try {
    if (event.entity === "student") {
      const data = event.payload as Record<string, any>;
      const className = data.class ?? data.classroom?.name ?? data.grade ?? "";

      if (event.action === "deactivate") {
        await prisma.syncedStudent.updateMany({
          where: { sourceId: data.sourceId },
          data: { isActive: false, updatedAt: new Date() },
        });
      } else {
        const { class: _c, grade: _g, classroom: _cr, ...rest } = data;
        await prisma.syncedStudent.upsert({
          where: { sourceId: data.sourceId },
          create: {
            sourceId: data.sourceId,
            name: data.name,
            rollNumber: data.rollNumber || "",
            class: className,
            section: data.section || "A",
            isActive: data.isActive ?? true,
          },
          update: {
            name: data.name,
            rollNumber: data.rollNumber || "",
            class: className,
            section: data.section || "A",
            isActive: data.isActive ?? true,
            syncedAt: new Date(),
          },
        });
      }
    } else if (event.entity === "teacher") {
      const data = event.payload as {
        sourceId: string;
        name: string;
        email?: string;
        phone?: string;
        imageUrl?: string;
        classTeacherId?: string;
        classTeacherClassName?: string;
        isActive: boolean;
      };

      if (event.action === "deactivate") {
        await prisma.syncedTeacher.updateMany({
          where: { sourceId: data.sourceId },
          data: { isActive: false },
        });
      } else {
        await prisma.syncedTeacher.upsert({
          where: { sourceId: data.sourceId },
          create: {
            sourceId: data.sourceId,
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            imageUrl: data.imageUrl || null,
            classTeacherId: data.classTeacherId || null,
            classTeacherClassName: data.classTeacherClassName || null,
          },
          update: {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            imageUrl: data.imageUrl || null,
            classTeacherId: data.classTeacherId || null,
            classTeacherClassName: data.classTeacherClassName || null,
            isActive: data.isActive,
            syncedAt: new Date(),
          },
        });
      }
    } else if (event.entity === "subject") {
      const data = event.payload as {
        sourceId: string;
        name: string;
        code: string;
        gradeLevel: string;
        section?: string;
        isActive: boolean;
      };

      if (event.action === "deactivate") {
        await prisma.syncedSubject.updateMany({
          where: { sourceId: data.sourceId },
          data: { isActive: false },
        });
      } else {
        const parsed = parseGradeLevel(data.gradeLevel, data.section);
        await prisma.syncedSubject.upsert({
          where: { sourceId: data.sourceId },
          create: { sourceId: data.sourceId, name: data.name, code: data.code, isActive: data.isActive, ...parsed },
          update: {
            name: data.name,
            code: data.code,
            isActive: data.isActive,
            syncedAt: new Date(),
            ...parsed,
          },
        });
      }
    }
  } catch (err) {
    status = "error";
    error = err instanceof Error ? err.message : "Unknown error";
  }

  // Always log sync events
  await prisma.syncLog.create({
    data: {
      entity: event.entity,
      sourceId: (event.payload as { sourceId: string }).sourceId,
      action: event.action,
      payload: event.payload as object,
      status,
      error,
    },
  });

  if (status === "error") {
    return ok(
      { status: "error", error },
      "Sync event received but processing failed",
    );
  }

  return ok({ status: "success" }, "Sync event processed");
});
