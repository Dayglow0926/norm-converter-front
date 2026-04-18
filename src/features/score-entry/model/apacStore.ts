import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  ApacAdministrationMode,
  ApacErrorPatternExampleInput,
  ApacScoreVersion,
} from '@/entities/assessment-tool';

export interface ApacInputState {
  scoreVersion: ApacScoreVersion;
  administrationMode: ApacAdministrationMode;
  rawScore: number | null;
  errorPatternKeys: string[];
  errorPatternExamples: Record<string, ApacErrorPatternExampleInput>;
}

interface ApacState extends ApacInputState {
  setScoreVersion: (value: ApacScoreVersion) => void;
  setAdministrationMode: (value: ApacAdministrationMode) => void;
  setRawScore: (value: number | null) => void;
  toggleErrorPattern: (key: string) => void;
  setErrorPatternExampleField: (
    key: string,
    field: keyof ApacErrorPatternExampleInput,
    value: string
  ) => void;
  clearAll: () => void;
}

function createEmptyExampleInput(): ApacErrorPatternExampleInput {
  return {
    target: '',
    production: '',
  };
}

function parseLegacyExampleInput(value: string): ApacErrorPatternExampleInput {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return createEmptyExampleInput();
  }

  const match = trimmedValue.match(/^(.*?)\s*(?:→|->|=>|➡︎|➡)\s*(.*)$/u);
  if (!match) {
    return {
      target: trimmedValue,
      production: '',
    };
  }

  return {
    target: match[1]?.trim() ?? '',
    production: match[2]?.trim() ?? '',
  };
}

function normalizeErrorPatternExamples(
  value: unknown
): Record<string, ApacErrorPatternExampleInput> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, rawValue]) => {
      if (typeof rawValue === 'string') {
        return [key, parseLegacyExampleInput(rawValue)];
      }

      if (rawValue && typeof rawValue === 'object') {
        const normalizedValue = rawValue as Partial<ApacErrorPatternExampleInput>;
        return [
          key,
          {
            target: normalizedValue.target?.trim() ?? '',
            production: normalizedValue.production?.trim() ?? '',
          },
        ];
      }

      return [key, createEmptyExampleInput()];
    })
  );
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

      setErrorPatternExampleField: (key, field, value) => {
        set((state) => ({
          errorPatternExamples: {
            ...state.errorPatternExamples,
            [key]: {
              ...(state.errorPatternExamples[key] ?? createEmptyExampleInput()),
              [field]: value,
            },
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
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<ApacInputState> | undefined;

        return {
          ...currentState,
          ...typedPersistedState,
          errorPatternExamples: normalizeErrorPatternExamples(
            typedPersistedState?.errorPatternExamples
          ),
        };
      },
    }
  )
);
