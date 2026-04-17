export const KMB_CDI_LABELS = {
  name: 'K M-B CDI',
  vocabularyTitle: '어휘',
  grammarTitle: '문장과 문법',
  longestUtteranceTitle: '최근 가장 길게 표현한 문장',
  expressive: '표현',
  receptive: '수용',
  averageLevel: '평균 수준',
} as const;

export const KMB_CDI_NOTES = [
  '* 현재 FE 선검증 단계입니다. 결과 확인은 로컬 미리보기 기준으로 동작합니다.',
  '* 어휘 24개 범주의 표현/수용 점수를 모두 입력하면 총점이 자동 계산됩니다.',
  '* 문장과 문법 원점수는 상한 제한 없이 입력합니다.',
] as const;

export const KMB_CDI_VOCAB_CATEGORIES = [
  { key: 'sounds', id: 1, label: '소리', expressiveMax: 11, receptiveMax: 11 },
  { key: 'transportation', id: 2, label: '탈 것', expressiveMax: 13, receptiveMax: 13 },
  { key: 'toys_stationery', id: 3, label: '장난감 및 문구', expressiveMax: 14, receptiveMax: 14 },
  { key: 'animals', id: 4, label: '동물', expressiveMax: 41, receptiveMax: 41 },
  { key: 'clothes', id: 5, label: '옷', expressiveMax: 20, receptiveMax: 20 },
  { key: 'furniture_room', id: 6, label: '가구 및 방안', expressiveMax: 21, receptiveMax: 21 },
  { key: 'food', id: 7, label: '음식', expressiveMax: 58, receptiveMax: 58 },
  { key: 'body_parts', id: 8, label: '신체부위', expressiveMax: 31, receptiveMax: 31 },
  { key: 'household_items', id: 9, label: '가정용품', expressiveMax: 36, receptiveMax: 36 },
  { key: 'outside_objects', id: 10, label: '외부사물', expressiveMax: 26, receptiveMax: 26 },
  { key: 'daily_life', id: 11, label: '일상생활', expressiveMax: 14, receptiveMax: 14 },
  { key: 'places', id: 12, label: '장소', expressiveMax: 25, receptiveMax: 25 },
  { key: 'quantity_degree', id: 13, label: '양, 정도', expressiveMax: 14, receptiveMax: 14 },
  { key: 'people', id: 14, label: '사람', expressiveMax: 33, receptiveMax: 33 },
  { key: 'question_words', id: 15, label: '의문사', expressiveMax: 11, receptiveMax: 11 },
  { key: 'verbs', id: 16, label: '동사', expressiveMax: 150, receptiveMax: 150 },
  { key: 'adjectives', id: 17, label: '형용사', expressiveMax: 52, receptiveMax: 52 },
  { key: 'ending_words', id: 18, label: '끝맺는 말', expressiveMax: 15, receptiveMax: 15 },
  { key: 'josa', id: 19, label: '조사', expressiveMax: 12, receptiveMax: 12 },
  { key: 'connective_words', id: 20, label: '연결하는 말', expressiveMax: 6, receptiveMax: 6 },
  { key: 'location', id: 21, label: '위치', expressiveMax: 8, receptiveMax: 8 },
  { key: 'time', id: 22, label: '시간', expressiveMax: 17, receptiveMax: 17 },
  { key: 'pronouns', id: 23, label: '대명사', expressiveMax: 7, receptiveMax: 7 },
  { key: 'helper_words', id: 24, label: '돕는 말', expressiveMax: 6, receptiveMax: 6 },
] as const;

export type KmbCdiVocabCategoryKey = (typeof KMB_CDI_VOCAB_CATEGORIES)[number]['key'];

export interface KmbCdiVocabularyScore {
  expressive: number;
  receptive: number;
}

export type KmbCdiVocabularyPayload = Record<KmbCdiVocabCategoryKey, KmbCdiVocabularyScore>;

export const KMB_CDI_VOCAB_TOTALS = KMB_CDI_VOCAB_CATEGORIES.reduce(
  (acc, category) => ({
    expressiveMax: acc.expressiveMax + category.expressiveMax,
    receptiveMax: acc.receptiveMax + category.receptiveMax,
  }),
  { expressiveMax: 0, receptiveMax: 0 }
);

