import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function AdminResultCompilationPage() {
  redirect(ROUTES.ADMIN_EXAMS);
}
