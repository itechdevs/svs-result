'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SecondaryTermMarksheetPDF } from './SecondaryTermMarksheetPDF';
import { SecondaryAnnualMarksheetPDF } from './SecondaryAnnualMarksheetPDF';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TermMarksheetData {
  type: 'term';
  student: {
    name: string;
    rollNumber: string;
    section: string;
    gradeLevel: string;
  };
  exam: {
    name: string;
  };
  academicYear: {
    name: string;
  };
  subjectResults: Array<{
    subject: string;
    creditHours: number;
    theoryMarks: number;
    practicalMarks: number;
    totalObtained: number;
    totalFullMarks: number;
    gradePoint: number;
    grade: string;
    isNG: boolean;
  }>;
  totalSubjects: number;
  passedSubjects: number;
  ngSubjects: number;
  totalCreditHours: number;
  gpa: number;
  resultStatus: 'PROMOTED' | 'NG_BLOCKED';
  generatedDate: string;
}

interface AnnualMarksheetData {
  type: 'annual';
  student: {
    name: string;
    rollNumber: string;
    section: string;
    gradeLevel: string;
  };
  academicYear: {
    name: string;
  };
  subjectResults: Array<{
    subject: string;
    creditHours: number;
    weightedTotalObtained: number;
    weightedTotalFull: number;
    percentage: number;
    gradePoint: number;
    grade: string;
    isNG: boolean;
  }>;
  totalSubjects: number;
  passedSubjects: number;
  ngSubjects: number;
  totalCreditHours: number;
  gpa: number;
  resultStatus: 'PROMOTED' | 'NG_BLOCKED';
  classRank?: number;
  generatedDate: string;
  remarks?: string;
}

type SecondaryMarksheetData = TermMarksheetData | AnnualMarksheetData;

interface SecondaryMarksheetDownloadProps {
  data: SecondaryMarksheetData;
  variant?: 'button' | 'icon';
}

export function SecondaryMarksheetDownload({ 
  data, 
  variant = 'button' 
}: SecondaryMarksheetDownloadProps) {
  const fileName = data.type === 'term'
    ? `Term_Marksheet_${data.student.name}_${data.student.rollNumber}.pdf`
    : `Annual_Transcript_${data.student.name}_${data.student.rollNumber}.pdf`;

  const document = data.type === 'term' 
    ? <SecondaryTermMarksheetPDF data={data} />
    : <SecondaryAnnualMarksheetPDF data={data} />;

  return (
    <PDFDownloadLink
      document={document}
      fileName={fileName}
    >
      {({ loading }: { loading: boolean }) => (
        variant === 'button' ? (
          <Button
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download {data.type === 'term' ? 'Term Marksheet' : 'Annual Transcript'}
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            className="text-xs"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <FileText className="w-3 h-3" />
            )}
          </Button>
        )
      )}
    </PDFDownloadLink>
  );
}

// Helper function to prepare data from API response
export function prepareTermMarksheetData(
  termResult: any,
  subjectResults: any[]
): TermMarksheetData {
  return {
    type: 'term',
    student: {
      name: termResult?.syncedStudent?.name || 'Unknown Student',
      rollNumber: termResult?.syncedStudent?.rollNumber || 'N/A',
      section: termResult?.syncedStudent?.section || 'N/A',
      gradeLevel: termResult?.exam?.gradeLevel || 'N/A',
    },
    exam: {
      name: termResult?.exam?.name || 'Unknown Exam',
    },
    academicYear: {
      name: termResult?.academicYear?.name || 'Unknown Year',
    },
    subjectResults: (subjectResults || []).map(sr => ({
      subject: sr?.subjectConfig?.syncedSubject?.name || 'Unknown Subject',
      creditHours: sr?.creditHours || 0,
      theoryMarks: Number(sr?.theoryMarks || 0),
      practicalMarks: Number(sr?.practicalMarks || 0),
      totalObtained: Number(sr?.totalObtained || 0),
      totalFullMarks: Number(sr?.totalFullMarks || 0),
      gradePoint: Number(sr?.gradePoint || 0),
      grade: sr?.grade || 'N/A',
      isNG: sr?.isNG || false,
    })),
    totalSubjects: termResult?.totalSubjects || 0,
    passedSubjects: termResult?.passedSubjects || 0,
    ngSubjects: termResult?.ngSubjects || 0,
    totalCreditHours: termResult?.totalCreditHours || 0,
    gpa: Number(termResult?.gpa || 0),
    resultStatus: termResult?.resultStatus || 'PENDING',
    generatedDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
  };
}

export function prepareAnnualMarksheetData(
  annualResult: any,
  subjectResults: any[]
): AnnualMarksheetData {
  return {
    type: 'annual',
    student: {
      name: annualResult?.syncedStudent?.name || 'Unknown Student',
      rollNumber: annualResult?.syncedStudent?.rollNumber || 'N/A',
      section: annualResult?.syncedStudent?.section || 'N/A',
      gradeLevel: annualResult?.syncedStudent?.class || 'N/A',
    },
    academicYear: {
      name: annualResult?.academicYear?.name || 'Unknown Year',
    },
    subjectResults: (subjectResults || []).map(sr => ({
      subject: sr?.subjectConfig?.syncedSubject?.name || 'Unknown Subject',
      creditHours: sr?.creditHours || 0,
      weightedTotalObtained: Number(sr?.weightedTotalObtained || 0),
      weightedTotalFull: Number(sr?.weightedTotalFull || 0),
      percentage: Number(sr?.percentage || 0),
      gradePoint: Number(sr?.gradePoint || 0),
      grade: sr?.grade || 'N/A',
      isNG: sr?.isNG || false,
    })),
    totalSubjects: annualResult?.totalSubjects || 0,
    passedSubjects: annualResult?.passedSubjects || 0,
    ngSubjects: annualResult?.ngSubjects || 0,
    totalCreditHours: annualResult?.totalCreditHours || 0,
    gpa: Number(annualResult?.gpa || 0),
    resultStatus: annualResult?.resultStatus || 'PENDING',
    classRank: annualResult?.classRank || undefined,
    generatedDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    remarks: annualResult.remarks || undefined,
  };
}
