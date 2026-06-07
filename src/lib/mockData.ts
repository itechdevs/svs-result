import { Student, EvaluationPlan, ReExam, Allocation } from '@/types/academic';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'UG-2024-8842',
    name: 'Julian Montgomery',
    rollNo: '042',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    status: 'Active Enrollment',
    class: 'Senior Year - Section B',
    attendance: '94.5% (High)',
    department: 'Computer Science',
    academicYear: '2023 - 2024',
    overallTotal: '463 / 550',
    overallPercent: 84.2,
    grade: 'A (Excellent)',
    resultStatus: 'PROMOTED',
    remarks: 'Consistently high performance across STEM subjects. Recommended for Advanced Placement Program.',
    scores: [
      { subject: 'Advanced Mathematics', type: 'Mid-Term Examination', obtained: 88, max: 100, pass: true },
      { subject: 'Data Structures & Algorithms', type: 'Practical Lab Assessment', obtained: 45, max: 50, pass: true },
      { subject: 'Quantum Physics', type: 'Theoretical Quiz', obtained: 18, max: 25, pass: true },
      { subject: 'Object Oriented Programming', type: 'Final Semester Exam', obtained: 92, max: 100, pass: true },
      { subject: 'Software Engineering', type: 'Project Submission', obtained: 76, max: 100, pass: true },
      { subject: 'Discrete Structures', type: 'Class Test 01', obtained: 38, max: 50, pass: true },
      { subject: 'Database Management', type: 'Final Semester Exam', obtained: 84, max: 100, pass: true },
      { subject: 'Web Technologies', type: 'Semester Viva Voce', obtained: 22, max: 25, pass: true }
    ],
    dist: { MATH: 88, PHYS: 72, CHEM: 64, BIO: 94, LIT: 70 }
  },
  {
    id: 'CS-2024-001',
    name: 'Aarav Sharma',
    rollNo: '001',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    status: 'Active Enrollment',
    class: 'Grade 10 - Section A',
    attendance: '98.1% (Exceptional)',
    department: 'Science & Technology',
    academicYear: '2023 - 2024',
    overallTotal: '504 / 600',
    overallPercent: 84.0,
    grade: 'A (Excellent)',
    resultStatus: 'PROMOTED',
    remarks: 'Exhibits robust logical understanding and excellent classroom participation.',
    scores: [
      { subject: 'Advanced Mathematics', type: 'Mid-Term Examination', obtained: 94, max: 100, pass: true },
      { subject: 'Theoretical Physics', type: 'Theoretical Quiz', obtained: 25, max: 30, pass: true },
      { subject: 'Organic Chemistry', type: 'Practical Lab Assessment', obtained: 17, max: 20, pass: true },
      { subject: 'Computational Biology', type: 'Project Submission', obtained: 29, max: 30, pass: true },
      { subject: 'World Literature', type: 'Final Semester Exam', obtained: 26, max: 30, pass: true },
      { subject: 'Academic English', type: 'Project Submission', obtained: 24, max: 30, pass: true }
    ],
    dist: { MATH: 94, PHYS: 83, CHEM: 85, BIO: 96, LIT: 80 }
  },
  {
    id: 'STU-2024-00892',
    name: 'Benjamin Sterling',
    rollNo: '002',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    status: 'Academic Probation',
    class: 'B.Tech - Year 2',
    attendance: '78.2% (Warning)',
    department: 'Engineering',
    academicYear: '2023 - 2024',
    overallTotal: '340 / 1000',
    overallPercent: 34.0,
    grade: 'F (Unsatisfactory)',
    resultStatus: 'PROBATION',
    remarks: 'Needs intensive mentorship. Recommended for urgent re-assessment and supplementary support.',
    scores: [
      { subject: 'Data Structures & Algorithms', type: 'Written Examination', obtained: 34, max: 100, pass: false, failedLOs: 3 },
      { subject: 'Discrete Mathematics', type: 'Theory Quiz', obtained: 42, max: 100, pass: true },
      { subject: 'Digital Logic Gates', type: 'Lab Assessment', obtained: 38, max: 50, pass: true }
    ],
    dist: { MATH: 34, PHYS: 42, CHEM: 40, BIO: 30, LIT: 55 }
  },
  {
    id: 'CS-2024-006',
    name: 'Elena Rodriguez',
    rollNo: '006',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    status: 'Active Enrollment',
    class: 'Grade 10 - Section A',
    attendance: '91.3% (Good)',
    academicYear: '2023 - 2024',
    department: 'Science & Technology',
    overallTotal: '450 / 600',
    overallPercent: 75.0,
    grade: 'B+',
    resultStatus: 'PROMOTED',
    remarks: 'Strong creative writing skills. Good team collaborator.',
    scores: [
      { subject: 'Advanced Mathematics', type: 'Mid-Term Examination', obtained: 78, max: 100, pass: true },
      { subject: 'Theoretical Physics', type: 'Theoretical Quiz', obtained: 22, max: 30, pass: true }
    ],
    dist: { MATH: 78, PHYS: 73, CHEM: 70, BIO: 82, LIT: 90 }
  }
];

