// ─────────────────────────────────────────────
//  Grade Sheet — Shared Types
// ─────────────────────────────────────────────

import { SCHOOL_CONFIG } from '@/constants';

export interface Subject {
  name: string
  creditHourTheory?: number
  creditHourInternal?: number
  gpTheory: number
  gradeTheory: string
  gpInternal?: number
  gradeInternal?: string
  finalGrade: string
  remarks: string
  marksObtained?: number
  maxMarks?: number
}

export interface StudentResult {
  schoolName: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  /** Path or URL to school logo image */
  logo: string
  studentName: string
  rollNo: string
  grade: string
  nepaliYear: string
  englishYear: string
  issueDate: string
  issueDateAD: string
  gpa: number
  rank: number
  subjects: Subject[]
  examName?: string
  dateOfBirth?: string
  dateOfBirthAD?: string
}

export interface GradeInterval {
  sn: number
  interval: string
  grade: string
  gradePoint: string
  description: string
}

export const DEFAULT_GRADE_INTERVALS: GradeInterval[] = [
  { sn: 1, interval: '90 – 100',      grade: 'A+', gradePoint: '4.0', description: 'Outstanding'  },
  { sn: 2, interval: '80 – below 90', grade: 'A',  gradePoint: '3.6', description: 'Excellent'    },
  { sn: 3, interval: '70 – below 80', grade: 'B+', gradePoint: '3.2', description: 'Very Good'    },
  { sn: 4, interval: '60 – below 70', grade: 'B',  gradePoint: '2.8', description: 'Good'         },
  { sn: 5, interval: '50 – below 60', grade: 'C+', gradePoint: '2.4', description: 'Satisfactory' },
  { sn: 6, interval: '40 – below 50', grade: 'C',  gradePoint: '2.0', description: 'Acceptable'   },
  { sn: 7, interval: '35 – below 40', grade: 'D',  gradePoint: '1.6', description: 'Basic'        },
  { sn: 8, interval: '0 – below 35',  grade: 'NG', gradePoint: '–',   description: 'Not Graded'   },
]

/** Demo data — replace with real API/props in production */
export const DEMO_STUDENT: StudentResult = {
  schoolName:    SCHOOL_CONFIG.name,
  schoolAddress: SCHOOL_CONFIG.address,
  schoolPhone:   SCHOOL_CONFIG.phone,
  schoolEmail:   SCHOOL_CONFIG.emailAlt,
  logo:          SCHOOL_CONFIG.logo,
  studentName:   'RAM BAHADUR SHRESTHA',
  rollNo:        '07',
  grade:         'GRADE VIII',
  nepaliYear:    '2082',
  englishYear:   '2026',
  issueDate:     '2082-12-28',
  issueDateAD:   '2026-04-10',
  gpa:           3.58,
  rank:          3,
  subjects: [
    { name: 'ENGLISH',          creditHourTheory: 5, creditHourInternal: 2, gpTheory: 3.6, gradeTheory: 'A',  gpInternal: 4.0, gradeInternal: 'A+', finalGrade: 'A',  remarks: 'Excellent'   },
    { name: 'NEPALI',           creditHourTheory: 5, creditHourInternal: 2, gpTheory: 3.2, gradeTheory: 'B+', gpInternal: 3.6, gradeInternal: 'A',  finalGrade: 'B+', remarks: 'Very Good'   },
    { name: 'MATHEMATICS',      creditHourTheory: 5, creditHourInternal: 2, gpTheory: 4.0, gradeTheory: 'A+', gpInternal: 4.0, gradeInternal: 'A+', finalGrade: 'A+', remarks: 'Outstanding' },
    { name: 'SCIENCE',          creditHourTheory: 4, creditHourInternal: 2, gpTheory: 3.6, gradeTheory: 'A',  gpInternal: 3.6, gradeInternal: 'A',  finalGrade: 'A',  remarks: 'Excellent'   },
    { name: 'SAMAJIK',          creditHourTheory: 4, creditHourInternal: 2, gpTheory: 2.8, gradeTheory: 'B',  gpInternal: 3.2, gradeInternal: 'B+', finalGrade: 'B',  remarks: 'Good'        },
    { name: 'COMPUTER SCIENCE', creditHourTheory: 3, creditHourInternal: 2, gpTheory: 4.0, gradeTheory: 'A+', gpInternal: 4.0, gradeInternal: 'A+', finalGrade: 'A+', remarks: 'Outstanding' },
    { name: 'GENERAL KNOWLEDGE',creditHourTheory: 2, creditHourInternal: 1, gpTheory: 3.2, gradeTheory: 'B+', gpInternal: 3.2, gradeInternal: 'B+', finalGrade: 'B+', remarks: 'Very Good'   },
  ],
}
