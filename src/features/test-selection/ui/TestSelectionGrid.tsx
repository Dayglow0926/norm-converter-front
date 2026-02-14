'use client';

/**
 * 평가도구 선택 그리드 컴포넌트
 * 7종 평가도구 카드를 그리드로 표시 (다중 선택 지원)
 */

import { ALL_TOOL_IDS, type AssessmentToolId } from '@/entities/assessment-tool';
import { useTestSelectionStore } from '../model/store';
import { AssessmentToolCard } from './AssessmentToolCard';

interface TestSelectionGridProps {
  ageMonths: number | null;
}

export function TestSelectionGrid({ ageMonths }: TestSelectionGridProps) {
  const { selectedTools, toggleTool } = useTestSelectionStore();

  const handleSelect = (toolId: AssessmentToolId) => {
    toggleTool(toolId);
  };

  return (
    <section className="w-full">
      <h2 className="text-xl font-semibold mb-2">평가도구 선택</h2>
      <p className="text-sm text-muted-foreground mb-4">
        실시할 평가도구를 선택하세요 (복수 선택 가능)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_TOOL_IDS.map((toolId) => (
          <AssessmentToolCard
            key={toolId}
            toolId={toolId}
            ageMonths={ageMonths}
            selected={selectedTools.includes(toolId)}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </section>
  );
}
