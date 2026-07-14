/**
 * repair-subject-sections.ts
 *
 * Reads all SyncedSubject rows whose gradeLevel contains " - " (i.e. the section
 * was never stripped out) OR whose section is null but whose gradeLevel looks like
 * it embeds a section, and fixes them in-place.
 *
 * Run with:
 *   npx tsx scripts/repair-subject-sections.ts
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
  // Find all subjects where section is null OR gradeLevel still has " - " pattern
  const subjects = await prisma.syncedSubject.findMany({
    where: {
      OR: [
        { section: null, gradeLevel: { contains: "-" } },
        { gradeLevel: { contains: " - " } },
      ],
    },
    select: { id: true, sourceId: true, name: true, gradeLevel: true, section: true },
  });

  console.log(`Found ${subjects.length} subject(s) that may need repair.\n`);

  let fixed = 0;
  let skipped = 0;

  for (const sub of subjects) {
    const { gradeLevel, section } = parseGradeLevel(sub.gradeLevel);

    if (gradeLevel === sub.gradeLevel && section === sub.section) {
      console.log(`  ✓ skip  [${sub.id}] ${sub.name}: "${sub.gradeLevel}" / "${sub.section}" — already correct`);
      skipped++;
      continue;
    }

    await prisma.syncedSubject.update({
      where: { id: sub.id },
      data: { gradeLevel, section },
    });

    console.log(`  ✏ fixed [${sub.id}] ${sub.name}: "${sub.gradeLevel}/${sub.section}" → "${gradeLevel}/${section}"`);
    fixed++;
  }

  console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
