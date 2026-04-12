export type ProblemSolvingSubtestKey =
  | 'cause_reason'
  | 'solution_inference'
  | 'clue_guessing';

export interface ProblemSolvingSubtestMeta {
  key: ProblemSolvingSubtestKey;
  label: string;
}

export const PROBLEM_SOLVING_LABELS = {
  causeReason: '원인이유',
  solutionInference: '해결추론',
  clueGuessing: '단서추측',
  total: '총점',
  rawScore: '원점수',
  percentile: '백분위수',
} as const;

export const PROBLEM_SOLVING_SUBTESTS: ProblemSolvingSubtestMeta[] = [
  { key: 'cause_reason', label: PROBLEM_SOLVING_LABELS.causeReason },
  { key: 'solution_inference', label: PROBLEM_SOLVING_LABELS.solutionInference },
  { key: 'clue_guessing', label: PROBLEM_SOLVING_LABELS.clueGuessing },
];

export const PROBLEM_SOLVING_SUBTEST_KEYS: ProblemSolvingSubtestKey[] =
  PROBLEM_SOLVING_SUBTESTS.map(({ key }) => key);
