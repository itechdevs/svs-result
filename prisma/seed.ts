import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await hash("schooladmin@.", 10);

  // Admin User
  await prisma.user.create({
    data: {
      email: "sanskarvschool@gmail.com",
      passwordHash,
      role: UserRole.ADMIN,
      name: "Admin Account",
      isActive: true,
      emailVerified: new Date(),
    },
  });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
