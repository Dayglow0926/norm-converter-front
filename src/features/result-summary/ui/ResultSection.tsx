'use client';

/**
 * 검사 결과 표시 섹션
 * 여러 검사 도구(SELSI, PRES, REVT 등)의 결과를 통합 표시
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TOOL_METADATA, type AssessmentToolId } from '@/entities/assessment-tool';
import type { ChildInfo, AgeResult } from '@/entities/child';

// =========================================
// 텍스트 스타일 상수 (한 곳에서 관리)
// =========================================
const TEXT_STYLES = {
  sectionTitle: 'text-sm font-semibold',
  body: 'text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300',
  titleColor: {
    blue: 'text-blue-800 dark:text-blue-200',
    green: 'text-green-800 dark:text-green-200',
  },
} as const;

// 도구별 결과 타입 (범용)
interface ToolResult {
  text: string;
}

interface ResultSectionProps {
  childInfo: ChildInfo;
  ageResult: AgeResult;
  results: Record<string, ToolResult>;
  integratedSummary?: string | null;
}

// 날짜 포맷 (Date → "YYYY.MM.DD")
function formatDate(date: Date): string {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

// 연령 포맷 (AgeResult → "N세 M개월")
function formatAge(ageResult: AgeResult): string {
  const { years, months } = ageResult;
  if (years === 0) return `${months}개월`;
  if (months === 0) return `${years}세`;
  return `${years}세 ${months}개월`;
}

// 도구 이름 가져오기
function getToolName(toolId: string): string {
  const meta = TOOL_METADATA[toolId as AssessmentToolId];
  return meta?.name ?? toolId.toUpperCase();
}

export function ResultSection({
  childInfo,
  ageResult,
  results,
  integratedSummary,
}: ResultSectionProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const showCopyFeedback = useCallback((message: string) => {
    setCopyFeedback(message);
    setTimeout(() => setCopyFeedback(null), 2000);
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, feedbackMsg: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showCopyFeedback(feedbackMsg);
      } catch {
        showCopyFeedback('복사 실패');
      }
    },
    [showCopyFeedback]
  );

  // 전체 복사 (아동 정보 + 모든 결과)
  const handleCopyAll = () => {
    const lines = [
      `[검사 결과]`,
      ``,
      `■ 아동 정보`,
      `이름: ${childInfo.name}`,
      `성별: ${childInfo.gender === 'male' ? '남' : '여'}`,
      `생년월일: ${formatDate(childInfo.birthDate)}`,
      `검사일: ${formatDate(childInfo.testDate)}`,
      `생활연령: ${formatAge(ageResult)}`,
    ];

    // 도구별 결과 순회
    for (const [toolId, result] of Object.entries(results)) {
      const toolName = getToolName(toolId);
      lines.push(``, `■ ${toolName} 결과`, result.text);
    }

    // 통합 요약 추가
    if (integratedSummary) {
      lines.push(``, `■ 통합 요약`, integratedSummary);
    }

    copyToClipboard(lines.join('\n'), '전체 복사 완료');
  };

  const toolEntries = Object.entries(results);

  return (
    <Card className="mt-6 w-full border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-800 dark:text-green-200">검사 결과</CardTitle>
          {copyFeedback && (
            <span className="animate-fade-in rounded-full bg-green-600 px-3 text-sm text-white">
              ✓ {copyFeedback}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* 통합 요약 (맨 위) */}
        {integratedSummary && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className={`mb-2 ${TEXT_STYLES.sectionTitle} ${TEXT_STYLES.titleColor.blue}`}>
                  통합 요약
                </h4>
                <p className={TEXT_STYLES.body}>{integratedSummary}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2 text-xs"
                onClick={() => copyToClipboard(integratedSummary, '통합 요약 복사 완료')}
              >
                복사
              </Button>
            </div>
          </div>
        )}

        {/* 도구별 결과 (범용 순회) */}
        {toolEntries.map(([toolId, result]) => {
          const toolName = getToolName(toolId);
          return (
            <ToolResultCard
              key={toolId}
              title={`${toolName} 결과`}
              text={result.text}
              onCopy={(text) => copyToClipboard(text, `${toolName} 결과 복사 완료`)}
            />
          );
        })}

        {/* 복사 버튼 그룹 */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyAll} className="flex-1">
            전체 복사
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 개별 도구 결과 카드 컴포넌트
interface ToolResultCardProps {
  title: string;
  text: string;
  onCopy: (text: string) => void;
}

function ToolResultCard({ title, text, onCopy }: ToolResultCardProps) {
  return (
    <div className="mb-6 rounded-lg border border-green-200 bg-white/50 p-4 dark:border-green-800 dark:bg-gray-900/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-3">
          <h4 className={`${TEXT_STYLES.sectionTitle} ${TEXT_STYLES.titleColor.green}`}>{title}</h4>
          <div>
            <p className={TEXT_STYLES.body}>{text}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs"
          onClick={() => onCopy(text)}
        >
          복사
        </Button>
      </div>
    </div>
  );
}
