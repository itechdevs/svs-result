import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting dynamic teacher sync fix...");

  // Find all teacher users who don't have a syncedTeacherId yet
  const unlinkedTeachers = await prisma.user.findMany({
    where: { 
      role: "TEACHER",
      syncedTeacherId: null 
    }
  });

  if (unlinkedTeachers.length === 0) {
    console.log("All teacher accounts are already linked properly!");
    return;
  }

  console.log(`Found ${unlinkedTeachers.length} unlinked teacher(s).`);

  for (const teacher of unlinkedTeachers) {
    // Dynamically find the synced teacher by matching the name
    const syncedTeacher = await prisma.syncedTeacher.findFirst({
      where: { name: teacher.name }
    });

    if (syncedTeacher) {
      await prisma.user.update({
        where: { id: teacher.id },
        data: { syncedTeacherId: syncedTeacher.id }
      });
      console.log(`✅ Successfully linked ${teacher.email} to SyncedTeacher: ${syncedTeacher.name}`);
    } else {
      console.log(`❌ Could not find a SyncedTeacher matching the name: "${teacher.name}" for ${teacher.email}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
