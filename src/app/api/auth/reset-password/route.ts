import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { badRequest, ok } from "@/lib/response";
import { resetPasswordSchema } from "@/lib/schemas";
import { withPublicHandler } from "@/lib/handlers";

export const POST = withPublicHandler(async (req: NextRequest) => {
  const { token, password } = resetPasswordSchema.parse(await req.json());

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return badRequest("Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate all existing sessions after password reset
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  return ok(null, "Password reset successfully. Please log in.");
});
