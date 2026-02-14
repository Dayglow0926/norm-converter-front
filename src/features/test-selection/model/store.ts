/**
 * 평가도구 선택 Zustand 스토어 (다중 선택 지원)
 */

import { create } from 'zustand';
import type { AssessmentToolId } from '@/entities/assessment-tool';

interface TestSelectionState {
  // 선택된 평가도구 목록
  selectedTools: AssessmentToolId[];

  // 액션
  toggleTool: (toolId: AssessmentToolId) => void;
  clearSelection: () => void;
  isSelected: (toolId: AssessmentToolId) => boolean;
}

export const useTestSelectionStore = create<TestSelectionState>((set, get) => ({
  selectedTools: [],

  toggleTool: (toolId: AssessmentToolId) => {
    const current = get().selectedTools;
    if (current.includes(toolId)) {
      // 이미 선택됨 -> 선택 해제
      set({ selectedTools: current.filter((id) => id !== toolId) });
    } else {
      // 선택 추가
      set({ selectedTools: [...current, toolId] });
    }
  },

  clearSelection: () => {
    set({ selectedTools: [] });
  },

  isSelected: (toolId: AssessmentToolId) => {
    return get().selectedTools.includes(toolId);
  },
}));
