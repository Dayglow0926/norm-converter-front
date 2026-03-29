import {
  COMMUNICATION_FUNCTION_CATEGORIES,
  type ChecklistItem,
  type SpontaneousInput,
  type SituationalObservation,
} from '../model/languageAnalysisStore';

export interface SpontaneousDraftResponse {
  draft: {
    analysisType: 'spontaneous_speech';
    spontaneous?: {
      mluW?: number;
      mluMax?: number;
      longestUtterance?: string;
      longestUtteranceStructure?: string;
      speakingSituation?: string;
      communicationFunctions?: string[];
      morphemes?: {
        particles?: string[];
        conjunctions?: string[];
        endings?: string[];
      };
      semanticErrors?: string;
      pragmatic?: string[];
      pragmaticExamples?: string;
      topicManagement?: string[];
      jointAttention?: string[];
      situationalObservations?: Array<{
        situation: string;
        observation: string;
        example?: string;
      }>;
    };
  };
  warnings: string[];
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim())));
}

function applyChecklistSelections(
  currentItems: ChecklistItem[],
  selectedEntries?: string[]
): ChecklistItem[] {
  if (!selectedEntries?.length) return currentItems;

  const selectedMap = new Map<ChecklistItem['label'], ChecklistItem['value']>();
  for (const entry of selectedEntries) {
    const match = entry.match(/^(.*)\((예|아니오)\)$/);
    if (!match) continue;
    selectedMap.set(match[1].trim(), match[2] === '예' ? 'positive' : 'negative');
  }

  return currentItems.map((item) =>
    selectedMap.has(item.label) ? { ...item, value: selectedMap.get(item.label) ?? item.value } : item
  );
}

function mergeCommunicationFunctions(
  current: SpontaneousInput['communicationFunctions'],
  extracted?: string[]
): SpontaneousInput['communicationFunctions'] {
  if (!extracted?.length) return current;

  const itemToCategory = new Map<string, string>();
  for (const category of COMMUNICATION_FUNCTION_CATEGORIES) {
    for (const item of category.items) {
      itemToCategory.set(item, category.category);
    }
  }

  const next: SpontaneousInput['communicationFunctions'] = { ...current };
  for (const item of extracted) {
    const category = itemToCategory.get(item);
    if (!category) continue;
    const items = next[category] ?? [];
    next[category] = unique([...items, item]);
  }

  return next;
}

function mergeObservations(
  current: SituationalObservation[],
  extracted?: Array<{ situation: string; observation: string; example?: string }>
): SituationalObservation[] {
  const manualObservations = current.filter((item) => !item.isGenerated);
  const generatedObservations =
    extracted?.map((item) => ({
      situation: item.situation,
      observation: item.observation,
      example: item.example ?? '',
      isGenerated: true,
    })) ?? [];

  return [...generatedObservations, ...manualObservations];
}

export function buildSpontaneousDraftUpdate(
  current: SpontaneousInput,
  extracted: SpontaneousDraftResponse['draft']['spontaneous'] | undefined,
  sourceText: string,
  warnings: string[]
): Partial<SpontaneousInput> {
  if (!extracted) {
    return {
      sourceText,
      extractionWarnings: warnings,
    };
  }

  const morphemes = extracted.morphemes
    ? {
        particles: unique([...current.morphemes.particles, ...(extracted.morphemes.particles ?? [])]),
        conjunctions: unique([
          ...current.morphemes.conjunctions,
          ...(extracted.morphemes.conjunctions ?? []),
        ]),
        endings: unique([...current.morphemes.endings, ...(extracted.morphemes.endings ?? [])]),
      }
    : current.morphemes;

  return {
    sourceText,
    extractionWarnings: warnings,
    ...(typeof extracted.mluW === 'number' ? { mluW: extracted.mluW } : {}),
    ...(typeof extracted.mluMax === 'number' ? { mluMax: extracted.mluMax } : {}),
    ...(extracted.longestUtterance ? { longestUtterance: extracted.longestUtterance } : {}),
    ...(extracted.longestUtteranceStructure
      ? { longestUtteranceStructure: extracted.longestUtteranceStructure }
      : {}),
    ...(extracted.speakingSituation ? { speakingSituation: extracted.speakingSituation } : {}),
    communicationFunctions: mergeCommunicationFunctions(
      current.communicationFunctions,
      extracted.communicationFunctions
    ),
    morphemes,
    semanticErrors: extracted.semanticErrors
      ? {
          enabled: true,
          examples: extracted.semanticErrors,
        }
      : current.semanticErrors,
    pragmatic: {
      items: applyChecklistSelections(current.pragmatic.items, extracted.pragmatic),
      examples: extracted.pragmaticExamples ?? current.pragmatic.examples,
    },
    topicManagement: applyChecklistSelections(current.topicManagement, extracted.topicManagement),
    jointAttention: applyChecklistSelections(current.jointAttention, extracted.jointAttention),
    situationalObservations: mergeObservations(
      current.situationalObservations,
      extracted.situationalObservations
    ),
  };
}