export const KMB_CDI_EXPRESSIVE_P50 = {
  male: {
    18: 60,
    19: 73,
    20: 89,
    21: 108,
    22: 129,
    23: 154,
    24: 182,
    25: 212,
    26: 245,
    27: 280,
    28: 316,
    29: 352,
    30: 387,
    31: 420,
    32: 451,
    33: 480,
    34: 505,
    35: 528,
    36: 547,
  },
  female: {
    18: 90,
    19: 109,
    20: 130,
    21: 154,
    22: 181,
    23: 211,
    24: 243,
    25: 277,
    26: 312,
    27: 347,
    28: 381,
    29: 414,
    30: 445,
    31: 474,
    32: 499,
    33: 522,
    34: 542,
    35: 559,
    36: 573,
  },
} as const;

export const KMB_CDI_GRAMMAR_P50 = [
  { ageFrom: 18, ageTo: 20, rawScore: 2 },
  { ageFrom: 21, ageTo: 23, rawScore: 7 },
  { ageFrom: 24, ageTo: 26, rawScore: 29 },
  { ageFrom: 27, ageTo: 29, rawScore: 44 },
  { ageFrom: 30, ageTo: 32, rawScore: 47 },
  { ageFrom: 33, ageTo: 35, rawScore: 54 },
] as const;

export const KMB_CDI_GRAMMAR_FEATURES = [
  {
    key: 'postposition',
    label: '조사',
    usedText: '‘엄마가, 아빠는, 나도’와 같은 조사를 명사 뒤에 붙여서 사용하고',
    notUsedText: '‘엄마가, 아빠는, 나도’와 같은 조사를 명사 뒤에 붙여서 사용하지 않고',
  },
  {
    key: 'final_ending',
    label: '종결어미',
    usedText: '‘먹어, 먹지, 먹네’와 같이 어미를 변화시키고',
    notUsedText: '‘먹어, 먹지, 먹네’와 같은 어미를 변화시키지 않고',
  },
  {
    key: 'connective_ending',
    label: '연결어미',
    usedText: '‘먹는 거, 먹어야 돼’와 같이 낱말과 낱말을 연결하기 위해 어미를 사용하고',
    notUsedText: '‘먹는 거, 먹어야 돼’와 같이 낱말과 낱말을 연결하기 위해 어미를 사용하지 않고',
  },
  {
    key: 'tense_ending',
    label: '어미',
    usedText: '‘먹은 거, 먹는 거, 먹을 거’와 같이 사건이 일어나는 때와 연관된 어미를 사용하고',
    notUsedText: '‘먹은 거, 먹는 거, 먹을 거’와 같이 사건이 일어나는 때와 연관된 어미를 사용하지 않고',
  },
  {
    key: 'passive_causative',
    label: '피동 사동',
    usedText: '‘먹여, 잡혔어, 신겨 줘’와 같이 피동형이나 사동형 접사를 사용하고',
    notUsedText: '‘먹여, 잡혔어, 신겨 줘’와 같이 피동형이나 사동형 접사를 사용하지 않고',
  },
] as const;

export type KmbCdiGrammarFeatureKey = (typeof KMB_CDI_GRAMMAR_FEATURES)[number]['key'];

export type KmbCdiGrammarFeatureStatus = 'used' | 'not_used' | null;

export type KmbCdiGrammarFeaturesPayload = Record<
  KmbCdiGrammarFeatureKey,
  KmbCdiGrammarFeatureStatus
>;

export interface KmbCdiToolInput {
  vocabulary: KmbCdiVocabularyPayload;
  grammarRawScore: number;
  grammarFeatures: KmbCdiGrammarFeaturesPayload;
  longestUtterance: string;
}

export interface KmbCdiToolData {
  vocabularyRows: Array<{
    id: number;
    label: string;
    expressiveScore: number;
    expressiveMax: number;
    receptiveScore: number;
    receptiveMax: number;
  }>;
  expressiveTotal: number;
  expressiveMax: number;
  receptiveTotal: number;
  receptiveMax: number;
  vocabularyNormText: string;
  vocabularyAgeText: string;
  vocabularySummaryText: string;
  grammarRawScore: number;
  grammarNormText: string;
  grammarAgeText: string;
  grammarSummaryText: string;
  usedGrammarLabels: string[];
  notUsedGrammarLabels: string[];
  grammarFeatures: Array<{
    key: string;
    label: string;
    status: KmbCdiGrammarFeatureStatus;
  }>;
  longestUtterance: string;
  longestUtteranceSummaryText: string;
}

export interface KmbCdiToolResult {
  text: string;
  data: KmbCdiToolData;
}
