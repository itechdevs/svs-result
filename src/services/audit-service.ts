import { prisma } from "@/lib/prisma";

export async function logLoginAttempt(
  email: string,
  success: boolean,
  failReason: string | null,
  ipAddress?: string | null,
  userAgent?: string | null,
  userId?: string
) {
  await prisma.loginAttempt.create({
    data: {
      userId,
      email,
      success,
      failReason,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    },
  });
}

export async function logAudit(
  action: string,
  userId?: string,
  entityType?: string,
  entityId?: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      ipAddress,
      userAgent,
      metadata: metadata ? (metadata as never) : undefined,
    },
  });
}

export async function getRecentFailedAttempts(
  email: string,
  minutes: number = 15
): Promise<number> {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  return prisma.loginAttempt.count({
    where: {
      email,
      success: false,
      createdAt: { gte: since },
    },
  });
}
