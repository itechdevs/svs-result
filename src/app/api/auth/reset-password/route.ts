import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { badRequest, ok } from "@/lib/response";
import { resetPasswordSchema } from "@/lib/schemas";
import { withPublicHandler } from "@/lib/handlers";
import { validateResetToken, consumeResetToken } from "@/services/token-service";
import { sendPasswordChangedEmail } from "@/lib/email";
import { logAudit } from "@/services/audit-service";

export const POST = withPublicHandler(async (req: NextRequest) => {
  const { token, password } = resetPasswordSchema.parse(await req.json());

  const record = await validateResetToken(token);
  if (!record) {
    return badRequest("Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });

  await consumeResetToken(token);
  await prisma.session.deleteMany({ where: { userId: record.userId } });

  await sendPasswordChangedEmail(record.user.email);
  await logAudit("PASSWORD_RESET", record.userId);

  return ok(null, "Password reset successfully. Please log in.");
});
