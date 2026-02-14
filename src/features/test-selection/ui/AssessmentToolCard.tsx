'use client';

/**
 * 평가도구 카드 컴포넌트
 * 아동 연령 기반 활성/비활성 처리
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type AssessmentToolId,
  TOOL_METADATA,
  isToolActive,
  getDisabledReason,
} from '@/entities/assessment-tool';

interface AssessmentToolCardProps {
  toolId: AssessmentToolId;
  ageMonths: number | null;
  selected: boolean;
  onSelect: (toolId: AssessmentToolId) => void;
}

/**
 * 연령 범위를 사람이 읽기 좋은 형식으로 변환
 */
function formatAgeRange(minMonths: number, maxMonths: number): string {
  const minYears = Math.floor(minMonths / 12);
  const maxYears = Math.floor(maxMonths / 12);

  if (minYears === 0) {
    return `${minMonths}-${maxMonths}개월`;
  }
  if (maxYears >= 16) {
    return `${minYears}세-${maxYears}세`;
  }
  return `${minYears}-${maxYears}세`;
}

export function AssessmentToolCard({
  toolId,
  ageMonths,
  selected,
  onSelect,
}: AssessmentToolCardProps) {
  const meta = TOOL_METADATA[toolId];
  const active = isToolActive(toolId);
  const disabledReason = getDisabledReason(toolId, ageMonths);
  const isDisabled = disabledReason !== null;
  const ageRange = formatAgeRange(meta.minAgeMonths, meta.maxAgeMonths);

  const handleClick = () => {
    if (!isDisabled) {
      onSelect(toolId);
    }
  };

  return (
    <Card
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      data-selected={selected}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`
        cursor-pointer transition-all select-none
        ${selected ? 'ring-2 ring-primary border-primary' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:shadow-md'}
        ${!active ? 'bg-muted/30' : ''}
      `}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{meta.name}</span>
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
            {meta.category}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{meta.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">적용 연령: {ageRange}</span>
          {disabledReason && (
            <span className="text-xs text-destructive font-medium">{disabledReason}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
