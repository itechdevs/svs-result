import { NextRequest } from "next/server";
import { changePasswordSchema } from "@/lib/schemas";
import { changePassword } from "@/services/auth-service";
import { ok, badRequest, unauthorized } from "@/lib/response";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return unauthorized("Not authenticated");
    }

    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    await changePassword(session.user.id, currentPassword, newPassword);

    return ok(null, "Password changed successfully");
  } catch (error) {
    if (error instanceof Error) {
      return badRequest(error.message);
    }
    return badRequest("Password change failed");
  }
}
