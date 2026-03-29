import type {
  BehavioralObservationInput,
  ChecklistItem,
  ConversationInput,
  SituationalObservation,
} from '../model/languageAnalysisStore';

export interface ConversationDraftResponse {
  draft: {
    analysisType: 'conversation';
    conversation?: {
      pragmatic?: string[];
      topicManagement?: string[];
      communicationIntents?: string[];
      situationalObservations?: Array<{
        situation: string;
        observation: string;
        example?: string;
      }>;
      notes?: string;
    };
  };
  warnings: string[];
}

export interface BehavioralDraftResponse {
  draft: {
    analysisType: 'behavioral_observation';
    behavioral?: {
      communicationIntents?: string[];
      jointAttention?: string[];
      gestures?: string[];
      vocalSpontaneous?: string;
      vocalImitation?: string;
      pragmatic?: string[];
      namingResponse?: 'consistent' | 'inconsistent' | 'none';
      followingInstructions?: string;
      symbolicBehavior?: string;
      situationalObservations?: Array<{
        situation: string;
        observation: string;
        example?: string;
      }>;
      notes?: string;
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

export function buildConversationDraftUpdate(
  current: ConversationInput,
  extracted: ConversationDraftResponse['draft']['conversation'] | undefined,
  sourceText: string,
  warnings: string[]
): Partial<ConversationInput> {
  if (!extracted) {
    return { sourceText, extractionWarnings: warnings };
  }

  return {
    sourceText,
    extractionWarnings: warnings,
    pragmatic: applyChecklistSelections(current.pragmatic, extracted.pragmatic),
    topicManagement: applyChecklistSelections(current.topicManagement, extracted.topicManagement),
    communicationIntents: unique([
      ...current.communicationIntents,
      ...(extracted.communicationIntents ?? []),
    ]),
    situationalObservations: mergeObservations(
      current.situationalObservations,
      extracted.situationalObservations
    ),
    notes: extracted.notes ?? current.notes,
  };
}

export function buildBehavioralDraftUpdate(
  current: BehavioralObservationInput,
  extracted: BehavioralDraftResponse['draft']['behavioral'] | undefined,
  sourceText: string,
  warnings: string[]
): Partial<BehavioralObservationInput> {
  if (!extracted) {
    return { sourceText, extractionWarnings: warnings };
  }

  return {
    sourceText,
    extractionWarnings: warnings,
    communicationIntents: unique([
      ...current.communicationIntents,
      ...(extracted.communicationIntents ?? []),
    ]),
    jointAttention: applyChecklistSelections(current.jointAttention, extracted.jointAttention),
    gestures: unique([...current.gestures, ...(extracted.gestures ?? [])]),
    vocalSpontaneous: extracted.vocalSpontaneous ?? current.vocalSpontaneous,
    vocalImitation: extracted.vocalImitation ?? current.vocalImitation,
    pragmatic: applyChecklistSelections(current.pragmatic, extracted.pragmatic),
    namingResponse: extracted.namingResponse ?? current.namingResponse,
    followingInstructions: extracted.followingInstructions ?? current.followingInstructions,
    symbolicBehavior: extracted.symbolicBehavior ?? current.symbolicBehavior,
    situationalObservations: mergeObservations(
      current.situationalObservations,
      extracted.situationalObservations
    ),
    notes: extracted.notes ?? current.notes,
  };
}
