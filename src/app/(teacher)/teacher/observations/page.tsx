"use client";

import dynamic from "next/dynamic";

const TeacherObservationEntryClient = dynamic(
  () => import("@/components/teacher/TeacherObservationEntryClient"),
  { ssr: false },
);

export default function ObservationsPage() {
  return <TeacherObservationEntryClient />;
}
