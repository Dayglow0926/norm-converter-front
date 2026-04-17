import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  KMB_CDI_GRAMMAR_FEATURES,
  KMB_CDI_VOCAB_CATEGORIES,
  type KmbCdiGrammarFeatureKey,
  type KmbCdiGrammarFeatureStatus,
  type KmbCdiVocabCategoryKey,
} from '@/entities/assessment-tool';

export interface KmbCdiVocabularyInput {
  expressive: number | null;
  receptive: number | null;
}

export type KmbCdiVocabularyState = Record<KmbCdiVocabCategoryKey, KmbCdiVocabularyInput>;
export type KmbCdiGrammarState = Record<KmbCdiGrammarFeatureKey, KmbCdiGrammarFeatureStatus>;

interface KmbCdiState {
  vocabulary: KmbCdiVocabularyState;
  grammarRawScore: number | null;
  grammarFeatures: KmbCdiGrammarState;
  longestUtterance: string;
  _hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  setVocabularyScore: (
    categoryKey: KmbCdiVocabCategoryKey,
    field: 'expressive' | 'receptive',
    value: number | null
  ) => void;
  setGrammarRawScore: (value: number | null) => void;
  setGrammarFeatureStatus: (
    featureKey: KmbCdiGrammarFeatureKey,
    status: KmbCdiGrammarFeatureStatus
  ) => void;
  setLongestUtterance: (value: string) => void;
  clearAll: () => void;
}

function createDefaultVocabularyState(): KmbCdiVocabularyState {
  return KMB_CDI_VOCAB_CATEGORIES.reduce((acc, category) => {
    acc[category.key] = { expressive: null, receptive: null };
    return acc;
  }, {} as KmbCdiVocabularyState);
}

function createDefaultGrammarState(): KmbCdiGrammarState {
  return KMB_CDI_GRAMMAR_FEATURES.reduce((acc, feature) => {
    acc[feature.key] = 'not_used';
    return acc;
  }, {} as KmbCdiGrammarState);
}

const DEFAULT_STATE = {
  vocabulary: createDefaultVocabularyState(),
  grammarRawScore: null,
  grammarFeatures: createDefaultGrammarState(),
  longestUtterance: '',
};

export const useKmbCdiStore = create<KmbCdiState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      setVocabularyScore: (categoryKey, field, value) => {
        set((state) => ({
          vocabulary: {
            ...state.vocabulary,
            [categoryKey]: {
              ...state.vocabulary[categoryKey],
              [field]: value,
            },
          },
        }));
      },

      setGrammarRawScore: (value) => {
        set({ grammarRawScore: value });
      },

      setGrammarFeatureStatus: (featureKey, status) => {
        set((state) => ({
          grammarFeatures: {
            ...state.grammarFeatures,
            [featureKey]: status,
          },
        }));
      },

      setLongestUtterance: (value) => {
        set({ longestUtterance: value });
      },

      clearAll: () => {
        set({
          ...DEFAULT_STATE,
        });
      },
    }),
    {
      name: 'norm-converter-kmb-cdi',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
