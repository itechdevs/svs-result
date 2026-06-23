"use client";

import { useRouter, useSearchParams } from "next/navigation";
import TeacherResultCompilationTab from "@/components/teacher/TeacherResultCompilationTab";

export default function TeacherResultCompilationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <TeacherResultCompilationTab 
      onBack={() => {
        const query = searchParams.toString();
        router.push(`/teacher/evaluations${query ? `?${query}` : ''}`);
      }} 
    />
  );
}
