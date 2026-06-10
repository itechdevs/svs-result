import { NextRequest, NextResponse } from "next/server";
import { teacherBatchSyncSchema } from "@/utils/validations/sync";
import { db } from "@/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const teachers = teacherBatchSyncSchema.parse(body);

    const results = await Promise.allSettled(
      teachers.map(async (teacher) => {
        return db.$transaction(async (tx) => {
          // Upsert user
          const user = await tx.user.upsert({
            where: { email: teacher.user.email },
            update: {
              name: teacher.user.name,
              role: teacher.user.role,
            },
            create: {
              email: teacher.user.email,
              name: teacher.user.name,
              role: teacher.user.role,
              firstName: teacher.firstName,
              lastName: teacher.lastName,
              phoneNumber: teacher.phone,
              passwordHash: "", // Set default or handle separately
            },
          });

          // Upsert teacher
          const teacherRecord = await tx.teacher.upsert({
            where: { userId: user.id },
            update: {
              qualification: teacher.designation,
              specialization: teacher.subject || undefined,
            },
            create: {
              userId: user.id,
              employeeId: teacher.id || `EMP-${Date.now()}`,
              qualification: teacher.designation,
              specialization: teacher.subject || undefined,
              dateOfJoining: new Date(),
            },
          });

          return { success: true, teacherId: teacherRecord.id };
        });
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      synced: successful,
      failed,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
