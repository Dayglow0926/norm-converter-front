import {
  KMB_CDI_EXPRESSIVE_P50,
  KMB_CDI_GRAMMAR_FEATURES,
  KMB_CDI_GRAMMAR_P50,
  KMB_CDI_LABELS,
  KMB_CDI_VOCAB_CATEGORIES,
  KMB_CDI_VOCAB_TOTALS,
  type KmbCdiToolData,
  type KmbCdiToolInput,
} from '@/entities/assessment-tool';
import type { Gender } from '@/entities/child';
import type { KmbCdiGrammarState, KmbCdiVocabularyState } from '../model/kmbCdiStore';

export interface KmbCdiPreviewResult {
  summaryText: string;
  text: string;
  data: KmbCdiToolData;
}

export function calculateKmbCdiTotals(vocabulary: KmbCdiVocabularyState): {
  expressiveTotal: number;
  receptiveTotal: number;
} {
  return KMB_CDI_VOCAB_CATEGORIES.reduce(
    (acc, category) => {
      const current = vocabulary[category.key];
      return {
        expressiveTotal: acc.expressiveTotal + (current?.expressive ?? 0),
        receptiveTotal: acc.receptiveTotal + (current?.receptive ?? 0),
      };
    },
    { expressiveTotal: 0, receptiveTotal: 0 }
  );
}

export function isKmbCdiComplete(input: {
  vocabulary: KmbCdiVocabularyState;
  grammarRawScore: number | null;
  longestUtterance: string;
}): boolean {
  const vocabComplete = KMB_CDI_VOCAB_CATEGORIES.every((category) => {
    const current = input.vocabulary[category.key];
    return current?.expressive !== null && current?.receptive !== null;
  });

  return vocabComplete && input.grammarRawScore !== null && input.longestUtterance.trim().length > 0;
}

export function getKmbCdiVocabularyAgeText(score: number, gender: Gender): string {
  const points = Object.entries(KMB_CDI_EXPRESSIVE_P50[gender]).map(([month, value]) => ({
    month: Number(month),
    value,
  }));

  const first = points[0];
  const last = points[points.length - 1];

  if (score < first.value) {
    return `${first.month}개월 평균 미만 수준`;
  }

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[index + 1];

    if (score === current.value) {
      return `${current.month}개월 평균 수준`;
    }

    if (next && score > current.value && score < next.value) {
      return `${current.month}~${next.month}개월 평균 수준`;
    }
  }

  if (score > last.value) {
    return `${last.month}개월 평균 이상 수준`;
  }

  return `${last.month}개월 평균 수준`;
}

export function getKmbCdiGrammarAgeText(rawScore: number): string {
  const CLOSE_GRAMMAR_BAND_GAP = 3;
  const first = KMB_CDI_GRAMMAR_P50[0];
  const last = KMB_CDI_GRAMMAR_P50[KMB_CDI_GRAMMAR_P50.length - 1];

  if (rawScore < first.rawScore) {
    return `${first.ageFrom}~${first.ageTo}개월 평균 미만 수준`;
  }

  for (let index = 0; index < KMB_CDI_GRAMMAR_P50.length; index += 1) {
    const current = KMB_CDI_GRAMMAR_P50[index];
    const next = KMB_CDI_GRAMMAR_P50[index + 1];
    const following = KMB_CDI_GRAMMAR_P50[index + 2];

    if (rawScore === current.rawScore) {
      return `${current.ageFrom}~${current.ageTo}개월 평균 수준`;
    }

    if (next && rawScore > current.rawScore && rawScore < next.rawScore) {
      const shouldMergeNextBands =
        following && following.rawScore - next.rawScore <= CLOSE_GRAMMAR_BAND_GAP;

      if (shouldMergeNextBands) {
        return `${next.ageFrom}~${following.ageTo}개월 평균 수준`;
      }

      return `${next.ageFrom}~${next.ageTo}개월 평균 수준`;
    }
  }

  if (rawScore > last.rawScore) {
    return `${last.ageFrom}~${last.ageTo}개월 평균 이상 수준`;
  }

  return `${last.ageFrom}~${last.ageTo}개월 평균 수준`;
}

function getRequiredScore(value: number | null, path: string): number {
  if (value === null) {
    throw new Error(`${path} is required for K M-B CDI payload.`);
  }

  return value;
}

export function buildKmbCdiToolInput(input: {
  vocabulary: KmbCdiVocabularyState;
  grammarRawScore: number;
  grammarFeatures: KmbCdiGrammarState;
  longestUtterance: string;
}): KmbCdiToolInput {
  const vocabulary = KMB_CDI_VOCAB_CATEGORIES.reduce((acc, category) => {
    acc[category.key] = {
      expressive: getRequiredScore(
        input.vocabulary[category.key]?.expressive ?? null,
        `${category.key}.expressive`
      ),
      receptive: getRequiredScore(
        input.vocabulary[category.key]?.receptive ?? null,
        `${category.key}.receptive`
      ),
    };

    return acc;
  }, {} as KmbCdiToolInput['vocabulary']);

  return {
    vocabulary,
    grammarRawScore: input.grammarRawScore,
    grammarFeatures: { ...input.grammarFeatures },
    longestUtterance: input.longestUtterance.trim(),
  };
}

function getVocabularyNormText(gender: Gender): string {
  return `${gender === 'male' ? '남아' : '여아'} 표현낱말 수 50백분위 기준`;
}

