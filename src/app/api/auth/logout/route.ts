import { cookies } from "next/headers";
import { ok } from "@/lib/response";
import { withPublicHandler } from "@/lib/handlers";
import { destroySession } from "@/lib/auth";
import { clearSessionCookie } from "@/lib/auth";

export const POST = withPublicHandler(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("result_session")?.value;
  if (token) await destroySession(token);

  const response = ok(null, "Logged out successfully");
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
});
