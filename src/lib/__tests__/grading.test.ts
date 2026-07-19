import { describe, it, expect } from 'vitest';
import {
  calcEffectiveMark,
  calcObtainedMarks,
  calcFullMarks,
  calcPercentage,
  calcStudentGrade,
  calcReExamStatus,
  calcResultStatus,
  OutcomeInput,
} from '../grading';

const passing: OutcomeInput = { regularMark: 15, reExamMark: null, passMarks: 10, fullMarks: 25 };
const failing: OutcomeInput = { regularMark: 5, reExamMark: null, passMarks: 10, fullMarks: 25 };
const reExamPassed: OutcomeInput = { regularMark: 5, reExamMark: 18, passMarks: 10, fullMarks: 25 };
const reExamFailed: OutcomeInput = { regularMark: 5, reExamMark: 7, passMarks: 10, fullMarks: 25 };
const notEntered: OutcomeInput = { regularMark: null, reExamMark: null, passMarks: 10, fullMarks: 25 };

describe('calcEffectiveMark', () => {
  it('returns regularMark when reExamMark is null', () => {
    expect(calcEffectiveMark(15, null)).toBe(15);
  });

  it('returns regularMark when reExamMark is undefined', () => {
    expect(calcEffectiveMark(15, undefined)).toBe(15);
  });

  it('returns max of regularMark and reExamMark when both are set', () => {
    expect(calcEffectiveMark(10, 18)).toBe(18);
    expect(calcEffectiveMark(18, 10)).toBe(18);
  });

  it('returns reExamMark when regularMark is null', () => {
    expect(calcEffectiveMark(null, 15)).toBe(15);
  });

  it('returns null when both marks are null/undefined', () => {
    expect(calcEffectiveMark(null, null)).toBeNull();
    expect(calcEffectiveMark(undefined, null)).toBeNull();
  });
});

describe('calcObtainedMarks', () => {
  it('sums effective marks across outcomes', () => {
    const result = calcObtainedMarks([passing, passing]);
    expect(result).toBe(30);
  });

  it('uses max of re-exam and regular', () => {
    const result = calcObtainedMarks([reExamPassed, passing]);
    expect(result).toBe(33); // 18 + 15
  });

  it('excludes null marks', () => {
    const result = calcObtainedMarks([passing, notEntered]);
    expect(result).toBe(15);
  });

  it('returns 0 for all null marks', () => {
    const result = calcObtainedMarks([notEntered]);
    expect(result).toBe(0);
  });

  it('returns 0 for empty array', () => {
    const result = calcObtainedMarks([]);
    expect(result).toBe(0);
  });
});

describe('calcFullMarks', () => {
  it('sums full marks across outcomes', () => {
    const result = calcFullMarks([passing, failing, reExamPassed]);
    expect(result).toBe(75);
  });

  it('returns 0 for empty array', () => {
    const result = calcFullMarks([]);
    expect(result).toBe(0);
  });
});

describe('calcPercentage', () => {
  it('calculates percentage correctly', () => {
    expect(calcPercentage(36, 50)).toBe(72);
  });

  it('returns 0 for 0 full marks', () => {
    expect(calcPercentage(10, 0)).toBe(0);
  });

  it('handles 100%', () => {
    expect(calcPercentage(50, 50)).toBe(100);
  });

  it('handles 0%', () => {
    expect(calcPercentage(0, 50)).toBe(0);
  });
});

