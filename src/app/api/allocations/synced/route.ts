import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teachers = await prisma.syncedTeacher.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true } },
        subjects: {
          where: { isActive: true },
          select: { id: true, name: true, gradeLevel: true },
          orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      allocations: teachers.map(t => ({
        id: t.id,
        name: t.name,
        syncedAt: t.syncedAt,
        hasAccount: t.user !== null,
        subjects: t.subjects,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch allocations" },
      { status: 500 }
    );
  }
}
