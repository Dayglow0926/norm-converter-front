/**
 * 언어분석 전용 Zustand 스토어
 * - 유형 선택, 입력 데이터, Step1/Step2 결과 상태 관리 (sessionStorage)
 * - 커스텀 항목은 별도 store에서 localStorage persist
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// =========================================
// 타입 정의
// =========================================

export type LanguageAnalysisType =
  | 'spontaneous_speech'
  | 'conversation'
  | 'behavioral_observation';

export const LANGUAGE_ANALYSIS_TYPE_LABELS: Record<LanguageAnalysisType, string> = {
  spontaneous_speech: '자발화',
  conversation: '대화분석',
  behavioral_observation: '행동관찰',
};

export interface SpontaneousInput {
  mluW: number | null;
  mluMax: number | null;
}

export interface LanguageAnalysisStep1Result {
  text: string;
  data: Record<string, unknown>;
}

// =========================================
// 메인 Store (sessionStorage)
// =========================================

interface LanguageAnalysisState {
  selectedType: LanguageAnalysisType | null;
  spontaneous: SpontaneousInput;
  step1Result: LanguageAnalysisStep1Result | null;
  step2Text: string | null;

  setSelectedType: (type: LanguageAnalysisType | null) => void;
  setSpontaneous: (input: Partial<SpontaneousInput>) => void;
  setStep1Result: (result: LanguageAnalysisStep1Result | null) => void;
  setStep2Text: (text: string | null) => void;
  clearAll: () => void;
  clearResult: () => void;
}

export const useLanguageAnalysisStore = create<LanguageAnalysisState>()(
  persist(
    (set) => ({
      selectedType: null,
      spontaneous: { mluW: null, mluMax: null },
      step1Result: null,
      step2Text: null,

      setSelectedType: (type) => set({ selectedType: type }),

      setSpontaneous: (input) =>
        set((state) => ({
          spontaneous: { ...state.spontaneous, ...input },
        })),

      setStep1Result: (result) => set({ step1Result: result }),

      setStep2Text: (text) => set({ step2Text: text }),

      clearAll: () =>
        set({
          selectedType: null,
          spontaneous: { mluW: null, mluMax: null },
          step1Result: null,
          step2Text: null,
        }),

      clearResult: () => set({ step1Result: null, step2Text: null }),
    }),
    {
      name: 'norm-converter-language-analysis-session',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);

// =========================================
// 커스텀 항목 Store (localStorage)
// =========================================

interface LanguageAnalysisCustomItemsState {
  customItems: Record<string, string[]>;
  setCustomItems: (category: string, items: string[]) => void;
  clearCustomItems: () => void;
}

export const useLanguageAnalysisCustomItemsStore = create<LanguageAnalysisCustomItemsState>()(
  persist(
    (set) => ({
      customItems: {},

      setCustomItems: (category, items) =>
        set((state) => ({
          customItems: { ...state.customItems, [category]: items },
        })),

      clearCustomItems: () => set({ customItems: {} }),
    }),
    {
      name: 'norm-converter-language-analysis-custom',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    }
  )
);
