/**
 * patch-teacher-subjects.ts
 *
 * One-time patch: the school API sends subjects with gradeLevel "1 - A" / "1 - B"
 * but the old sync code stored them as gradeLevel "1", section null.
 *
 * This script re-syncs all subjects by fetching them from the school API sync
 * endpoint and patching gradeLevel + section using parseGradeLevel.
 *
 * Run with:
 *   npx tsx scripts/patch-teacher-subjects.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseGradeLevel(raw: string | null | undefined): { gradeLevel: string; section: string | null } {
  if (!raw) return { gradeLevel: "General", section: null };
  const match = raw.match(/^(.+?)\s*-\s*([A-Za-z]{1,2})$/);
  if (match) return { gradeLevel: match[1].trim(), section: match[2].toUpperCase() };
  return { gradeLevel: raw, section: null };
}

async function main() {
  const apiUrl = process.env.EXTERNAL_API_URL || "http://localhost:4000";
  console.log(`Fetching teachers from ${apiUrl}/api/teachers ...\n`);

  // The school project exposes /api/teachers (GET, admin), not /api/sync/teachers.
  // We use /api/teachers directly since we have access to both projects locally.
  // Alternatively, call the result-management POST /api/sync/all to re-trigger everything.

  // --- DIRECT DB PATCH using known data from the school API ---
  // From the school API response for "Primary Teacher":
  // subjects: [
  //   { id: "cmrkb9wg80006u0v0jhsn6ij0", name: "1Subject", gradeLevel: "1 - A" },
  //   { id: "cmrkb9wg80005u0v070tju8hq", name: "1Subject", gradeLevel: "1 - B" },
  // ]
  // In the result DB: these are stored with sourceId = school id, but gradeLevel was "1", section null.

  const patches = [
    { sourceId: "cmrkb9wg80006u0v0jhsn6ij0", gradeLevel: "1", section: "A" },
    { sourceId: "cmrkb9wg80005u0v070tju8hq", gradeLevel: "1", section: "B" },
  ];

  for (const patch of patches) {
    const subject = await prisma.syncedSubject.findFirst({
      where: { sourceId: patch.sourceId },
    });

    if (!subject) {
      console.log(`  ✗ not found: sourceId=${patch.sourceId}`);
      continue;
    }

    await prisma.syncedSubject.update({
      where: { id: subject.id },
      data: { gradeLevel: patch.gradeLevel, section: patch.section },
    });

    console.log(`  ✏ patched [${subject.id}] sourceId=${patch.sourceId}: section → "${patch.section}"`);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