export const INITIAL_EVALUATIONS: EvaluationPlan[] = [
  {
    id: 'eval-1',
    title: 'First term',
    subject: 'Science',
    status: 'Active',
    testTypes: '04 Test Types',
    outcomes: '12 Outcomes',
    fullMarks: 100,
    passMarks: 40,
    date: 'Oct 12, 2023',
    unit: 'Unit 2: Language Possession',
    learningOutcomes: [
      { name: 'Listening', text: 'Respond to rhymes and songs having simple structures and rhyming patterns.', regularRating: 4, afterSupportRating: null, regularDate: '2024-05-10', supportDate: '' },
      { name: 'Speaking (Ex-1)', text: 'Participate in a short and simple conversation for expressing possession.', regularRating: 3, afterSupportRating: null, regularDate: '2024-05-10', supportDate: '' },
      { name: 'Speaking (Ex-2)', text: 'Extract specific information (names and possession) from short and simple texts.', regularRating: 3, afterSupportRating: null, regularDate: '2024-05-10', supportDate: '' },
      { name: 'Reading', text: 'Recite a short and simple poem and guess the meaning of unfamiliar words.', regularRating: 4, afterSupportRating: null, regularDate: '2024-05-10', supportDate: '' },
      { name: 'Writing', text: 'Write a short simple thank you note/message to a friend.', regularRating: 3, afterSupportRating: null, regularDate: '2024-05-10', supportDate: '' }
    ]
  },
  {
    id: 'eval-2',
    title: 'Advanced Algebra Midterm',
    subject: 'Mathematics',
    status: 'Draft',
    testTypes: '02 Test Types',
    outcomes: '08 Outcomes',
    fullMarks: 150,
    passMarks: 60,
    date: 'Nov 05, 2023',
    unit: 'Unit 1: Linear Equations',
    learningOutcomes: [
      { name: 'Concept Application', text: 'Formulate and apply linear equations systems to real-world datasets.', regularRating: 2, afterSupportRating: null, regularDate: '2024-05-11', supportDate: '' },
      { name: 'Graphical Analysis', text: 'Plot variable pairs and calculate intercepts seamlessly.', regularRating: 3, afterSupportRating: null, regularDate: '2024-05-11', supportDate: '' }
    ]
  },
  {
    id: 'eval-3',
    title: 'Modern Classics Essay',
    subject: 'Literature',
    status: 'Completed',
    testTypes: '01 Test Types',
    outcomes: '05 Outcomes',
    fullMarks: 50,
    passMarks: 20,
    date: 'Oct 20, 2023',
    unit: 'Modern Epics',
    learningOutcomes: [
      { name: 'Thematic Analysis', text: 'Analyze primary classic narratives and evaluate tone variations.', regularRating: 4, afterSupportRating: 4, regularDate: '2024-05-08', supportDate: '2024-05-10' }
    ]
  },
  {
    id: 'eval-4',
    title: 'Quantum Mechanics Quiz',
    subject: 'Physics',
    status: 'Active',
    testTypes: '03 Test Types',
    outcomes: '09 Outcomes',
    fullMarks: 80,
    passMarks: 32,
    date: 'Dec 15, 2023',
    unit: 'Subatomic Physics',
    learningOutcomes: [
      { name: 'Wave Functions', text: 'Differentiate wave configurations and model localized energy densities.', regularRating: 3, afterSupportRating: null, regularDate: '2024-05-12', supportDate: '' }
    ]
  }
];

