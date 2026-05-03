'use client';

/**
 * 평가도구 선택 그리드 컴포넌트
 * 7종 평가도구 카드를 그리드로 표시 (다중 선택 지원)
 */

import { ALL_TOOL_IDS, type AssessmentToolId } from '@/entities/assessment-tool';
import { useTestSelectionStore } from '../model/store';
import { AssessmentToolCard } from './AssessmentToolCard';

interface TestSelectionGridProps {
  getAgeMonths: (toolId: AssessmentToolId) => number | null;
}

export function TestSelectionGrid({ getAgeMonths }: TestSelectionGridProps) {
  const { selectedTools, toggleTool } = useTestSelectionStore();

  const handleSelect = (toolId: AssessmentToolId) => {
    toggleTool(toolId);
  };

  return (
    <section className="w-full">
      <h2 className="mb-2 text-xl font-semibold">평가도구 선택</h2>
      <p className="text-muted-foreground mb-4 text-sm">
        모든 도구는 전 연령에서 선택할 수 있으며, 카드의 권장 연령은 참고용입니다
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_TOOL_IDS.map((toolId) => (
          <AssessmentToolCard
            key={toolId}
            toolId={toolId}
            ageMonths={getAgeMonths(toolId)}
            selected={selectedTools.includes(toolId)}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </section>
  );
}
