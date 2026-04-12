export type Kcelf5OrsSubtestKey = 'listening' | 'speaking' | 'reading' | 'writing';

export interface Kcelf5OrsSubtestMeta {
  key: Kcelf5OrsSubtestKey;
  label: string;
  maxScore: number;
}

export const KCELF5_ORS_LABELS = {
  listening: '듣기',
  speaking: '말하기',
  reading: '읽기',
  writing: '쓰기',
  total: '총점',
} as const;

export const KCELF5_ORS_SUBTESTS: Kcelf5OrsSubtestMeta[] = [
  { key: 'listening', label: KCELF5_ORS_LABELS.listening, maxScore: 36 },
  { key: 'speaking', label: KCELF5_ORS_LABELS.speaking, maxScore: 76 },
  { key: 'reading', label: KCELF5_ORS_LABELS.reading, maxScore: 24 },
  { key: 'writing', label: KCELF5_ORS_LABELS.writing, maxScore: 24 },
];

export const KCELF5_ORS_SUBTEST_KEYS: Kcelf5OrsSubtestKey[] = KCELF5_ORS_SUBTESTS.map(
  ({ key }) => key
);

export const KCELF5_ORS_TOTAL_MAX = KCELF5_ORS_SUBTESTS.reduce(
  (sum, subtest) => sum + subtest.maxScore,
  0
);
