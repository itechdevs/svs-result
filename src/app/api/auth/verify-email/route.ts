import { NextRequest } from "next/server";
import { verifyToken } from "@/services/token-service";
import { ok, badRequest } from "@/lib/response";
import { logAudit } from "@/services/audit-service";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return badRequest("Token is required");
    }

    const user = await verifyToken(token);
    if (!user) {
      return badRequest("Invalid or expired token");
    }

    await logAudit("EMAIL_VERIFY", user.id);

    return ok(null, "Email verified successfully");
  } catch {
    return badRequest("Verification failed");
  }
}
