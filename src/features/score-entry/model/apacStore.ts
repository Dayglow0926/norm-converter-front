import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  ApacAdministrationMode,
  ApacScoreVersion,
} from '@/entities/assessment-tool';

export interface ApacInputState {
  scoreVersion: ApacScoreVersion;
  administrationMode: ApacAdministrationMode;
  rawScore: number | null;
  errorPatternKeys: string[];
  errorPatternExamples: Record<string, string>;
}

interface ApacState extends ApacInputState {
  setScoreVersion: (value: ApacScoreVersion) => void;
  setAdministrationMode: (value: ApacAdministrationMode) => void;
  setRawScore: (value: number | null) => void;
  toggleErrorPattern: (key: string) => void;
  setErrorPatternExample: (key: string, value: string) => void;
  clearAll: () => void;
}

const DEFAULT_STATE: ApacInputState = {
  scoreVersion: 'revised',
  administrationMode: 'direct',
  rawScore: null,
  errorPatternKeys: [],
  errorPatternExamples: {},
};

export const useApacStore = create<ApacState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setScoreVersion: (value) => {
        set({ scoreVersion: value });
      },

      setAdministrationMode: (value) => {
        set({ administrationMode: value });
      },

      setRawScore: (value) => {
        set({ rawScore: value });
      },

      toggleErrorPattern: (key) => {
        set((state) => ({
          errorPatternKeys: state.errorPatternKeys.includes(key)
            ? state.errorPatternKeys.filter((item) => item !== key)
            : [...state.errorPatternKeys, key],
          errorPatternExamples: state.errorPatternKeys.includes(key)
            ? Object.fromEntries(
                Object.entries(state.errorPatternExamples).filter(([exampleKey]) => exampleKey !== key)
              )
            : state.errorPatternExamples,
        }));
      },

      setErrorPatternExample: (key, value) => {
        set((state) => ({
          errorPatternExamples: {
            ...state.errorPatternExamples,
            [key]: value,
          },
        }));
      },

      clearAll: () => {
        set({ ...DEFAULT_STATE });
      },
    }),
    {
      name: 'norm-converter-apac',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
