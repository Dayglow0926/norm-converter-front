export type RevtSubtestKey = 'receptive' | 'expressive';

export const REVT_LABELS = {
  receptive: '수용어휘',
  expressive: '표현어휘',
  subtestHeader: '하위검사',
  rawScoreHeader: '원점수',
  correctItemsHeader: '정반응 번호',
  wrongItemsHeader: '오반응 번호',
} as const;

export const REVT_SCORE_RANGE = {
  min: 7,
  max: 175,
} as const;

export const REVT_SUBTEST_KEYS: RevtSubtestKey[] = ['receptive', 'expressive'];

export const REVT_ITEM_PLACEHOLDERS = {
  correct: '1, 2, 3-6',
  wrong: '7, 8, 9-12',
} as const;

export const REVT_NOTES = [
  '* 원점수 범위: 수용/표현 각 7-175점',
  '* 정반응/오반응 번호: 쉼표 또는 공백으로 구분, 범위는 "3-6" 형식으로 입력 (예: 1, 2, 3-6, 10 또는 1 2 3-6 10)',
  '* REVT는 성별 구분 없이 동일한 규준을 적용합니다',
] as const;
