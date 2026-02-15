/**
 * 점수 입력 Zustand 스토어
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 하위검사 입력 (원점수 + 정반응/오반응)
interface SubtestInput {
  rawScore: number | null;
  correctItems: string; // "1, 2, 3-6" 형식
  wrongItems: string; // "7, 8, 9-12" 형식
}

interface SelsiScores {
  receptive: number | null;
  expressive: number | null;
}

interface SelsiInputs {
  receptive: SubtestInput;
  expressive: SubtestInput;
}

interface SelsiResults {
  receptive: number | null; // 등가연령 (개월)
  expressive: number | null;
  combined: number | null;
}

// API 응답 결과 (텍스트 포함)
interface SelsiApiResult {
  resultText: string; // "SELSI 결과, 수용언어 발달연령이..."
  responseText: string; // "보호자 보고에 의하면..."
  data: {
    receptiveRawScore?: number;
    receptiveAge?: number;
    expressiveRawScore?: number;
    expressiveAge?: number;
    combinedAge?: number;
    totalScore?: number;
  };
}

interface ScoreEntryState {
  // SELSI 점수 (하위호환용)
  selsiScores: SelsiScores;
  // SELSI 입력 (정반응/오반응 포함)
  selsiInputs: SelsiInputs;
  // 등가연령 결과
  selsiResults: SelsiResults;
  // API 응답 결과 (텍스트 포함)
  selsiApiResult: SelsiApiResult | null;
  // 통합 요약
  integratedSummary: string | null;

  // 로딩/에러 상태
  loading: boolean;
  error: string | null;

  // 액션
  setSelsiScore: (subtest: keyof SelsiScores, score: number | null) => void;
  setSelsiInput: (subtest: keyof SelsiInputs, input: Partial<SubtestInput>) => void;
  setSelsiResults: (results: SelsiResults) => void;
  setSelsiApiResult: (result: SelsiApiResult | null) => void;
  setIntegratedSummary: (summary: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearScores: () => void;
}

export type { SubtestInput, SelsiScores, SelsiInputs, SelsiResults, SelsiApiResult };

const DEFAULT_SUBTEST_INPUT: SubtestInput = {
  rawScore: null,
  correctItems: '',
  wrongItems: '',
};

export const useScoreEntryStore = create<ScoreEntryState>()(
  persist(
    (set) => ({
      selsiScores: {
        receptive: null,
        expressive: null,
      },
      selsiInputs: {
        receptive: { ...DEFAULT_SUBTEST_INPUT },
        expressive: { ...DEFAULT_SUBTEST_INPUT },
      },
      selsiResults: {
        receptive: null,
        expressive: null,
        combined: null,
      },
      selsiApiResult: null,
      integratedSummary: null,
      loading: false,
      error: null,

      setSelsiScore: (subtest, score) => {
        set((state) => ({
          selsiScores: {
            ...state.selsiScores,
            [subtest]: score,
          },
          // selsiInputs의 rawScore도 동기화
          selsiInputs: {
            ...state.selsiInputs,
            [subtest]: {
              ...state.selsiInputs[subtest],
              rawScore: score,
            },
          },
        }));
      },

      setSelsiInput: (subtest, input) => {
        set((state) => {
          const newInput = { ...state.selsiInputs[subtest], ...input };
          return {
            selsiInputs: {
              ...state.selsiInputs,
              [subtest]: newInput,
            },
            // rawScore가 변경되면 selsiScores도 동기화
            selsiScores:
              input.rawScore !== undefined
                ? {
                    ...state.selsiScores,
                    [subtest]: input.rawScore,
                  }
                : state.selsiScores,
          };
        });
      },

      setSelsiResults: (results) => {
        set({ selsiResults: results, error: null });
      },

      setSelsiApiResult: (result) => {
        set({ selsiApiResult: result });
      },

      setIntegratedSummary: (summary) => {
        set({ integratedSummary: summary });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error, loading: false });
      },

      clearScores: () => {
        set({
          selsiScores: { receptive: null, expressive: null },
          selsiInputs: {
            receptive: { ...DEFAULT_SUBTEST_INPUT },
            expressive: { ...DEFAULT_SUBTEST_INPUT },
          },
          selsiResults: { receptive: null, expressive: null, combined: null },
          selsiApiResult: null,
          integratedSummary: null,
          error: null,
        });
      },
    }),
    {
      name: 'norm-converter-score-entry',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
