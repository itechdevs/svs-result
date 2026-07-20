import * as XLSX from 'xlsx';
import { EvaluationPlan } from '@/types/academic';
import { StudentEvaluationResult } from '@/hooks/use-evaluations';

function parseTaskType(rawName: string): string {
  const newFormat = rawName.match(/^\[[^\]]+\]\[([^\]]+)\]/);
  if (newFormat) return newFormat[1];
  const legacyFormat = rawName.match(/^\[([^\]]+)\]/);
  if (legacyFormat) return legacyFormat[1];
  return 'Standard';
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
  });
}

/**
 * Exports selected evaluation plans to a .xlsx with two clean sheets:
 *
 * Sheet 1 – "Plans & Tasks"
 *   One row per task. Plan-level fields (subject, class, marks, status)
 *   are carried across each task row so the sheet is self-contained and
 *   sortable/filterable without cross-referencing.
 *
 * Sheet 2 – "Student Results"
 *   One row per student × task with marks detail, plus per-plan totals
 *   (total obtained, full marks, %) appended as context columns.
 *   Sorting by Student Name + Plan gives you a natural grade-book view.
 */
export function exportEvaluationsToExcel(
  evaluations: EvaluationPlan[],
  teacherName: string,
  studentResults: StudentEvaluationResult[],
): void {
  const workbook = XLSX.utils.book_new();

  // ─── Sheet 1: Plans & Tasks ───────────────────────────────────────────────
  const s1Headers = [
    'Plan Title', 'Subject', 'Class', 'Section', 'Unit', 'Status',
    'Task Name', 'Task Type',
    'Full Marks', 'Pass Marks', 'Weightage', 'Scheduled Date',
  ];

  const s1Rows: (string | number)[][] = [];
  for (const ev of evaluations) {
    const subs = ev.subEvaluations ?? [];
    const planBase = [
      ev.title,
      ev.subject,
      ev.gradeLevel ?? '',
      ev.section ?? '',
      ev.unit ?? '',
      ev.status,
    ];

    if (subs.length === 0) {
      // No tasks yet — show the plan with blanks for task columns
      s1Rows.push([...planBase, '', '', ev.fullMarks, ev.passMarks, '', ev.date]);
    } else {
      for (const sub of subs) {
        s1Rows.push([
          ...planBase,
          sub.name,
          parseTaskType(sub.name),
          sub.fullMarks,
          sub.passMarks,
          sub.weightage,
          sub.scheduledDate ? fmtDate(sub.scheduledDate) : 'TBD',
        ]);
      }
    }
  }

  const s1Sheet = XLSX.utils.aoa_to_sheet([s1Headers, ...s1Rows]);
  s1Sheet['!cols'] = [
    { wch: 26 }, { wch: 18 }, { wch: 12 }, { wch: 9 }, { wch: 20 }, { wch: 10 },
    { wch: 34 }, { wch: 16 },
    { wch: 11 }, { wch: 11 }, { wch: 10 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, s1Sheet, 'Plans & Tasks');

  // ─── Sheet 2: Student Results ─────────────────────────────────────────────
  // Build a lookup: templateId → parent EvaluationPlan
  const templateToPlan = new Map<string, EvaluationPlan>();
  for (const ev of evaluations) {
    for (const id of ev.templateIds ?? []) templateToPlan.set(id, ev);
  }

  // Pre-aggregate plan totals per student so they appear on each task row
  // Key: `${studentId}::${planId}` → { totalObtained, totalFull, allPassed, anyAbsent }
  type PlanAgg = { totalObtained: number; totalFull: number; allPassed: boolean | null; anyAbsent: boolean };
  const planAgg = new Map<string, PlanAgg>();

  for (const r of studentResults) {
    const plan = templateToPlan.get(r.evaluationTemplateId);
    if (!plan) continue;
    const key = `${r.syncedStudentId}::${plan.id}`;
    if (!planAgg.has(key)) planAgg.set(key, { totalObtained: 0, totalFull: 0, allPassed: null, anyAbsent: false });
    const agg = planAgg.get(key)!;
    agg.totalFull += Number(r.evaluationTemplate?.fullMarks ?? 0);
    if (r.isAbsent) {
      agg.anyAbsent = true;
    } else if (r.marksObtained !== null && r.marksObtained !== undefined) {
      agg.totalObtained += Number(r.marksObtained);
    }
    if (r.isPassed !== null) {
      agg.allPassed = agg.allPassed === null ? r.isPassed : agg.allPassed && r.isPassed;
    }
  }

  const s2Headers = [
    // Student identity
    'Student Name', 'Roll No', 'Class', 'Section',
    // Plan context
    'Plan Title', 'Subject',
    // Task detail
    'Task Type', 'Full Marks', 'Obtained', 'Absent', 'Pass/Fail', 'Status',
    // Plan-level totals (context columns — same value for all rows of same student×plan)
    'Plan Total', 'Plan Full', '% Score', 'Overall Result',
  ];

  const s2Rows: (string | number)[][] = studentResults
    .filter(r => templateToPlan.has(r.evaluationTemplateId))
    .sort((a, b) => {
      const nameA = a.syncedStudent?.name ?? '';
      const nameB = b.syncedStudent?.name ?? '';
      if (nameA !== nameB) return nameA.localeCompare(nameB);
      const planA = templateToPlan.get(a.evaluationTemplateId)?.title ?? '';
      const planB = templateToPlan.get(b.evaluationTemplateId)?.title ?? '';
      return planA.localeCompare(planB);
    })
    .map(r => {
      const plan = templateToPlan.get(r.evaluationTemplateId)!;
      const tpl  = r.evaluationTemplate;
      const key  = `${r.syncedStudentId}::${plan.id}`;
      const agg  = planAgg.get(key) ?? { totalObtained: 0, totalFull: 0, allPassed: null, anyAbsent: false };

      const pct = agg.totalFull > 0
        ? Math.round((agg.totalObtained / agg.totalFull) * 10000) / 100
        : 0;

      const overall = agg.anyAbsent
        ? 'Absent'
        : agg.allPassed === null ? 'Pending'
        : agg.allPassed ? 'Pass' : 'Fail';

      return [
        r.syncedStudent?.name ?? '',
        r.syncedStudent?.rollNumber ?? '',
        r.syncedStudent?.class ?? plan.gradeLevel ?? '',
        r.syncedStudent?.section ?? plan.section ?? '',
        plan.title,
        plan.subject,
        parseTaskType(tpl?.name ?? ''),
        Number(tpl?.fullMarks ?? 0),
        r.isAbsent ? 'Absent' : (r.marksObtained ?? '—'),
        r.isAbsent ? 'Yes' : 'No',
        r.isPassed === null ? '—' : r.isPassed ? 'Pass' : 'Fail',
        r.status,
        agg.totalObtained,
        agg.totalFull,
        pct,
        overall,
      ];
    });

  const s2Sheet = XLSX.utils.aoa_to_sheet([s2Headers, ...s2Rows]);
  s2Sheet['!cols'] = [
    { wch: 22 }, { wch: 9 }, { wch: 12 }, { wch: 9 },
    { wch: 26 }, { wch: 18 },
    { wch: 16 }, { wch: 11 }, { wch: 10 }, { wch: 7 }, { wch: 10 }, { wch: 11 },
    { wch: 12 }, { wch: 10 }, { wch: 9 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(workbook, s2Sheet, 'Student Results');

  // ─── Download ─────────────────────────────────────────────────────────────
  const safe = teacherName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${safe}_Evaluations_${date}.xlsx`);
}
