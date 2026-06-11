import { NextRequest } from "next/server";
import { registerSchema } from "@/lib/schemas";
import { registerUser } from "@/services/auth-service";
import { ok, badRequest, conflict } from "@/lib/response";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    const user = await registerUser(email, password, name);

    return ok(
      { id: user.id, email: user.email, name: user.name },
      "Registration successful. Please check your email to verify your account."
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return badRequest(error.errors[0].message);
    }
    if (error instanceof Error && error.message === "Email already registered") {
      return conflict("Email already registered");
    }
    return badRequest("Registration failed");
  }
}
