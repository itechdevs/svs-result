'use client';

import React from 'react';
import { Student } from '@/types/academic';
import { MergedScore } from '@/lib/transcript-utils';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { GradeSheetPDF } from '@/components/shared/GradeSheetPDF';

import { useSchoolInformation } from '@/hooks/use-school-information';

interface Props {
  student: Student;
  mergedScoresList: MergedScore[];
  gpa: string;
  rank: number | string;
}

export default function TranscriptPDFContent({ student, mergedScoresList, gpa, rank }: Props) {
  const { school } = useSchoolInformation();

  return (
    <PDFDownloadLink
      document={
        <GradeSheetPDF
          student={student}
          mergedScoresList={mergedScoresList}
          gpa={gpa}
          rank={rank}
          schoolInfo={school}
        />
      }
      fileName={`GradeSheet_${student.name}_${student.rollNo}.pdf`}
    >
      {({ loading }: { loading: boolean }) => (
        <button className="px-6 py-2 bg-[#002045] text-white hover:bg-opacity-90 rounded font-bold shadow-sm cursor-pointer">
          {loading ? 'Preparing...' : 'Download PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
