"use client";

import { useMemo } from "react";
import { useTeacherAssignments } from "@/hooks/use-teacher-assignments";
import AllocationsTab from "@/components/admin/AllocationsTab";
import { AnimatePresence } from "motion/react";
import { Allocation } from "@/types/academic";

export default function AdminAllocationsPage() {
  const { data: assignmentsData = [] } = useTeacherAssignments();

  const allocations: Allocation[] = useMemo(() =>
    assignmentsData.map(a => ({
      id: a.id,
      teacher: a.user?.name ?? 'Teacher',
      title: a.user?.email ?? 'Instructor',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',
      classes: [a.gradeLevel],
      subjects: [a.academicYear?.name ?? 'Subject'],
      status: 'Active',
    })),
    [assignmentsData]
  );

  return (
    <AnimatePresence mode="wait">
      <AllocationsTab allocations={allocations} />
    </AnimatePresence>
  );
}
