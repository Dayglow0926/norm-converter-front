export type Kcelf5PpSubtestKey =
  | 'conversation_skills'
  | 'information_group'
  | 'nonverbal_skills';

export interface Kcelf5PpSubtestMeta {
  key: Kcelf5PpSubtestKey;
  label: string;
  maxScore: number;
}

export const KCELF5_PP_LABELS = {
  conversation: '대화기술',
  information: '정보요청,정보제공,정보에 응하기',
  nonverbal: '비언어적 대화기술',
  total: '총점',
} as const;

export const KCELF5_PP_SUBTESTS: Kcelf5PpSubtestMeta[] = [
  {
    key: 'conversation_skills',
    label: KCELF5_PP_LABELS.conversation,
    maxScore: 72,
  },
  {
    key: 'information_group',
    label: KCELF5_PP_LABELS.information,
    maxScore: 80,
  },
  {
    key: 'nonverbal_skills',
    label: KCELF5_PP_LABELS.nonverbal,
    maxScore: 48,
  },
];

export const KCELF5_PP_SUBTEST_KEYS: Kcelf5PpSubtestKey[] = KCELF5_PP_SUBTESTS.map(
  ({ key }) => key
);

export const KCELF5_PP_TOTAL_MAX = KCELF5_PP_SUBTESTS.reduce(
  (sum, subtest) => sum + subtest.maxScore,
  0
);