export const INITIAL_RE_EXAMS: ReExam[] = [
  {
    id: 're-1',
    name: 'Aiden Sterling',
    roll: '2024-DS-012',
    subject: 'Data Structures',
    outcome: 'Tree Traversal, Big O Analysis',
    prevMarks: '28 / 100',
    passMarks: 40,
    status: 'FAILED_CRITICAL',
    color: 'red',
    date: 'Oct 12, 2023',
    learningOutcomes: [
      { title: 'LO1: Complexity Analysis', desc: 'Big O notation, space complexity', weight: '30%', original: '12 / 30', current: 24, target: 30 },
      { title: 'LO2: Sorting Algorithms', desc: 'Quicksort, Mergesort implementation', weight: '40%', original: '15 / 40', current: 31, target: 40 },
      { title: 'LO3: Linked Lists & Trees', desc: 'Pointer manipulation, Traversals', weight: '30%', original: '07 / 30', current: 18, target: 30 }
    ]
  },
  {
    id: 're-2',
    name: 'Elena Rodriguez',
    roll: '2024-DS-088',
    subject: 'Data Structures',
    outcome: 'Heaps & Priority Queues',
    prevMarks: '35 / 100',
    passMarks: 40,
    status: 'UNSCHEDULED',
    color: 'orange',
    date: 'Oct 12, 2023',
    learningOutcomes: [
      { title: 'LO1: Heap Balancing', desc: 'Binary heap bubble configurations', weight: '50%', original: '15 / 50', current: 35, target: 50 },
      { title: 'LO2: Priority Allocation', desc: 'Priority queues elements selection', weight: '50%', original: '20 / 50', current: 38, target: 50 }
    ]
  },
  {
    id: 're-3',
    name: 'Julian Thorne',
    roll: '2024-DS-142',
    subject: 'Data Structures',
    outcome: 'Hash Table Collisions',
    prevMarks: '12 / 100',
    passMarks: 40,
    status: 'FAILED_CRITICAL',
    color: 'red',
    date: 'Oct 12, 2023',
    learningOutcomes: [
      { title: 'LO1: Hash Collisions', desc: 'Open addressing vs chaining comparison', weight: '100%', original: '12 / 100', current: 65, target: 100 }
    ]
  },
  {
    id: 're-4',
    name: 'Sarah Jenkins',
    roll: '2024-DS-056',
    subject: 'Data Structures',
    outcome: 'Graph Algorithms, Shortest Path',
    prevMarks: '38 / 100',
    passMarks: 40,
    status: 'SCHEDULED',
    color: 'green',
    date: 'Oct 12, 2023',
    learningOutcomes: [
      { title: 'LO1: Dijkstra Method', desc: 'Shortest path graph traversals', weight: '100%', original: '38 / 100', current: 78, target: 100 }
    ]
  }
];

export const INITIAL_ALLOCATIONS: Allocation[] = [
  { id: 'alloc-1', teacher: 'Sarah Jenkins', title: 'Senior Lecturer', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80', classes: ['Grade 10-A', 'Grade 11-B'], subjects: ['Mathematics', 'Physics'], status: 'Active' },
  { id: 'alloc-2', teacher: 'Michael Chen', title: 'HOD Science', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80', classes: ['Grade 12-C'], subjects: ['Quantum Physics'], status: 'Active' },
  { id: 'alloc-3', teacher: 'Amina Mensah', title: 'Assistant Teacher', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80', classes: ['Grade 09-B'], subjects: ['English Literature'], status: 'Inactive' },
  { id: 'alloc-4', teacher: 'David Rossi', title: 'Senior Lecturer', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80', classes: ['Grade 11-A'], subjects: ['World History'], status: 'Active' }
];
