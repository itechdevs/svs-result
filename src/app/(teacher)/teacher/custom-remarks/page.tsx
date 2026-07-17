"use client";

import dynamic from "next/dynamic";

const TeacherCustomRemarksClient = dynamic(
  () => import("@/components/teacher/TeacherCustomRemarksClient"),
  { ssr: false },
);

export default function CustomRemarksPage() {
  return <TeacherCustomRemarksClient />;
}
