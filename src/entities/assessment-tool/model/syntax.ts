export type SyntaxSubtestKey = 'total';

export const SYNTAX_LABELS = {
  name: '구문의미이해력',
  testHeader: '검사',
  rawScoreHeader: '원점수',
} as const;

export const SYNTAX_SCORE_RANGE = {
  min: 0,
  max: 56,
} as const;

export const SYNTAX_SUBTEST_KEYS: SyntaxSubtestKey[] = ['total'];

export const SYNTAX_NOTES = [
  '* 원점수 범위: 0-56점',
  '* 연령 범위: 48-119개월 (4세~9세 11개월)',
] as const;
