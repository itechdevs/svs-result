/**
 * scripts/backfill-synced-classrooms.ts
 *
 * Populates the synced_classrooms table from existing SyncedStudent data.
 * Only imports (class, section) pairs that look clean — i.e. the class name
 * does NOT end with an embedded section letter (e.g. "Panda  A", "Rabbit A").
 *
 * Run with: npx ts-node -e "require('./scripts/backfill-synced-classrooms.ts')"
 * Or:       node -r ts-node/register scripts/backfill-synced-classrooms.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Returns true if the class name looks like a legacy embedded-section value */
function isDirtyClassName(name: string): boolean {
  return /\s+[A-Za-z]{1,2}$/.test(name.trim());
}

async function main() {
  console.log("Fetching distinct (class, section) pairs from SyncedStudent…");

  const rows = await prisma.syncedStudent.findMany({
    where: { isActive: true },
    select: { class: true, section: true },
    distinct: ["class", "section"],
    orderBy: [{ class: "asc" }, { section: "asc" }],
  });

  console.log(`Found ${rows.length} distinct pairs.`);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.class?.trim() || "";
    const section = row.section?.trim() || "";

    if (!name || !section) {
      skipped++;
      continue;
    }

    if (isDirtyClassName(name)) {
      console.log(`  SKIP dirty class name: "${name}" section: "${section}"`);
      skipped++;
      continue;
    }

    await prisma.syncedClassroom.upsert({
      where: { name_section: { name, section } },
      create: { name, section, isActive: true },
      update: { isActive: true, syncedAt: new Date() },
    });

    console.log(`  OK  "${name}" section "${section}"`);
    created++;
  }

  console.log(`\nDone. Created/updated: ${created}  Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
