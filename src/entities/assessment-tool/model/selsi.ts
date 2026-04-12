export type SelsiSubtestKey = 'receptive' | 'expressive';
export type SelsiMetaSubtestKey = SelsiSubtestKey | 'combined';

export const SELSI_LABELS = {
  receptive: '수용언어',
  expressive: '표현언어',
  combined: '통합',
  combinedLanguage: '통합언어',
  subtestHeader: '하위검사',
  rawScoreHeader: '원점수',
  correctItemsHeader: '정반응 번호',
  wrongItemsHeader: '오반응 번호',
} as const;

export const SELSI_SCORE_LIMITS: Record<SelsiSubtestKey, { min: number; max: number }> = {
  receptive: { min: 0, max: 54 },
  expressive: { min: 0, max: 54 },
};

export const SELSI_REQUIRED_SUBTEST_KEYS: SelsiSubtestKey[] = ['receptive', 'expressive'];
export const SELSI_META_SUBTEST_KEYS: SelsiMetaSubtestKey[] = [
  ...SELSI_REQUIRED_SUBTEST_KEYS,
  'combined',
];

export const SELSI_ITEM_PLACEHOLDERS = {
  correct: '1, 2, 3-6',
  wrong: '7, 8, 9-12',
} as const;

export const SELSI_NOTES = [
  '* 원점수 범위: 수용/표현 각 0-54점, 통합 0-108점',
  '* 정반응/오반응 번호: 쉼표 또는 공백으로 구분, 범위는 "3-6" 형식으로 입력 (예: 1, 2, 3-6, 10 또는 1 2 3-6 10)',
] as const;
