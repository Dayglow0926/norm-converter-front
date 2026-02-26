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

// 화용/담화, 주제 관리, 공동주의 항목 타입
export interface ChecklistItem {
  label: string;
  value: 'positive' | 'negative' | null; // null = 미선택
}

// 섹션 7 상황별 관찰 항목
export interface SituationalObservation {
  situation: string;
  observation: string;
  example: string;
  isCustom?: boolean;
}

// 문법형태소 태그
export interface MorphemeTags {
  particles: string[];    // 조사
  conjunctions: string[]; // 연결어미
  endings: string[];      // 종결어미
}

export interface SpontaneousInput {
  // 섹션 1: 구문 측정치
  mluW: number | null;
  mluMax: number | null;
  longestUtterance: string | null; // 가장 긴 발화 텍스트
  speakingSituation: string | null; // 발화 상황

  // 섹션 2: 의사소통 기능 (카테고리 → 선택 항목 배열)
  communicationFunctions: Record<string, string[]>;

  // 섹션 3: 문법형태소 태그
  morphemes: MorphemeTags;

  // 섹션 4: 의미/문법 오류
  semanticErrors: {
    enabled: boolean;
    examples: string | null;
  };

  // 섹션 5: 화용/담화
  pragmatic: {
    items: ChecklistItem[];
    examples: string | null;
  };

  // 섹션 6: 주제 관리
  topicManagement: ChecklistItem[];

  // 섹션 7: 상황별 관찰
  situationalObservations: SituationalObservation[];

  // 섹션 8: 공동주의/활동/호명
  jointAttention: ChecklistItem[];
}

// 기본 화용/담화 항목
export const DEFAULT_PRAGMATIC_ITEMS: ChecklistItem[] = [
  { label: '주제 개시', value: null },
  { label: '주제 유지', value: null },
  { label: '주제 전환', value: null },
  { label: '차례 지키기', value: null },
  { label: '명료화 요구에 반응', value: null },
  { label: '도움 요청', value: null },
];

// 기본 주제 관리 항목
export const DEFAULT_TOPIC_MANAGEMENT_ITEMS: ChecklistItem[] = [
  { label: '대화 개시', value: null },
  { label: '주제 유지', value: null },
  { label: '주제 전환', value: null },
  { label: '순서 교대', value: null },
  { label: '말차례 주기', value: null },
];

// 기본 상황별 관찰 상황
export const DEFAULT_SITUATIONS: SituationalObservation[] = [
  { situation: '경험이야기', observation: '', example: '' },
  { situation: '보드게임', observation: '', example: '' },
  { situation: '아동이 선호하는 놀이', observation: '', example: '' },
  { situation: '이야기재구성', observation: '', example: '' },
];

// 기본 공동주의/활동/호명 항목
export const DEFAULT_JOINT_ATTENTION_ITEMS: ChecklistItem[] = [
  { label: '눈 맞춤', value: null },
  { label: '공동주의', value: null },
  { label: '공동활동', value: null },
  { label: '호명반응', value: null },
  { label: '사회적 미소', value: null },
];

// 의사소통 기능 카테고리 기본값
export const COMMUNICATION_FUNCTION_CATEGORIES: Array<{
  category: string;
  items: string[];
}> = [
  {
    category: '요구/요청',
    items: ['물건 요구하기', '행동 요구하기', '허가 요구하기', '정보 요구하기'],
  },
  {
    category: '사회적 기능',
    items: ['인사하기', '부르기', '거절하기', '항의하기', '칭찬하기'],
  },
  {
    category: '정보 제공',
    items: ['명명하기', '설명하기', '이야기하기', '대답하기'],
  },
  {
    category: '공동주의',
    items: ['시선 공유하기', '가리키기', '보여주기', '주의 끌기'],
  },
];

const DEFAULT_SPONTANEOUS_INPUT: SpontaneousInput = {
  mluW: null,
  mluMax: null,
  longestUtterance: null,
  speakingSituation: null,
  communicationFunctions: {},
  morphemes: { particles: [], conjunctions: [], endings: [] },
  semanticErrors: { enabled: false, examples: null },
  pragmatic: { items: DEFAULT_PRAGMATIC_ITEMS, examples: null },
  topicManagement: DEFAULT_TOPIC_MANAGEMENT_ITEMS,
  situationalObservations: DEFAULT_SITUATIONS,
  jointAttention: DEFAULT_JOINT_ATTENTION_ITEMS,
};

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
  setSpontaneousField: <K extends keyof SpontaneousInput>(field: K, value: SpontaneousInput[K]) => void;
  setStep1Result: (result: LanguageAnalysisStep1Result | null) => void;
  setStep2Text: (text: string | null) => void;
  clearAll: () => void;
  clearResult: () => void;
}

export const useLanguageAnalysisStore = create<LanguageAnalysisState>()(
  persist(
    (set) => ({
      selectedType: null,
      spontaneous: DEFAULT_SPONTANEOUS_INPUT,
      step1Result: null,
      step2Text: null,

      setSelectedType: (type) => set({ selectedType: type }),

      setSpontaneous: (input) =>
        set((state) => ({
          spontaneous: { ...state.spontaneous, ...input },
        })),

      setSpontaneousField: (field, value) =>
        set((state) => ({
          spontaneous: { ...state.spontaneous, [field]: value },
        })),

      setStep1Result: (result) => set({ step1Result: result }),

      setStep2Text: (text) => set({ step2Text: text }),

      clearAll: () =>
        set({
          selectedType: null,
          spontaneous: DEFAULT_SPONTANEOUS_INPUT,
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
