"use client";

import { useAcademicContext } from "@/contexts/AcademicContext";
import ReExamPortalTab from "@/components/admin/ReExamPortalTab";
import { AnimatePresence } from "motion/react";

export default function TeacherReExamPage() {
  const {
    reExams,
    schedulingReExam, setSchedulingReExam,
    reExamDate, setReExamDate,
    reExamTime, setReExamTime,
    isLockedSchedule, setIsLockedSchedule,
    saveSuccessMessage, setSaveSuccessMessage,
    isSavingReExam, setIsSavingReExam,
  } = useAcademicContext();

  return (
    <AnimatePresence mode="wait">
      <ReExamPortalTab
        reExams={reExams}
        schedulingReExam={schedulingReExam}
        setSchedulingReExam={setSchedulingReExam}
        reExamDate={reExamDate}
        setReExamDate={setReExamDate}
        reExamTime={reExamTime}
        setReExamTime={setReExamTime}
        isLockedSchedule={isLockedSchedule}
        setIsLockedSchedule={setIsLockedSchedule}
        saveSuccessMessage={saveSuccessMessage}
        setSaveSuccessMessage={setSaveSuccessMessage}
        isSavingReExam={isSavingReExam}
        setIsSavingReExam={setIsSavingReExam}
      />
    </AnimatePresence>
  );
}
