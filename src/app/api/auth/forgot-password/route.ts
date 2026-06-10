import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";
import { withPublicHandler } from "@/lib/handlers";
import { forgotPasswordSchema } from "@/lib/schemas";

// POST /api/auth/forgot-password
// Always returns 200 to prevent user enumeration
export const POST = withPublicHandler(async (req: NextRequest) => {
  const { email } = forgotPasswordSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && user.isActive) {
    // Invalidate any existing tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: send email with reset link containing `token`
    console.info(`[RESET] Token for ${email}: ${token}`);
  }

  return ok(null, "If an account exists, a reset link has been sent");
});
