import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createVerificationToken } from "./token-service";
import { sendVerificationEmail, sendPasswordChangedEmail } from "@/lib/email";
import { logAudit } from "./audit-service";

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "ADMIN" | "TEACHER" = "TEACHER"
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
      isActive: true,
    },
  });

  const token = await createVerificationToken(user.id);
  await sendVerificationEmail(email, token);

  return user;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await prisma.session.deleteMany({
    where: { userId },
  });

  await sendPasswordChangedEmail(user.email);
  await logAudit("PASSWORD_CHANGE", userId);
}

export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return;
  }

  if (user.emailVerified) {
    throw new Error("Email already verified");
  }

  const token = await createVerificationToken(user.id);
  await sendVerificationEmail(email, token);
}
