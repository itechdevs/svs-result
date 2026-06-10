import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { badRequest, ok, unauthorized } from "@/lib/response";
import { withPublicHandler } from "@/lib/handlers";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";
import { setSessionCookie } from "@/lib/auth";

export const POST = withPublicHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { email, password } = loginSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return unauthorized("Invalid credentials");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return unauthorized("Invalid credentials");

  const token = await createSession(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const response = ok(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    "Login successful",
  );

  response.headers.set("Set-Cookie", setSessionCookie(token));
  return response;
});
