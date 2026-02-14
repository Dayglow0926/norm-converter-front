/**
 * 평가도구 선택 Zustand 스토어
 */

import { create } from 'zustand';
import type { AssessmentToolId } from '@/entities/assessment-tool';

interface TestSelectionState {
  // 선택된 평가도구
  selectedTool: AssessmentToolId | null;

  // 액션
  selectTool: (toolId: AssessmentToolId) => void;
  clearSelection: () => void;
}

export const useTestSelectionStore = create<TestSelectionState>((set) => ({
  selectedTool: null,

  selectTool: (toolId: AssessmentToolId) => {
    set({ selectedTool: toolId });
  },

  clearSelection: () => {
    set({ selectedTool: null });
  },
}));
