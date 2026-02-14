/**
 * 점수 입력 Zustand 스토어
 */

import { create } from 'zustand';

interface SelsiScores {
  receptive: number | null;
  expressive: number | null;
}

interface SelsiResults {
  receptive: number | null; // 등가연령 (개월)
  expressive: number | null;
  combined: number | null;
}

interface ScoreEntryState {
  // SELSI 점수
  selsiScores: SelsiScores;
  selsiResults: SelsiResults;

  // 로딩/에러 상태
  loading: boolean;
  error: string | null;

  // 액션
  setSelsiScore: (subtest: keyof SelsiScores, score: number | null) => void;
  setSelsiResults: (results: SelsiResults) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearScores: () => void;
}

export const useScoreEntryStore = create<ScoreEntryState>((set) => ({
  selsiScores: {
    receptive: null,
    expressive: null,
  },
  selsiResults: {
    receptive: null,
    expressive: null,
    combined: null,
  },
  loading: false,
  error: null,

  setSelsiScore: (subtest, score) => {
    set((state) => ({
      selsiScores: {
        ...state.selsiScores,
        [subtest]: score,
      },
    }));
  },

  setSelsiResults: (results) => {
    set({ selsiResults: results, error: null });
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
      selsiResults: { receptive: null, expressive: null, combined: null },
      error: null,
    });
  },
}));
