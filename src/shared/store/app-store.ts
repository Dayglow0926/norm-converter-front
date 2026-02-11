import { create } from 'zustand';
import type { ChildInfo } from '@/entities/child';
import type { AssessmentToolId } from '@/entities/assessment-tool';

interface AppState {
  // 아동 정보
  childInfo: ChildInfo | null;
  setChildInfo: (info: ChildInfo) => void;
  clearChildInfo: () => void;

  // 선택된 평가도구
  selectedTools: AssessmentToolId[];
  addTool: (toolId: AssessmentToolId) => void;
  removeTool: (toolId: AssessmentToolId) => void;
  clearTools: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // 아동 정보
  childInfo: null,
  setChildInfo: (info) => set({ childInfo: info }),
  clearChildInfo: () => set({ childInfo: null }),

  // 선택된 평가도구
  selectedTools: [],
  addTool: (toolId) =>
    set((state) => ({
      selectedTools: state.selectedTools.includes(toolId)
        ? state.selectedTools
        : [...state.selectedTools, toolId],
    })),
  removeTool: (toolId) =>
    set((state) => ({
      selectedTools: state.selectedTools.filter((id) => id !== toolId),
    })),
  clearTools: () => set({ selectedTools: [] }),
}));
