"use client";

import { useRouter } from "next/navigation";
import TeacherResultCompilationTab from "@/components/teacher/TeacherResultCompilationTab";

export default function TeacherResultCompilationPage() {
  const router = useRouter();

  return (
    <TeacherResultCompilationTab onBack={() => router.push("/teacher/evaluations")} />
  );
}
