export type ApacSubtestKey = 'rawScore';
export type ApacScoreVersion = 'standard' | 'revised' | 'untestable';
export type ApacAdministrationMode = 'direct' | 'partial_imitation' | 'total_imitation';
export type ApacErrorPatternSectionId = 'whole_word_process' | 'phoneme_change_3plus';

export interface ApacErrorPatternExampleInput {
  target: string;
  production: string;
}

export interface ApacErrorPatternSection {
  id: ApacErrorPatternSectionId;
  title: string;
  description: string;
}

export interface ApacErrorPatternOption {
  key: string;
  label: string;
  section: ApacErrorPatternSectionId;
}

export const APAC_SUBTEST_KEYS: ApacSubtestKey[] = ['rawScore'];

export const APAC_SCORE_RANGE = {
  min: 0,
  max: 70,
} as const;

export const APAC_SCORE_VERSION_LABELS = {
  title: '규준 선택',
  standard: '일반',
  revised: '개정',
  untestable: '시행불가',
  untestableNotice:
    '시행불가를 선택하면 현재와 동일하게 결과 해석이 제한된 상태로 처리합니다. 하위 시행 유형과 오류패턴 입력은 생략합니다.',
} as const;

export const APAC_ADMINISTRATION_LABELS = {
  title: '시행 유형',
  direct: '일반',
  directHint: '(기본)',
  partial: '일부 모방',
  total: '전체 모방',
  partialNotice: '일부는 자발적으로 산출했으나 대부분의 낱말은 모델링 후 모방으로 시행한 경우를 선택합니다.',
  totalNotice: '전체 문항을 모델링 후 모방으로 시행한 경우를 선택합니다.',
} as const;

export const APAC_INPUT_LABELS = {
  scoreTitle: '오류 개수 (원점수)',
  scoreSuffix: '/ 70점',
  errorPatternsTitle: '오류패턴',
  errorPatternsHint: '해당되는 오류패턴만 선택',
  errorPatternExampleTitle: '결과문 예시',
  errorPatternExampleHint:
    '예시 단어와 산출을 각각 입력하면 결과문에 `예: 단어→산출` 형식으로 반영됩니다.',
  errorPatternExampleTargetLabel: '예시 단어',
  errorPatternExampleTargetPlaceholder: '예: 침대',
  errorPatternExampleProductionLabel: '산출',
  errorPatternExampleProductionPlaceholder: '예: [친대]',
} as const;

export const APAC_ERROR_PATTERN_SECTIONS: ApacErrorPatternSection[] = [
  {
    id: 'whole_word_process',
    title: '음운변동',
    description: '전체단어 수준의 오류패턴',
  },
  {
    id: 'phoneme_change_3plus',
    title: '음소변화 변동',
    description: '3회 이상 출현한 음소변화 패턴',
  },
];

export const APAC_ERROR_PATTERNS: ApacErrorPatternOption[] = [
  {
    key: 'typical_medial_simplification',
    label: '전형적어중단순화',
    section: 'whole_word_process',
  },
  {
    key: 'reduplication_and_consonant_harmony',
    label: '반복·자음 조화',
    section: 'whole_word_process',
  },
  {
    key: 'word_final_coda_omission',
    label: '어말종성 생략',
    section: 'whole_word_process',
  },
  {
    key: 'atypical_medial_simplification',
    label: '비전형적 어중 단순화',
    section: 'whole_word_process',
  },
  {
    key: 'word_initial_onset_omission',
    label: '어두초성 생략',
    section: 'whole_word_process',
  },
  {
    key: 'epenthesis',
    label: '첨가',
    section: 'whole_word_process',
  },
  {
    key: 'metathesis',
    label: '도치이동',
    section: 'whole_word_process',
  },
  {
    key: 'interdentalization_of_alveolar_fricatives',
    label: '치조마찰음의 치간음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'stopping_of_affricates_and_fricatives',
    label: '파찰음·마찰음의 파열음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'affrication_and_palatalization',
    label: '파찰음화·구개음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'liquid_simplification',
    label: '유음의 단순화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'tensing_and_unaspiration',
    label: '긴장음화·탈기식음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'fronting_of_velars',
    label: '연구개음의 전설음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'liquid_nasalization_and_stopping',
    label: '유음의 비음화·파열음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'denasalization',
    label: '탈비음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'spirantization_of_affricates',
    label: '파찰음의 마찰음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'aspiration',
    label: '기식음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'laxing',
    label: '이완음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'lateralization_of_alveolar_fricatives',
    label: '치조마찰음의 설측음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'interdentalization_of_affricates',
    label: '파찰음의 치간음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'labialization',
    label: '양순음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'backing_to_velars',
    label: '연구개음화',
    section: 'phoneme_change_3plus',
  },
  {
    key: 'glottalization',
    label: '성문음화',
    section: 'phoneme_change_3plus',
  },
];

export const APAC_NOTES = [
  '* 최상위에서 일반 / 개정 / 시행불가 중 하나를 먼저 선택합니다.',
  '* 시행불가를 제외한 경우 하위 시행 유형과 오류 개수를 입력합니다.',
  '* 하위 `일부 모방`은 시행불가와 다른 독립 시행 유형입니다.',
  '* 오류패턴 선택값은 결과 문장 생성용 입력으로 사용됩니다.',
  '* 오류패턴별 예시는 비워둘 수 있으며, 입력한 경우에만 결과문에 포함됩니다.',
  '* 원점수 = 오류 개수 (낮을수록 정확도 높음, 0-70)',
  '* 연령 범위: 30개월 이상 (78개월 이상은 최고 연령 규준 적용)',
] as const;

export function isApacBackendCompatible(
  scoreVersion: ApacScoreVersion,
  administrationMode: ApacAdministrationMode
): boolean {
  void scoreVersion;
  void administrationMode;
  return true;
}

export function getApacBackendPendingReason(
  scoreVersion: ApacScoreVersion,
  administrationMode: ApacAdministrationMode
): string | null {
  void scoreVersion;
  void administrationMode;
  return null;
}
