export type CplcSubtestKey =
  | 'discourse_management'
  | 'contextual_variation'
  | 'communication_intent'
  | 'nonverbal_communication';

export interface CplcSubtestMeta {
  key: CplcSubtestKey;
  formLabel: string;
  resultLabel: string;
  headerLabel: string;
  maxScore: number;
  itemMin: number;
  itemMax: number;
}

export const CPLC_RESULT_NOTE =
  '* 각 영역의 괄호 안 점수는 총점이고, 점수에서 괄호 안의 퍼센트는 점수를 백분율로 환산한 것임(대상자 점수/총점*100)';

export const CPLC_SUBTESTS: CplcSubtestMeta[] = [
  {
    key: 'discourse_management',
    formLabel: '담화관리',
    resultLabel: '담화관리',
    headerLabel: '담화관리\n(33점)',
    maxScore: 33,
    itemMin: 1,
    itemMax: 11,
  },
  {
    key: 'contextual_variation',
    formLabel: '상황에 따른 조절 및 적응',
    resultLabel: '상황에 따른 조절 및 적응',
    headerLabel: '상황에 따른 조절 및 적응\n(39점)',
    maxScore: 39,
    itemMin: 12,
    itemMax: 24,
  },
  {
    key: 'communication_intent',
    formLabel: '의사소통 의도 사용',
    resultLabel: '의사소통 의도',
    headerLabel: '의사소통 의도\n(45점)',
    maxScore: 45,
    itemMin: 25,
    itemMax: 39,
  },
  {
    key: 'nonverbal_communication',
    formLabel: '비언어적 의사소통',
    resultLabel: '비언어적 의사소통',
    headerLabel: '비언어적 의사소통\n(24점)',
    maxScore: 24,
    itemMin: 40,
    itemMax: 47,
  },
];

export const CPLC_SUBTEST_KEYS: CplcSubtestKey[] = CPLC_SUBTESTS.map(({ key }) => key);

export const CPLC_TOTAL = {
  label: '총점',
  headerLabel: '총점\n(141점)',
  maxScore: 141,
} as const;
