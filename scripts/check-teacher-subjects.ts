import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.syncedTeacher.findFirst({
    where: { sourceId: "cmra6bev70002u05wo8lahza8" },
    include: {
      subjects: true,
    },
  });
  console.log("Teacher subjects (linked):", JSON.stringify(teacher?.subjects, null, 2));

  // Also show what the sourceId-based records look like
  const bySourceId = await prisma.syncedSubject.findMany({
    where: { sourceId: { in: ["cmra5frye0001u0ssba0levlm", "cmra5i5a80004u0ss7yaj505r"] } },
  });
  console.log("\nSubjects by sourceId (patched):", JSON.stringify(bySourceId, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
