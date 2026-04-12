export type PresSubtestKey = 'receptive' | 'expressive';

export const PRES_LABELS = {
  receptive: '수용언어',
  expressive: '표현언어',
  subtestHeader: '하위검사',
  rawScoreHeader: '원점수',
  correctItemsHeader: '정반응 번호',
  wrongItemsHeader: '오반응 번호',
} as const;

export const PRES_SCORE_LIMITS: Record<PresSubtestKey, { min: number; max: number }> = {
  receptive: { min: 1, max: 60 },
  expressive: { min: 1, max: 60 },
};

export const PRES_SUBTEST_KEYS: PresSubtestKey[] = ['receptive', 'expressive'];

export const PRES_ITEM_PLACEHOLDERS = {
  correct: '1, 2, 3-6',
  wrong: '7, 8, 9-12',
} as const;

export const PRES_NOTES = [
  '* 원점수 범위: 수용/표현 각 1-60점',
  '* 정반응/오반응 번호: 쉼표 또는 공백으로 구분, 범위는 "3-6" 형식으로 입력 (예: 1, 2, 3-6, 10 또는 1 2 3-6 10)',
  '* PRES는 성별 구분 없이 동일한 규준을 적용합니다',
] as const;
