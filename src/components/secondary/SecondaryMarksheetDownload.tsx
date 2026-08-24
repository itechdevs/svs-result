'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SecondaryTermMarksheetPDF } from './SecondaryTermMarksheetPDF';
import { SecondaryAnnualMarksheetPDF } from './SecondaryAnnualMarksheetPDF';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSecondaryGrade } from '@/lib/secondary-grades';

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
    thCreditHours: number;
    prCreditHours: number;
    totalCreditHours: number;
    internalMarks: number;
    theoryMarks: number;
    practicalMarks: number;
    totalObtained: number;
    totalFullMarks: number;
    gradePoint: number;
    grade: string;
    isNG: boolean;
    thGrade?: string;
    thGP?: number;
    prGrade?: string;
    prGP?: number;
    subjectCode?: string;
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
    thCreditHours: number;
    prCreditHours: number;
    totalCreditHours: number;
    weightedTotalObtained: number;
    weightedTotalFull: number;
    percentage: number;
    gradePoint: number;
    grade: string;
    isNG: boolean;
    thGrade?: string;
    thGP?: number;
    prGrade?: string;
    prGP?: number;
    subjectCode?: string;
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

import { useSchoolInformation } from '@/hooks/use-school-information';

export function SecondaryMarksheetDownload({
  data,
  variant = 'button'
}: SecondaryMarksheetDownloadProps) {
  const { school } = useSchoolInformation();

  const fileName = data.type === 'term'
    ? `Term_Marksheet_${data.student.name}_${data.student.rollNumber}.pdf`
    : `Annual_Transcript_${data.student.name}_${data.student.rollNumber}.pdf`;

  const document = data.type === 'term'
    ? <SecondaryTermMarksheetPDF data={data} schoolInfo={school} />
    : <SecondaryAnnualMarksheetPDF data={data} schoolInfo={school} />;

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
    subjectResults: (subjectResults || []).map(sr => {
      const components = sr?.subjectConfig?.components || [];
      const thComp = components.find((c: any) => c.type === 'THEORY');
      const prComp = components.find((c: any) => c.type === 'PRACTICAL');

      const thCH = thComp ? Number(thComp.creditHour) : 0;
      const prCH = prComp ? Number(prComp.creditHour) : 0;

      const thFull = thComp ? Number(thComp.fullMarks) : null;
      const prFull = prComp ? Number(prComp.fullMarks) : null;

      const thObtained = sr?.theoryMarks != null ? Number(sr.theoryMarks) : null;
      const prObtained = sr?.practicalMarks != null ? Number(sr.practicalMarks) : null;

      let thGradeStr, thGPNum, prGradeStr, prGPNum;

      if (thObtained !== null && thFull) {
        const pct = (thObtained / thFull) * 100;
        const scale = getSecondaryGrade(pct);
        thGradeStr = scale.grade;
        thGPNum = scale.gradePoint;
      }

      if (prObtained !== null && prFull) {
        const pct = (prObtained / prFull) * 100;
        const scale = getSecondaryGrade(pct);
        prGradeStr = scale.grade;
        prGPNum = scale.gradePoint;
      }

      const finalGrade = sr?.grade || 'N/A';
      const effectiveFinalGrade = thGradeStr === 'NG' || prGradeStr === 'NG' ? 'NG' : finalGrade;
      const effectiveIsNG = effectiveFinalGrade === 'NG';
      const effectiveGP = thComp ? (thGPNum || 0) : Number(sr?.gradePoint || 0);

      return {
        subject: sr?.subjectConfig?.syncedSubject?.name || 'Unknown Subject',
        subjectCode: sr?.subjectConfig?.syncedSubject?.code || '',
        thCreditHours: thCH,
        prCreditHours: prCH,
        totalCreditHours: sr?.creditHours || 0,
        internalMarks: Number(sr?.internalMarks || 0),
        theoryMarks: Number(sr?.theoryMarks || 0),
        practicalMarks: Number(sr?.practicalMarks || 0),
        totalObtained: Number(sr?.totalObtained || 0),
        totalFullMarks: Number(sr?.totalFullMarks || 0),
        gradePoint: effectiveIsNG ? 0 : effectiveGP,
        grade: effectiveFinalGrade,
        isNG: effectiveIsNG,
        thGrade: thGradeStr,
        thGP: thGPNum,
        prGrade: prGradeStr,
        prGP: prGPNum,
      };
    }),
    totalSubjects: termResult?.totalSubjects || 0,
    passedSubjects: termResult?.passedSubjects || 0,
    ngSubjects: termResult?.ngSubjects || 0,
    totalCreditHours: termResult?.totalCreditHours || 0,
    gpa: Number(termResult?.gpa || 0),
    resultStatus: termResult?.resultStatus || 'PENDING',
    generatedDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
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
    subjectResults: (subjectResults || []).map(sr => {
      const components = sr?.subjectConfig?.components || [];
      const thComp = components.find((c: any) => c.type === 'THEORY');
      const prComp = components.find((c: any) => c.type === 'PRACTICAL');

      const thCH = thComp ? Number(thComp.creditHour) : 0;
      const prCH = prComp ? Number(prComp.creditHour) : 0;

      const thFull = thComp ? Number(thComp.fullMarks) : null;
      const prFull = prComp ? Number(prComp.fullMarks) : null;

      // In annual, theoryMarks and practicalMarks are not always stored at the top level
      // but if we are blending them, we might not have raw obtained vs full easily available.
      // However, if we do have theoryMarks/practicalMarks:
      const thObtained = sr?.theoryMarks != null ? Number(sr.theoryMarks) : null;
      const prObtained = sr?.practicalMarks != null ? Number(sr.practicalMarks) : null;

      // Fetch from componentDetails if available
      const compDetails = sr?.componentDetails || [];
      const thComponentData = compDetails.find((c: any) => c.type === 'THEORY');
      const prComponentData = compDetails.find((c: any) => c.type === 'PRACTICAL');

      let thGradeStr, thGPNum, prGradeStr, prGPNum;

      if (thComponentData) {
        thGradeStr = thComponentData.grade;
        thGPNum = thComponentData.gradePoint;
      } else if (thObtained !== null && thFull) {
        // Fallback
        const pct = (thObtained / thFull) * 100;
        const scale = getSecondaryGrade(pct);
        thGradeStr = scale.grade;
        thGPNum = scale.gradePoint;
      }

      if (prComponentData) {
        prGradeStr = prComponentData.grade;
        prGPNum = prComponentData.gradePoint;
      } else if (prObtained !== null && prFull) {
        // Fallback
        const pct = (prObtained / prFull) * 100;
        const scale = getSecondaryGrade(pct);
        prGradeStr = scale.grade;
        prGPNum = scale.gradePoint;
      }

      const finalGrade = sr?.grade || 'N/A';
      const effectiveFinalGrade = finalGrade;
      const effectiveIsNG = sr?.isNG === true || finalGrade === 'NG';
      const effectiveGP = Number(sr?.gradePoint || 0);

      return {
        subject: sr?.subjectConfig?.syncedSubject?.name || 'Unknown Subject',
        subjectCode: sr?.subjectConfig?.syncedSubject?.code || '',
        thCreditHours: thCH,
        prCreditHours: prCH,
        totalCreditHours: sr?.creditHours || 0,
        weightedTotalObtained: Number(sr?.weightedTotalObtained || 0),
        weightedTotalFull: Number(sr?.weightedTotalFull || 0),
        percentage: Number(sr?.percentage || 0),
        gradePoint: effectiveIsNG ? 0 : effectiveGP,
        grade: effectiveFinalGrade,
        isNG: effectiveIsNG,
        thGrade: thGradeStr,
        thGP: thGPNum,
        prGrade: prGradeStr,
        prGP: prGPNum,
      };
    }),
    totalSubjects: annualResult?.totalSubjects || 0,
    passedSubjects: annualResult?.passedSubjects || 0,
    ngSubjects: annualResult?.ngSubjects || 0,
    totalCreditHours: annualResult?.totalCreditHours || 0,
    gpa: Number(annualResult?.gpa || 0),
    resultStatus: annualResult?.resultStatus || 'PENDING',
    classRank: annualResult?.classRank || undefined,
    generatedDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    remarks: annualResult.remarks || undefined,
  };
}