describe('calcStudentGrade', () => {
  describe('Overall pass', () => {
    it('marks all above passMarks -> pass', () => {
      const grade = calcStudentGrade([passing, passing]);
      expect(grade.isPassed).toBe(true);
      expect(grade.hasFailure).toBe(false);
      expect(grade.obtainedMarks).toBe(30);
      expect(grade.fullMarks).toBe(50);
      expect(grade.percentage).toBe(60);
      expect(grade.anyEntered).toBe(true);
      expect(grade.allEntered).toBe(true);
    });

    it('100% marks -> pass', () => {
      const full = { regularMark: 25, reExamMark: null, passMarks: 10, fullMarks: 25 };
      const grade = calcStudentGrade([full]);
      expect(grade.isPassed).toBe(true);
      expect(grade.percentage).toBe(100);
    });

    it('0% marks still counts as fail if below passMarks', () => {
      const zero = { regularMark: 0, reExamMark: null, passMarks: 10, fullMarks: 25 };
      const grade = calcStudentGrade([zero]);
      expect(grade.isPassed).toBe(false);
      expect(grade.hasFailure).toBe(true);
    });
  });

  describe('Overall fail', () => {
    it('marks below passMarks -> fail', () => {
      const grade = calcStudentGrade([failing]);
      expect(grade.isPassed).toBe(false);
      expect(grade.hasFailure).toBe(true);
      expect(grade.originallyFailedCount).toBe(1);
    });

    it('multiple failing outcomes -> fail', () => {
      const grade = calcStudentGrade([failing, failing]);
      expect(grade.isPassed).toBe(false);
      expect(grade.hasFailure).toBe(true);
      expect(grade.originallyFailedCount).toBe(2);
    });
  });

  describe('Component-wise fail', () => {
    it('one passes, one fails -> fail', () => {
      const grade = calcStudentGrade([passing, failing]);
      expect(grade.isPassed).toBe(false);
      expect(grade.hasFailure).toBe(true);
      expect(grade.originallyFailedIndices).toEqual([1]);
    });
  });

  describe('Re-exam remediation', () => {
    it('re-exam brings failing mark above pass -> pass', () => {
      const grade = calcStudentGrade([reExamPassed]);
      expect(grade.isPassed).toBe(true);
      expect(grade.hasFailure).toBe(false);
      expect(grade.originallyFailedCount).toBe(1);
      expect(grade.reExamGivenCount).toBe(1);
    });

    it('re-exam still below passMarks -> fail', () => {
      const grade = calcStudentGrade([reExamFailed]);
      expect(grade.isPassed).toBe(false);
      expect(grade.hasFailure).toBe(true);
      expect(grade.originallyFailedCount).toBe(1);
      expect(grade.reExamGivenCount).toBe(1);
    });

    it('mixed: one re-exam passes, the other still fails -> fail', () => {
      const grade = calcStudentGrade([reExamPassed, failing]);
      expect(grade.isPassed).toBe(false);
      expect(grade.hasFailure).toBe(true);
      expect(grade.originallyFailedCount).toBe(2);
      expect(grade.reExamGivenCount).toBe(1);
    });
  });

  describe('Partial entry', () => {
    it('no marks entered -> Pending', () => {
      const grade = calcStudentGrade([notEntered]);
      expect(grade.isPassed).toBe(false);
      expect(grade.anyEntered).toBe(false);
      expect(grade.allEntered).toBe(false);
    });

    it('some marks entered -> Pending (allEntered=false)', () => {
      const grade = calcStudentGrade([passing, notEntered]);
      expect(grade.allEntered).toBe(false);
      expect(grade.anyEntered).toBe(true);
      expect(grade.isPassed).toBe(false); // not all entered → not passed
    });
  });

  describe('Borderline pass', () => {
    it('exactly at passMarks -> pass', () => {
      const borderline: OutcomeInput = { regularMark: 10, reExamMark: null, passMarks: 10, fullMarks: 25 };
      const grade = calcStudentGrade([borderline]);
      expect(grade.isPassed).toBe(true);
      expect(grade.hasFailure).toBe(false);
    });

    it('just below passMarks -> fail', () => {
      const barelyFail: OutcomeInput = { regularMark: 9.5, reExamMark: null, passMarks: 10, fullMarks: 25 };
      const grade = calcStudentGrade([barelyFail]);
      expect(grade.isPassed).toBe(false);
      expect(grade.hasFailure).toBe(true);
    });
  });
});

describe('calcReExamStatus', () => {
  it('none when no outcomes originally failed', () => {
    const grade = calcStudentGrade([passing, passing]);
    expect(calcReExamStatus(grade)).toBe('none');
  });

  it('needed when outcomes failed and no re-exam given', () => {
    const grade = calcStudentGrade([failing]);
    expect(calcReExamStatus(grade)).toBe('needed');
  });

  it('partial when some re-exams given but not all', () => {
    const grade = calcStudentGrade([failing, failing]);
    // Grade: originallyFailedIndices=[0,1], reExamGivenCount=0 (no re-exam marks)
    // We need a scenario where some have re-exam marks and some don't
    const mixed = calcStudentGrade([reExamPassed, failing]);
    expect(calcReExamStatus(mixed)).toBe('partial');
  });

  it('given when all failed outcomes have re-exam', () => {
    const grade = calcStudentGrade([reExamPassed, reExamPassed]);
    expect(calcReExamStatus(grade)).toBe('given');
  });

  it('given even when re-exam failed (attempt was made)', () => {
    const grade = calcStudentGrade([reExamFailed]);
    expect(calcReExamStatus(grade)).toBe('given');
  });
});

describe('calcResultStatus', () => {
  it('Pending when no marks entered', () => {
    const grade = calcStudentGrade([notEntered]);
    expect(calcResultStatus(grade)).toBe('Pending');
  });

  it('Pending when partial marks entered', () => {
    const grade = calcStudentGrade([passing, notEntered]);
    expect(calcResultStatus(grade)).toBe('Pending');
  });

  it('Pass when all pass', () => {
    const grade = calcStudentGrade([passing, passing]);
    expect(calcResultStatus(grade)).toBe('Pass');
  });

  it('Fail when any fails', () => {
    const grade = calcStudentGrade([failing]);
    expect(calcResultStatus(grade)).toBe('Fail');
  });
});

describe('Consistency requirements', () => {
  it('PASS + re-exam "needed" never occur together', () => {
    const allPass = [passing, passing];
    const passAfterReExam = [reExamPassed];
    const borderline = [
      { regularMark: 10, reExamMark: null, passMarks: 10, fullMarks: 25 } as OutcomeInput,
    ];

    for (const outcomes of [allPass, passAfterReExam, borderline]) {
      const grade = calcStudentGrade(outcomes);
      const status = calcResultStatus(grade);
      const reExam = calcReExamStatus(grade);
      if (status === 'Pass') {
        expect(reExam).not.toBe('needed');
      }
    }
  });

  it('FAIL + re-exam "none" never occur together', () => {
    const allFail = [failing];
    const mixedFail = [passing, failing];

    for (const outcomes of [allFail, mixedFail]) {
      const grade = calcStudentGrade(outcomes);
      const status = calcResultStatus(grade);
      const reExam = calcReExamStatus(grade);
      if (status === 'Fail') {
        expect(reExam).not.toBe('none');
      }
    }
  });

  it('PASS when re-exam remediates all failures', () => {
    const grade = calcStudentGrade([reExamPassed]);
    expect(calcResultStatus(grade)).toBe('Pass');
    expect(calcReExamStatus(grade)).not.toBe('needed');
  });
});
