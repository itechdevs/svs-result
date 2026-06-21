export interface MergedScore {
  subject: string;
  obtained: number;
  max: number;
  percentage: number;
  grade: string;
  gp: string;
  remark: string;
}

const getGradeDetails = (percentage: number) => {
  if (percentage >= 90) return { grade: 'A+', gp: 4.0, remark: 'Outstanding' };
  if (percentage >= 80) return { grade: 'A', gp: 3.6, remark: 'Excellent' };
  if (percentage >= 70) return { grade: 'B+', gp: 3.2, remark: 'Very Good' };
  if (percentage >= 60) return { grade: 'B', gp: 2.8, remark: 'Good' };
  if (percentage >= 50) return { grade: 'C+', gp: 2.4, remark: 'Satisfactory' };
  if (percentage >= 40) return { grade: 'C', gp: 2.0, remark: 'Acceptable' };
  if (percentage >= 35) return { grade: 'D', gp: 1.6, remark: 'Basic' };
  return { grade: 'NG', gp: 0.0, remark: 'Not Graded' };
};

export function buildMergedScores(scores: any[]): MergedScore[] {
  const map: Record<string, { obtained: number; max: number }> = {};
  scores.forEach((s: any) => {
    const base = s.subject.replace(/\s*\((TH|IN|Theory|Internal|External)\)\s*$/i, '').trim();
    if (!map[base]) map[base] = { obtained: 0, max: 0 };
    map[base].obtained += s.obtained;
    map[base].max += s.max;
  });
  return Object.entries(map).map(([subject, data]) => {
    const pct = data.max > 0 ? (data.obtained / data.max) * 100 : 0;
    const g = getGradeDetails(pct);
    return {
      subject, obtained: data.obtained, max: data.max, percentage: pct,
      grade: g.grade, gp: g.gp === 0 ? '-' : g.gp.toFixed(1), remark: g.remark,
    };
  });
}

export function computeGpa(mergedScores: MergedScore[]): string {
  const vals = mergedScores
    .map(s => typeof s.gp === 'number' ? s.gp : parseFloat(s.gp as string))
    .filter(v => !isNaN(v));
  return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : '0.00';
}
