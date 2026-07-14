import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const patches = [
  { sourceId: "cmra5frye0001u0ssba0levlm", gradeLevel: "7", section: "A" },
  { sourceId: "cmra5i5a80004u0ss7yaj505r", gradeLevel: "7", section: "B" },
];

async function main() {
  for (const patch of patches) {
    const result = await prisma.$executeRaw`
      UPDATE synced_subjects
      SET "gradeLevel" = ${patch.gradeLevel}, section = ${patch.section}
      WHERE "sourceId" = ${patch.sourceId}
    `;
    console.log(`Updated ${patch.sourceId} → ${patch.gradeLevel}/${patch.section} (${result} row)`);
  }
  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
