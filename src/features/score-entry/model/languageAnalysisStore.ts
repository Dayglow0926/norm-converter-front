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

export type LanguageAnalysisType = 'spontaneous_speech' | 'conversation' | 'behavioral_observation';

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
  isGenerated?: boolean;
}

// 문법형태소 태그
export interface MorphemeTags {
  particles: string[]; // 조사
  conjunctions: string[]; // 연결어미
  endings: string[]; // 종결어미
}

export interface SpontaneousInput {
  sourceText: string;
  extractionWarnings: string[];

  // 섹션 1: 구문 측정치
  mluW: number | null;
  mluMax: number | null;
  longestUtterance: string | null; // 가장 긴 발화 텍스트
  longestUtteranceStructure: string | null; // 가장 긴 발화 문법 구조 (예: "대등접속 복문")
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

  // 섹션 8: 공동활동/호명
  jointAttention: ChecklistItem[];
}

export interface ConversationInput {
  sourceText: string;
  extractionWarnings: string[];
  pragmatic: ChecklistItem[];
  topicManagement: ChecklistItem[];
  communicationIntents: string[];
  situationalObservations: SituationalObservation[];
  notes: string | null;
}

export interface BehavioralObservationInput {
  sourceText: string;
  extractionWarnings: string[];
  communicationIntents: string[];
  jointAttention: ChecklistItem[];
  gestures: string[];
  vocalSpontaneous: string | null;
  vocalImitation: string | null;
  pragmatic: ChecklistItem[];
  namingResponse: 'consistent' | 'inconsistent' | 'none' | null;
  followingInstructions: string | null;
  symbolicBehavior: string | null;
  situationalObservations: SituationalObservation[];
  notes: string | null;
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
    category: '요구',
    items: [
      '예/아니오 질문',
      '의문사 질문',
      '명료화 질문',
      '확인질문',
      '행위 요구',
      '사물 요구',
      '허락 요구',
    ],
  },
  {
    category: '반응',
    items: [
      '예/수용',
      '아니오/저항/부정',
      '의문사 대답',
      '명료화',
      '순응',
      '거부/저항',
      '반복',
      '의례적 반응',
    ],
  },
  {
    category: '객관적 언급',
    items: ['사물에 주의끌기', '이름대기', '사건 상태', '고유 특성', '기능', '위치', '시간'],
  },
  {
    category: '주관적 진술',
    items: ['규칙', '평가', '내적상태', '속성', '주장', '설명'],
  },
  {
    category: '메세지 수신표현',
    items: ['수용', '승인/동의', '부인/반대'],
  },
  {
    category: '구성요소',
    items: ['의례적 인사', '부르기', '화자 선택', '동반', '감탄'],
  },
  {
    category: '발전된 표현',
    items: ['농담', '경고', '놀림'],
  },
];

const DEFAULT_SPONTANEOUS_INPUT: SpontaneousInput = {
  sourceText: '',
  extractionWarnings: [],
  mluW: null,
  mluMax: null,
  longestUtterance: null,
  longestUtteranceStructure: null,
  speakingSituation: null,
  communicationFunctions: {},
  morphemes: { particles: [], conjunctions: [], endings: [] },
  semanticErrors: { enabled: false, examples: null },
  pragmatic: { items: DEFAULT_PRAGMATIC_ITEMS, examples: null },
  topicManagement: DEFAULT_TOPIC_MANAGEMENT_ITEMS,
  situationalObservations: DEFAULT_SITUATIONS,
  jointAttention: DEFAULT_JOINT_ATTENTION_ITEMS,
};

const DEFAULT_CONVERSATION_INPUT: ConversationInput = {
  sourceText: '',
  extractionWarnings: [],
  pragmatic: DEFAULT_PRAGMATIC_ITEMS,
  topicManagement: DEFAULT_TOPIC_MANAGEMENT_ITEMS,
  communicationIntents: [],
  situationalObservations: DEFAULT_SITUATIONS,
  notes: null,
};

const DEFAULT_BEHAVIORAL_INPUT: BehavioralObservationInput = {
  sourceText: '',
  extractionWarnings: [],
  communicationIntents: [],
  jointAttention: DEFAULT_JOINT_ATTENTION_ITEMS,
  gestures: [],
  vocalSpontaneous: null,
  vocalImitation: null,
  pragmatic: DEFAULT_PRAGMATIC_ITEMS,
  namingResponse: null,
  followingInstructions: null,
  symbolicBehavior: null,
  situationalObservations: DEFAULT_SITUATIONS,
  notes: null,
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
  conversation: ConversationInput;
  behavioral: BehavioralObservationInput;
  step1Result: LanguageAnalysisStep1Result | null;
  step2Text: string | null;

  setSelectedType: (type: LanguageAnalysisType | null) => void;
  setSpontaneous: (input: Partial<SpontaneousInput>) => void;
  setSpontaneousField: <K extends keyof SpontaneousInput>(
    field: K,
    value: SpontaneousInput[K]
  ) => void;
  setConversation: (input: Partial<ConversationInput>) => void;
  setConversationField: <K extends keyof ConversationInput>(
    field: K,
    value: ConversationInput[K]
  ) => void;
  setBehavioral: (input: Partial<BehavioralObservationInput>) => void;
  setBehavioralField: <K extends keyof BehavioralObservationInput>(
    field: K,
    value: BehavioralObservationInput[K]
  ) => void;
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
      conversation: DEFAULT_CONVERSATION_INPUT,
      behavioral: DEFAULT_BEHAVIORAL_INPUT,
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

      setConversation: (input) =>
        set((state) => ({
          conversation: { ...state.conversation, ...input },
        })),

      setConversationField: (field, value) =>
        set((state) => ({
          conversation: { ...state.conversation, [field]: value },
        })),

      setBehavioral: (input) =>
        set((state) => ({
          behavioral: { ...state.behavioral, ...input },
        })),

      setBehavioralField: (field, value) =>
        set((state) => ({
          behavioral: { ...state.behavioral, [field]: value },
        })),

      setStep1Result: (result) => set({ step1Result: result }),

      setStep2Text: (text) => set({ step2Text: text }),

      clearAll: () =>
        set({
          selectedType: null,
          spontaneous: DEFAULT_SPONTANEOUS_INPUT,
          conversation: DEFAULT_CONVERSATION_INPUT,
          behavioral: DEFAULT_BEHAVIORAL_INPUT,
          step1Result: null,
          step2Text: null,
        }),

      clearResult: () => set({ step1Result: null, step2Text: null }),
    }),
    {
      name: 'norm-converter-language-analysis-session',
      version: 4, // SCRUM-122: conversation / behavioral 상태 추가
      migrate: () => ({
        selectedType: null,
        spontaneous: DEFAULT_SPONTANEOUS_INPUT,
        conversation: DEFAULT_CONVERSATION_INPUT,
        behavioral: DEFAULT_BEHAVIORAL_INPUT,
        step1Result: null,
        step2Text: null,
      }),
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
