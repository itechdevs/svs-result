import { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/lib/schemas";
import { ok } from "@/lib/response";
import { withPublicHandler } from "@/lib/handlers";
import { createPasswordResetToken } from "@/services/token-service";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const POST = withPublicHandler(async (req: NextRequest) => {
  const { email } = forgotPasswordSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.isActive) {
    const token = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail(email, token);
  }

  return ok(null, "If an account exists, a reset link has been sent");
});
