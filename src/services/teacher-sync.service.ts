import { prisma } from "@/lib/prisma";

interface ExternalTeacher {
  id: string;
  firstName: string;
  lastName: string;
  user: {
    name: string;
  };
}

export class TeacherSyncService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.EXTERNAL_API_URL || "http://localhost:4000";
    this.apiKey = process.env.EXTERNAL_API_KEY || "";
  }

  async fetchTeachers(): Promise<ExternalTeacher[]> {
    const response = await fetch(`${this.apiUrl}/api/admin/teachers`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch teachers: ${response.statusText}`);
    }

    return response.json();
  }

  async syncTeachers() {
    const teachers = await this.fetchTeachers();
    const results = { synced: 0, failed: 0, errors: [] as string[] };

    for (const teacher of teachers) {
      try {
        await prisma.syncedTeacher.upsert({
          where: { sourceId: teacher.id },
          update: {
            name: teacher.user.name,
            syncedAt: new Date(),
          },
          create: {
            sourceId: teacher.id,
            name: teacher.user.name,
          },
        });

        await prisma.syncLog.create({
          data: {
            entity: "teacher",
            sourceId: teacher.id,
            action: "sync",
            payload: teacher,
            status: "success",
          },
        });

        results.synced++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${teacher.id}: ${error instanceof Error ? error.message : "Unknown"}`);

        await prisma.syncLog.create({
          data: {
            entity: "teacher",
            sourceId: teacher.id,
            action: "sync",
            payload: teacher,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }

    return results;
  }
}