function formatLabelList(labels: string[]): string {
  return labels.join(', ');
}

function buildGrammarSummary(grammarFeatures: KmbCdiGrammarState): {
  usedLabels: string[];
  notUsedLabels: string[];
  summaryText: string;
} {
  const usedLabels = KMB_CDI_GRAMMAR_FEATURES.filter(
    (feature) => grammarFeatures[feature.key] === 'used'
  ).map((feature) => feature.label);
  const notUsedLabels = KMB_CDI_GRAMMAR_FEATURES.filter(
    (feature) => grammarFeatures[feature.key] === 'not_used'
  ).map((feature) => feature.label);

  if (usedLabels.length === 0 && notUsedLabels.length === 0) {
    return {
      usedLabels,
      notUsedLabels,
      summaryText: '세부 문법 항목은 별도로 보고되지 않았음.',
    };
  }

  if (usedLabels.length > 0 && notUsedLabels.length > 0) {
    return {
      usedLabels,
      notUsedLabels,
      summaryText:
        `세부 문법 항목 중 ${formatLabelList(usedLabels)} 항목을 사용하고, ` +
        `${formatLabelList(notUsedLabels)} 항목은 사용하지 않는 것으로 보고되었음.`,
    };
  }

  if (usedLabels.length > 0) {
    return {
      usedLabels,
      notUsedLabels,
      summaryText: `세부 문법 항목 중 ${formatLabelList(usedLabels)} 항목을 사용하는 것으로 보고되었음.`,
    };
  }

  return {
    usedLabels,
    notUsedLabels,
    summaryText:
      `세부 문법 항목 중 ${formatLabelList(notUsedLabels)} 항목은 아직 사용하지 않는 것으로 보고되었음.`,
  };
}

export function buildKmbCdiPreviewResult(input: {
  gender: Gender;
  toolInput: KmbCdiToolInput;
}): KmbCdiPreviewResult {
  const { expressiveTotal, receptiveTotal } = calculateKmbCdiTotals(input.toolInput.vocabulary);
  const vocabularyNormText = getVocabularyNormText(input.gender);
  const vocabularyAgeText = getKmbCdiVocabularyAgeText(expressiveTotal, input.gender);
  const vocabularySummaryText =
    `전체 ${KMB_CDI_VOCAB_TOTALS.receptiveMax}개 어휘 중 ${receptiveTotal}개를 이해하고 ` +
    `${expressiveTotal}개를 일관적으로 사용하고 있는 것으로 보고되었음. ` +
    `표현 총점은 ${expressiveTotal}점으로 ${vocabularyNormText} ${vocabularyAgeText}에 해당함.`;
  const grammarNormText = '문장과 문법 50백분위 기준';
  const grammarAgeText = getKmbCdiGrammarAgeText(input.toolInput.grammarRawScore);
  const grammarSummary = buildGrammarSummary(input.toolInput.grammarFeatures);
  const grammarSummaryText =
    `원점수는 ${input.toolInput.grammarRawScore}점으로 ${grammarNormText} ${grammarAgeText}에 해당함. ` +
    grammarSummary.summaryText;
  const longestUtterance = input.toolInput.longestUtterance.trim();
  const longestUtteranceSummaryText = `“${longestUtterance}”`;
  const summaryText =
    `${KMB_CDI_LABELS.name}(유아용): 표현 총점 ${expressiveTotal}점, 수용 총점 ${receptiveTotal}점이며 ` +
    `어휘는 ${vocabularyNormText} ${vocabularyAgeText}, 문장과 문법은 원점수 ${input.toolInput.grammarRawScore}점으로 ` +
    `${grammarNormText} ${grammarAgeText}에 해당함.`;

  const text = [
    `${KMB_CDI_LABELS.name}(유아용)`,
    `${KMB_CDI_LABELS.vocabularyTitle}\n${vocabularySummaryText}`,
    `${KMB_CDI_LABELS.grammarTitle}\n${grammarSummaryText}`,
    `${KMB_CDI_LABELS.longestUtteranceTitle}\n${longestUtteranceSummaryText}`,
  ].join('\n\n');

  return {
    summaryText,
    text,
    data: {
      vocabularyRows: KMB_CDI_VOCAB_CATEGORIES.map((category) => ({
        id: category.id,
        label: category.label,
        expressiveScore: input.toolInput.vocabulary[category.key]?.expressive ?? 0,
        expressiveMax: category.expressiveMax,
        receptiveScore: input.toolInput.vocabulary[category.key]?.receptive ?? 0,
        receptiveMax: category.receptiveMax,
      })),
      expressiveTotal,
      expressiveMax: KMB_CDI_VOCAB_TOTALS.expressiveMax,
      receptiveTotal,
      receptiveMax: KMB_CDI_VOCAB_TOTALS.receptiveMax,
      vocabularyNormText,
      vocabularyAgeText,
      vocabularySummaryText,
      grammarRawScore: input.toolInput.grammarRawScore,
      grammarNormText,
      grammarAgeText,
      grammarSummaryText,
      usedGrammarLabels: grammarSummary.usedLabels,
      notUsedGrammarLabels: grammarSummary.notUsedLabels,
      grammarFeatures: KMB_CDI_GRAMMAR_FEATURES.map((feature) => ({
        key: feature.key,
        label: feature.label,
        status: input.toolInput.grammarFeatures[feature.key],
      })),
      longestUtterance,
      longestUtteranceSummaryText,
    },
  };
}
