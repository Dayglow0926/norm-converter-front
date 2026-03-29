/**
 * 평가도구 선택 Zustand 스토어 (다중 선택 지원)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AssessmentToolId } from '@/entities/assessment-tool';

interface TestSelectionState {
  // 선택된 평가도구 목록
  selectedTools: AssessmentToolId[];
  // 사용자가 선택 상태를 명시적으로 결정했는지 여부
  hasInitializedSelection: boolean;
  _hasHydrated: boolean;

  // 액션
  toggleTool: (toolId: AssessmentToolId) => void;
  setSelectedTools: (toolIds: AssessmentToolId[]) => void;
  clearSelection: () => void;
  isSelected: (toolId: AssessmentToolId) => boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useTestSelectionStore = create<TestSelectionState>()(
  persist(
    (set, get) => ({
      selectedTools: [],
      hasInitializedSelection: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      toggleTool: (toolId: AssessmentToolId) => {
        const current = get().selectedTools;
        if (current.includes(toolId)) {
          // 이미 선택됨 -> 선택 해제
          set({
            selectedTools: current.filter((id) => id !== toolId),
            hasInitializedSelection: true,
          });
        } else {
          // 선택 추가
          set({
            selectedTools: [...current, toolId],
            hasInitializedSelection: true,
          });
        }
      },

      setSelectedTools: (toolIds: AssessmentToolId[]) => {
        // 순서 유지 + 중복 제거
        set({
          selectedTools: Array.from(new Set(toolIds)),
          hasInitializedSelection: true,
        });
      },

      clearSelection: () => {
        set({ selectedTools: [], hasInitializedSelection: false });
      },

      isSelected: (toolId: AssessmentToolId) => {
        return get().selectedTools.includes(toolId);
      },
    }),
    {
      name: 'norm-converter-test-selection',
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
