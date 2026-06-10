import { NextRequest, NextResponse } from "next/server";
import { teacherBatchSyncSchema } from "@/utils/validations/sync";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const teachers = teacherBatchSyncSchema.parse(body);

    const results = await Promise.allSettled(
      teachers.map(async (teacher) => {
        await prisma.syncedTeacher.upsert({
          where: { sourceId: teacher.id ?? teacher.user.email },
          update: { name: teacher.user.name, syncedAt: new Date() },
          create: {
            sourceId: teacher.id ?? teacher.user.email,
            name: teacher.user.name,
          },
        });
        return { success: true };
      })
    );

    return NextResponse.json({
      success: true,
      synced: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
