import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseGradeLevel(raw: string | undefined | null, explicitSection?: string | null): { gradeLevel: string; section: string | null } {
  if (explicitSection != null) {
    return { gradeLevel: raw || "General", section: explicitSection || null };
  }
  if (!raw) return { gradeLevel: "General", section: null };
  const match = raw.match(/^(.+)-([A-Za-z]{1,2})$/);
  if (match) return { gradeLevel: match[1].trim(), section: match[2].toUpperCase() };
  return { gradeLevel: raw, section: null };
}

async function main() {
  const apiUrl = process.env.EXTERNAL_API_URL || "http://localhost:4000";
  console.log(`Fetching teachers from ${apiUrl}/api/sync/teachers ...`);

  const res = await fetch(`${apiUrl}/api/sync/teachers`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
  const teachers: any[] = await res.json();
  console.log(`Got ${teachers.length} teachers\n`);

  let updated = 0;

  for (const teacher of teachers) {
    const subjects: { id: string; name: string; code?: string; gradeLevel?: string; section?: string }[] =
      teacher.subjects ?? [];
    if (subjects.length === 0) continue;

    // Build grade → [sections] from assignedClassroomsDetails
    const classrooms: { grade?: string; section?: string }[] =
      teacher.assignedClassroomsDetails ?? teacher.classrooms ?? [];
    const gradeSectionMap = new Map<string, string[]>();
    for (const cls of classrooms) {
      const g = cls.grade?.trim();
      const s = cls.section?.trim();
      if (!g || !s) continue;
      if (!gradeSectionMap.has(g)) gradeSectionMap.set(g, []);
      gradeSectionMap.get(g)!.push(s.toUpperCase());
    }
    const gradeSectionCursor = new Map<string, number>();

    for (const sub of subjects) {
      let { gradeLevel, section } = parseGradeLevel(sub.gradeLevel, sub.section);

      if (!section) {
        const sections = gradeSectionMap.get(gradeLevel);
        if (sections && sections.length > 0) {
          const cursor = gradeSectionCursor.get(gradeLevel) ?? 0;
          section = sections[cursor % sections.length];
          gradeSectionCursor.set(gradeLevel, cursor + 1);
        }
      }

      const existing = await prisma.syncedSubject.findUnique({ where: { sourceId: sub.id } });
      if (!existing) continue;

      if (existing.gradeLevel === gradeLevel && existing.section === section) {
        console.log(`  ✓ ${sub.name} [${sub.id}] already correct: ${gradeLevel} / ${section ?? "null"}`);
        continue;
      }

      await prisma.syncedSubject.update({
        where: { id: existing.id },
        data: { gradeLevel, section },
      });

      console.log(
        `  ✏ ${sub.name} [${existing.id}]: "${existing.gradeLevel}/${existing.section ?? "null"}" → "${gradeLevel}/${section ?? "null"}"`
      );
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated} subject(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
