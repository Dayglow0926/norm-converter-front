export type ApacSubtestKey = 'rawScore';
export type ApacImitationType = 'total' | 'partial' | '';

export const APAC_SUBTEST_KEYS: ApacSubtestKey[] = ['rawScore'];

export const APAC_SCORE_RANGE = {
  min: 0,
  max: 70,
} as const;

export const APAC_IMITATION_LABELS = {
  title: '시행 유형',
  direct: '직접 검사',
  directHint: '(기본)',
  total: '전체 모방',
  partial: '일부 모방',
  partialHint: '(시행 불가)',
  partialNotice: '일부 모방으로 시행하여 결과 해석이 제한됩니다. 원점수 입력 불필요.',
  scoreTitle: '오류 개수 (원점수)',
  scoreSuffix: '/ 70점',
} as const;

export const APAC_NOTES = [
  '* 원점수 = 오류 개수 (낮을수록 정확도 높음, 0-70)',
  '* 기본은 직접 검사 점수 입력, 모방 유형은 특이 상황에서만 선택',
  '* 연령 범위: 30개월 이상 (78개월 이상은 최고 연령 규준 적용)',
] as const;
