'use client';

/**
 * 평가도구 선택 그리드 컴포넌트
 * 7종 평가도구 카드를 그리드로 표시
 */

import { ALL_TOOL_IDS, type AssessmentToolId } from '@/entities/assessment-tool';
import { useTestSelectionStore } from '../model/store';
import { AssessmentToolCard } from './AssessmentToolCard';

interface TestSelectionGridProps {
  ageMonths: number | null;
  onToolSelect?: (toolId: AssessmentToolId) => void;
}

export function TestSelectionGrid({ ageMonths, onToolSelect }: TestSelectionGridProps) {
  const { selectedTool, selectTool } = useTestSelectionStore();

  const handleSelect = (toolId: AssessmentToolId) => {
    selectTool(toolId);
    onToolSelect?.(toolId);
  };

  return (
    <section className="w-full">
      <h2 className="text-xl font-semibold mb-4">평가도구 선택</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_TOOL_IDS.map((toolId) => (
          <AssessmentToolCard
            key={toolId}
            toolId={toolId}
            ageMonths={ageMonths}
            selected={selectedTool === toolId}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </section>
  );
}
