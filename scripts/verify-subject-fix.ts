import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const subs = await prisma.syncedSubject.findMany({
    where: { sourceId: { in: ["cmrkb9wg80006u0v0jhsn6ij0", "cmrkb9wg80005u0v070tju8hq"] } },
    select: { id: true, sourceId: true, name: true, gradeLevel: true, section: true },
  });
  console.log(JSON.stringify(subs, null, 2));
}
main().finally(() => prisma.$disconnect());
