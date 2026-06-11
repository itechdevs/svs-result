import { prisma } from "../src/lib/prisma";

async function verifyTeacherEmails() {
  try {
    const result = await prisma.user.updateMany({
      where: {
        role: "TEACHER",
        emailVerified: null,
      },
      data: {
        emailVerified: new Date(),
      },
    });

    console.log(`✅ Verified ${result.count} teacher accounts`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTeacherEmails();
