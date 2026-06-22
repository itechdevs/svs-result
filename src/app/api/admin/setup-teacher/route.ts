import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { syncedTeacherId, email, password, assignments } = body;

    // Check if teacher exists
    const syncedTeacher = await prisma.syncedTeacher.findUnique({
      where: { id: syncedTeacherId },
    });

    if (!syncedTeacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: syncedTeacher.name,
        role: "TEACHER",
        syncedTeacherId,
      },
    });

    // Create assignments if provided
    if (assignments && assignments.length > 0) {
      await Promise.all(
        assignments.map(async (a: any) => {
          if (a.subjectId) {
            await prisma.syncedSubject.update({
              where: { id: a.subjectId },
              data: { teachers: { connect: { id: syncedTeacherId } } },
            });
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Error setting up teacher:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to setup teacher" },
      { status: 500 }
    );
  }
}
