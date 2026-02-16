'use client';

/**
 * 검사 결과 표시 섹션
 * 여러 검사 도구(SELSI, PRES, REVT 등)의 결과를 통합 표시
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ChildInfo, AgeResult } from '@/entities/child';
import type { SelsiApiResult } from '@/features/score-entry';

// =========================================
// 텍스트 스타일 상수 (한 곳에서 관리)
// =========================================
const TEXT_STYLES = {
  // 섹션 제목 (통합 요약, SELSI 결과 등)
  sectionTitle: 'text-sm font-semibold',
  // 본문 텍스트 (결과 내용)
  body: 'text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300',
  // 컬러 테마별 제목 색상
  titleColor: {
    blue: 'text-blue-800 dark:text-blue-200', // 통합 요약용
    green: 'text-green-800 dark:text-green-200', // 도구 결과용
  },
} as const;

// 도구별 결과 타입
interface ToolResults {
  selsi?: SelsiApiResult | null;
  // 향후 추가
  // pres?: PresApiResult | null;
  // revt?: RevtApiResult | null;
}

interface ResultSectionProps {
  childInfo: ChildInfo;
  ageResult: AgeResult;
  results: ToolResults;
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

export function ResultSection({
  childInfo,
  ageResult,
  results,
  integratedSummary,
}: ResultSectionProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // 복사 완료 피드백 표시
  const showCopyFeedback = useCallback((message: string) => {
    setCopyFeedback(message);
    setTimeout(() => setCopyFeedback(null), 2000);
  }, []);

  // 클립보드 복사
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

  // 전체 복사 (아동 정보 + 모든 결과 + API 텍스트)
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

    // SELSI 결과
    if (results.selsi) {
      lines.push(``, `■ SELSI 결과`, results.selsi.text);
      if (results.selsi.responseText) {
        lines.push(results.selsi.responseText);
      }
    }

    // 향후 다른 도구 결과 추가
    // if (results.pres) { ... }
    // if (results.revt) { ... }

    // 통합 요약 추가
    if (integratedSummary) {
      lines.push(``, `■ 통합 요약`, integratedSummary);
    }

    copyToClipboard(lines.join('\n'), '전체 복사 완료');
  };

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

        {/* SELSI 결과 */}
        {results.selsi && (
          <ToolResultCard
            title="SELSI 결과"
            text={results.selsi.text}
            onCopy={(text) => copyToClipboard(text, 'SELSI 결과 복사 완료')}
          />
        )}

        {/* 향후 다른 도구 결과 추가 */}
        {/* {results.pres && <ToolResultCard title="PRES 결과" ... />} */}
        {/* {results.revt && <ToolResultCard title="REVT 결과" ... />} */}

        {/* 복사 버튼 그룹 */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyAll} className="flex-1">
            📋 전체 복사
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
  const fullText = text;

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
          onClick={() => onCopy(fullText)}
        >
          복사
        </Button>
      </div>
    </div>
  );
}
