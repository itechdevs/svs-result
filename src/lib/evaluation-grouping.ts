/**
 * Shared evaluation-plan grouping helpers.
 *
 * Teacher-created evaluation templates encode their plan identity in the
 * template name:
 *
 *   [EvalTitle|UnitTitle|batchId][TaskType] OutcomeName   (new)
 *   [EvalTitle|UnitTitle][TaskType] OutcomeName            (legacy, no batch)
 *   [TaskType] OutcomeName                                (legacy simple)
 *
 * Every "Save Evaluation Plan" click stamps ONE batchId shared by all
 * templates it creates, so a brand-new evaluation saved with the SAME
 * visible title always forms its own group instead of merging into the
 * previous evaluation's card.
 *
 * Grouping key (used by every list/detail view):
 *   gradeConfigId :: syncedSubjectId :: examId :: evalTitle :: unitTitle :: batchId
 */

export interface ParsedEvaluationName {
  /** Visible evaluation title, e.g. "E.V.S Writing" */
  evalTitle: string;
  /** Teacher-defined unit/topic title, e.g. "Unit 3" */
  unitTitle: string;
  /** Per-save unique token. "" for legacy templates created before batching. */
  batchId: string;
  /** Raw content inside the first [...] bracket (evalTitle|unitTitle|batchId) */
  rawEvalPart: string;
}

const EVAL_PART_RE = /^\[([^\]]+)\]\[/;

/** Parse `[EvalTitle|UnitTitle|batchId]` from a template name. Never throws. */
export function parseEvaluationName(
  name: string,
  fallbackSubject = "",
): ParsedEvaluationName & { planTitle: string } {
  const m = name.match(EVAL_PART_RE);
  const rawEvalPart = m ? m[1] : "";
  const [evalTitleRaw = "", unitTitleRaw = "", batchIdRaw = ""] =
    rawEvalPart.split("|");
  const evalTitle = (evalTitleRaw ?? "").trim();
  const unitTitle = (unitTitleRaw ?? "").trim();
  const batchId = (batchIdRaw ?? "").trim();
  return {
    evalTitle,
    unitTitle,
    batchId,
    rawEvalPart,
    planTitle: evalTitle || fallbackSubject,
  };
}

export interface GroupableTemplate {
  id: string;
  name: string;
  // Optional: views that already filter to one subject/exam (e.g. the admin
  // exam compilation, which only ever sees this exam's templates) may pass a
  // partial shape. Keys are only ever compared within a single view, so a
  // constant-missing field is harmless there.
  gradeConfigId?: string | null;
  syncedSubjectId?: string | null;
  examId?: string | null;
}

/**
 * Full grouping key. Two templates belong to the same evaluation card
 * (plan) iff their keys are equal.
 */
export function getEvaluationGroupKey(t: GroupableTemplate): string {
  const { evalTitle, unitTitle, batchId } = parseEvaluationName(t.name);
  return [
    t.gradeConfigId ?? "",
    t.syncedSubjectId ?? "",
    t.examId ?? "no-exam",
    evalTitle,
    unitTitle,
    batchId,
  ].join("::");
}

export function isSameEvaluationGroup(
  a: GroupableTemplate,
  b: GroupableTemplate,
): boolean {
  return getEvaluationGroupKey(a) === getEvaluationGroupKey(b);
}

/** Group templates by evaluation plan. Preserves insertion order. */
export function groupEvaluationTemplates<T extends GroupableTemplate>(
  templates: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const t of templates) {
    const key = getEvaluationGroupKey(t);
    const list = groups.get(key);
    if (list) list.push(t);
    else groups.set(key, [t]);
  }
  return groups;
}

/**
 * Find every template in `all` that belongs to the same evaluation plan
 * as `base` (same grade config + subject + exam + title + unit + batch).
 */
export function findGroupSiblings<T extends GroupableTemplate>(
  base: T,
  all: T[],
): T[] {
  const key = getEvaluationGroupKey(base);
  return all.filter((t) => getEvaluationGroupKey(t) === key);
}

/**
 * Find names that appear more than once (exact match, as the DB unique
 * constraint sees them). Used to block saves where two criteria rows would
 * build the same stored template name — the DB would otherwise either
 * silently merge them (upsert on create) or throw a 500 unique violation
 * (rename on edit).
 */
export function findDuplicateEvaluationNames(names: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const n of names) {
    if (seen.has(n)) dupes.add(n);
    else seen.add(n);
  }
  return [...dupes];
}

/** One unique token per "Save Evaluation Plan" click. URL/bracket safe. */
export function generateEvaluationBatchId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Build the stored template name for one outcome row.
 * Always embeds the batchId so re-saving the same visible title
 * creates a fresh, separately-grouped evaluation plan.
 */
export function buildEvaluationName(
  evalTitle: string,
  unitTitle: string,
  batchId: string,
  taskType: string,
  outcomeName: string,
): string {
  const title = (evalTitle ?? "").trim();
  const unit = (unitTitle ?? "").trim();
  const batch = (batchId ?? "").trim();
  const prefix = batch ? `${title}|${unit}|${batch}` : `${title}|${unit}`;
  return `[${prefix}][${(taskType ?? "").trim()}] ${(outcomeName ?? "").trim()}`;
}
