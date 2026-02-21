/**
 * 통합 점수 입력 Zustand 스토어
 * 모든 평가도구(SELSI, PRES, REVT 등)의 입력/결과를 하나의 store에서 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AssessmentToolId } from '@/entities/assessment-tool';

// =========================================
// 타입 정의
// =========================================

/** 하위검사 입력 (원점수 + 정반응/오반응 + 지시문) */
export interface SubtestInput {
  rawScore: number | null;
  correctItems: string; // "1, 2, 3-6" 형식
  wrongItems: string; // "7, 8, 9-12" 형식
  exampleItems?: string; // 언어문제해결력 지시문 번호 (예: "1,2,3")
}

/** 도구별 API 응답 결과 */
export interface ToolApiResult {
  text: string; // "SELSI 결과, 수용언어 발달연령이..."
  data: Record<string, unknown>; // 도구마다 data 구조가 다름
}

/** 도구별 점수 데이터 */
export interface ToolScoreData {
  inputs: Record<string, SubtestInput>; // key = subtest명 (receptive, expressive 등)
  apiResult: ToolApiResult | null;
}

// =========================================
// Store 인터페이스
// =========================================

interface ScoreEntryState {
  /** 도구별 점수 데이터 (선택된 도구만 키가 존재) */
  tools: Partial<Record<AssessmentToolId, ToolScoreData>>;
  /** 통합 요약 텍스트 */
  integratedSummary: string | null;
  /** 로딩 상태 */
  loading: boolean;
  /** 에러 메시지 */
  error: string | null;

  // --- 도구 초기화/제거 ---
  /** 도구 초기화 (선택 시 빈 subtest 구조 생성) */
  initTool: (toolId: AssessmentToolId, subtests: string[]) => void;
  /** 도구 제거 (해제 시 키 삭제) */
  removeTool: (toolId: AssessmentToolId) => void;

  // --- 입력 액션 ---
  /** 원점수 설정 */
  setScore: (toolId: AssessmentToolId, subtest: string, score: number | null) => void;
  /** 하위검사 입력 부분 업데이트 (correctItems, wrongItems 등) */
  setInput: (
    toolId: AssessmentToolId,
    subtest: string,
    input: Partial<SubtestInput>
  ) => void;

  // --- 결과 액션 ---
  /** API 응답 결과 저장 */
  setApiResult: (toolId: AssessmentToolId, result: ToolApiResult | null) => void;
  /** 통합 요약 저장 */
  setIntegratedSummary: (summary: string | null) => void;

  // --- 상태 액션 ---
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // --- 초기화 ---
  /** 특정 도구의 입력/결과 초기화 (구조는 유지) */
  clearTool: (toolId: AssessmentToolId) => void;
  /** 모든 도구 입력/결과 초기화 */
  clearAll: () => void;
  /** 결과만 초기화 (입력은 유지) */
  clearResults: () => void;
}

// =========================================
// 헬퍼
// =========================================

const DEFAULT_SUBTEST_INPUT: SubtestInput = {
  rawScore: null,
  correctItems: '',
  wrongItems: '',
};

function createEmptyInputs(subtests: string[]): Record<string, SubtestInput> {
  const inputs: Record<string, SubtestInput> = {};
  for (const subtest of subtests) {
    inputs[subtest] = { ...DEFAULT_SUBTEST_INPUT };
  }
  return inputs;
}

function clearToolData(tool: ToolScoreData): ToolScoreData {
  const clearedInputs: Record<string, SubtestInput> = {};
  for (const key of Object.keys(tool.inputs)) {
    clearedInputs[key] = { ...DEFAULT_SUBTEST_INPUT };
  }
  return { inputs: clearedInputs, apiResult: null };
}

// =========================================
// Store
// =========================================

export const useScoreEntryStore = create<ScoreEntryState>()(
  persist(
    (set, get) => ({
      tools: {},
      integratedSummary: null,
      loading: false,
      error: null,

      initTool: (toolId, subtests) => {
        const current = get().tools[toolId];
        // 이미 초기화된 도구면 건너뜀
        if (current) return;
        set((state) => ({
          tools: {
            ...state.tools,
            [toolId]: {
              inputs: createEmptyInputs(subtests),
              apiResult: null,
            },
          },
        }));
      },

      removeTool: (toolId) => {
        set((state) => {
          const { [toolId]: _, ...rest } = state.tools;
          void _;
          return { tools: rest };
        });
      },

      setScore: (toolId, subtest, score) => {
        set((state) => {
          const tool = state.tools[toolId];
          if (!tool) return state;
          return {
            tools: {
              ...state.tools,
              [toolId]: {
                ...tool,
                inputs: {
                  ...tool.inputs,
                  [subtest]: {
                    ...(tool.inputs[subtest] ?? DEFAULT_SUBTEST_INPUT),
                    rawScore: score,
                  },
                },
              },
            },
          };
        });
      },

      setInput: (toolId, subtest, input) => {
        set((state) => {
          const tool = state.tools[toolId];
          if (!tool) return state;
          const currentInput = tool.inputs[subtest] ?? DEFAULT_SUBTEST_INPUT;
          const newInput = { ...currentInput, ...input };
          return {
            tools: {
              ...state.tools,
              [toolId]: {
                ...tool,
                inputs: {
                  ...tool.inputs,
                  [subtest]: newInput,
                },
              },
            },
          };
        });
      },

      setApiResult: (toolId, result) => {
        set((state) => {
          const tool = state.tools[toolId];
          if (!tool) return state;
          return {
            tools: {
              ...state.tools,
              [toolId]: {
                ...tool,
                apiResult: result,
              },
            },
          };
        });
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

      clearTool: (toolId) => {
        set((state) => {
          const tool = state.tools[toolId];
          if (!tool) return state;
          return {
            tools: {
              ...state.tools,
              [toolId]: clearToolData(tool),
            },
          };
        });
      },

      clearAll: () => {
        set({
          tools: {},
          integratedSummary: null,
          error: null,
        });
      },

      clearResults: () => {
        set((state) => {
          const clearedTools: Partial<Record<AssessmentToolId, ToolScoreData>> = {};
          for (const [id, tool] of Object.entries(state.tools)) {
            if (tool) {
              clearedTools[id as AssessmentToolId] = {
                ...tool,
                apiResult: null,
              };
            }
          }
          return {
            tools: clearedTools,
            integratedSummary: null,
          };
        });
      },
    }),
    {
      name: 'norm-converter-score-entry',
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
