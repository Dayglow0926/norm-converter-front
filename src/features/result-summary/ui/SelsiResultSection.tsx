'use client';

/**
 * SELSI 결과 표시 & 복사 섹션
 * 점수 입력 페이지 내에서 결과 확인 후 표시
 * API 응답의 resultText, responseText, integratedSummary를 표시
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ChildInfo, AgeResult } from '@/entities/child';
import type { SelsiApiResult } from '@/features/score-entry';

interface SelsiScores {
  receptive: number | null;
  expressive: number | null;
}

interface SelsiResults {
  receptive: number | null;
  expressive: number | null;
  combined: number | null;
}

interface SelsiResultSectionProps {
  childInfo: ChildInfo;
  ageResult: AgeResult;
  scores: SelsiScores;
  results: SelsiResults;
  apiResult?: SelsiApiResult | null;
  integratedSummary?: string | null;
}

// 등가연령 포맷 (개월 → "N세 M개월" 또는 "N개월")
function formatEquivalentAge(months: number | null): string {
  if (months === null) return '-';
  if (months < 12) return `${months}개월`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years}세`;
  return `${years}세 ${remainingMonths}개월`;
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

export function SelsiResultSection({
  childInfo,
  ageResult,
  scores,
  results,
  apiResult,
  integratedSummary,
}: SelsiResultSectionProps) {
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
    const combinedScore = (scores.receptive ?? 0) + (scores.expressive ?? 0);
    const lines = [
      `[SELSI 검사 결과]`,
      ``,
      `■ 아동 정보`,
      `이름: ${childInfo.name}`,
      `성별: ${childInfo.gender === 'male' ? '남' : '여'}`,
      `생년월일: ${formatDate(childInfo.birthDate)}`,
      `검사일: ${formatDate(childInfo.testDate)}`,
      `생활연령: ${formatAge(ageResult)}`,
      ``,
      `■ 검사 결과`,
      `수용언어: 원점수 ${scores.receptive}점, 등가연령 ${formatEquivalentAge(results.receptive)}`,
      `표현언어: 원점수 ${scores.expressive}점, 등가연령 ${formatEquivalentAge(results.expressive)}`,
      `통합: 원점수 ${combinedScore}점, 등가연령 ${formatEquivalentAge(results.combined)}`,
    ];

    // API 결과 텍스트 추가
    if (apiResult) {
      lines.push(``, `■ 결과 문장`, apiResult.resultText);
      if (apiResult.responseText) {
        lines.push(``, `■ 응답 문장`, apiResult.responseText);
      }
    }

    // 통합 요약 추가
    if (integratedSummary) {
      lines.push(``, `■ 통합 요약`, integratedSummary);
    }

    copyToClipboard(lines.join('\n'), '전체 복사 완료');
  };

  return (
    <Card className="mt-6 w-full border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-800 dark:text-green-200">검사 결과</CardTitle>
          {copyFeedback && (
            <span className="animate-fade-in rounded-full bg-green-600 px-3 py-1 text-sm text-white">
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
                <h4 className="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-200">
                  통합 요약
                </h4>
                <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {integratedSummary}
                </p>
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

        {/* SELSI 결과 (타이틀 + 결과 문장 + 응답 문장) */}
        {apiResult && (
          <div className="mb-6 rounded-lg border border-green-200 bg-white/50 p-4 dark:border-green-800 dark:bg-gray-900/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-3">
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
                  SELSI 결과
                </h4>
                <div>
                  <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {apiResult.resultText}
                  </p>
                </div>
                {apiResult.responseText && (
                  <div>
                    <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {apiResult.responseText}
                    </p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2 text-xs"
                onClick={() => {
                  const text = apiResult.responseText
                    ? `${apiResult.resultText}\n\n${apiResult.responseText}`
                    : apiResult.resultText;
                  copyToClipboard(text, '결과 복사 완료');
                }}
              >
                복사
              </Button>
            </div>
          </div>
        )}

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
