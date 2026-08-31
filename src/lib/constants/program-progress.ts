import type { ProgramType } from '@/types';

export type ProgrammeProgressMode =
  | 'lga_coverage'
  | 'outcome_metric'
  | 'combined';

export const PROGRESS_MODE_OPTIONS: Array<{
  value: ProgrammeProgressMode;
  label: string;
  description: string;
}> = [
  {
    value: 'lga_coverage',
    label: 'LGA coverage',
    description:
      'Progress = target LGAs vs LGAs marked covered. Best for rollouts, surveillance zones, and infrastructure spread.',
  },
  {
    value: 'outcome_metric',
    label: 'Outcome count',
    description:
      'Progress = a numeric target you define (people trained, doses given, cases investigated). Geographic scope still uses target LGAs.',
  },
  {
    value: 'combined',
    label: 'Both LGA and outcome',
    description:
      'Track geographic rollout and a separate outcome metric — e.g. campaign in 15 LGAs aiming to vaccinate 50,000 children.',
  },
];

const DEFAULT_BY_TYPE: Record<ProgramType, ProgrammeProgressMode> = {
  campaign: 'combined',
  surveillance: 'lga_coverage',
  screening: 'combined',
  training: 'outcome_metric',
  infrastructure: 'lga_coverage',
  research: 'outcome_metric',
  other: 'combined',
};

export function defaultProgressModeForType(
  type: ProgramType | null | undefined,
): ProgrammeProgressMode {
  if (!type) return 'combined';
  return DEFAULT_BY_TYPE[type];
}

export function tracksLgaCoverage(mode: ProgrammeProgressMode | null | undefined): boolean {
  return mode === 'lga_coverage' || mode === 'combined';
}

export function tracksOutcomeMetric(
  mode: ProgrammeProgressMode | null | undefined,
): boolean {
  return mode === 'outcome_metric' || mode === 'combined';
}

export function lgaCoverageCounts(program: {
  targetLgas?: string[] | null;
  coveredLgas?: string[] | null;
  lgasCovered?: number | null;
}): { target: number; reach: number } {
  const target = program.targetLgas?.length ?? 0;
  const reach =
    program.coveredLgas?.length ?? program.lgasCovered ?? 0;
  return { target, reach };
}

export function lgaCoveragePercent(program: {
  targetLgas?: string[] | null;
  coveredLgas?: string[] | null;
  lgasCovered?: number | null;
}): number | null {
  const { target, reach } = lgaCoverageCounts(program);
  if (target <= 0) return null;
  return Math.min(100, Math.round((reach / target) * 100));
}

export function outcomeMetricPercent(program: {
  targetCount: number | null | undefined;
  reachCount: number | null | undefined;
}): number | null {
  if (
    program.targetCount == null ||
    program.targetCount <= 0 ||
    program.reachCount == null
  ) {
    return null;
  }
  return Math.min(
    100,
    Math.round((program.reachCount / program.targetCount) * 100),
  );
}

export function headlineProgressPercent(program: {
  progressMode?: ProgrammeProgressMode | null;
  targetLgas?: string[] | null;
  coveredLgas?: string[] | null;
  lgasCovered?: number | null;
  targetCount: number | null | undefined;
  reachCount: number | null | undefined;
}): number | null {
  return headlineProgressSummary(program).percent;
}

export function headlineProgressSummary(program: {
  progressMode?: ProgrammeProgressMode | null;
  primaryMetric?: string | null;
  targetLgas?: string[] | null;
  coveredLgas?: string[] | null;
  lgasCovered?: number | null;
  targetCount: number | null | undefined;
  reachCount: number | null | undefined;
}): { percent: number | null; basis: string | null } {
  const mode = program.progressMode ?? 'lga_coverage';
  const lgaPct = lgaCoveragePercent(program);
  const outcomePct = outcomeMetricPercent(program);
  const { target, reach } = lgaCoverageCounts(program);

  if (mode === 'combined') {
    if (outcomePct != null) {
      return {
        percent: outcomePct,
        basis: program.primaryMetric?.trim() || 'Outcome metric',
      };
    }
    if (lgaPct != null) {
      return {
        percent: lgaPct,
        basis: `${reach}/${target} LGAs covered`,
      };
    }
    return { percent: null, basis: null };
  }

  if (mode === 'outcome_metric') {
    return {
      percent: outcomePct,
      basis: program.primaryMetric?.trim() || 'Outcome metric',
    };
  }

  return {
    percent: lgaPct,
    basis: target > 0 ? `${reach}/${target} LGAs covered` : null,
  };
}
