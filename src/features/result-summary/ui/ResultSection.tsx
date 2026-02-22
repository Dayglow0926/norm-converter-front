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
  data?: Record<string, unknown>;
}

// 언어문제해결력 API 데이터 구조
interface ProblemSolvingData {
  causeReasonRawScore: number;
  causeReasonPercentileText: string;
  solutionInferenceRawScore: number;
  solutionInferencePercentileText: string;
  clueGuessingRawScore: number;
  clueGuessingPercentileText: string;
  totalRawScore: number;
  totalPercentileText: string;
  isUntestable: boolean;
}

// PRES API 데이터 구조
interface PresData {
  receptiveRawScore?: number;
  receptiveDevelopmentalAgeText?: string;
  receptivePercentileDisplay?: string;
  expressiveRawScore?: number;
  expressiveDevelopmentalAgeText?: string;
  expressivePercentileDisplay?: string;
  totalLangAgeText?: string;
  diagnosisLevel?: '정상발달' | '약간의 언어발달지체' | '언어장애' | null;
}

// CPLC API 데이터 구조
interface CplcData {
  discourseScore: number;
  discoursePercent: number;
  contextualScore: number;
  contextualPercent: number;
  communicationScore: number;
  communicationPercent: number;
  nonverbalScore: number;
  nonverbalPercent: number;
  totalScore: number;
  totalPercent: number;
}

// 도구별 복사 텍스트 생성 (테이블 포함)
function buildToolCopyText(toolId: string, result: ToolResult): string {
  let text = result.text;
  if (toolId === 'problem_solving' && result.data) {
    const d = result.data as unknown as ProblemSolvingData;
    if (!d.isUntestable) {
      text +=
        '\n\n' +
        [
          `\t원인이유\t해결추론\t단서추측\t총점`,
          `${d.causeReasonRawScore}점\t${d.solutionInferenceRawScore}점\t${d.clueGuessingRawScore}점\t${d.totalRawScore}점`,
        ].join('\n');
    }
  }
  if (toolId === 'pres' && result.data) {
    const d = result.data as unknown as PresData;
    const rows: string[] = [`\t수용언어\t표현언어`];
    if (d.receptiveDevelopmentalAgeText || d.expressiveDevelopmentalAgeText) {
      rows.push(`발달연령\t${d.receptiveDevelopmentalAgeText ?? '-'}\t${d.expressiveDevelopmentalAgeText ?? '-'}`);
    }
    if (d.receptivePercentileDisplay || d.expressivePercentileDisplay) {
      rows.push(`백분위\t${d.receptivePercentileDisplay ?? '-'}\t${d.expressivePercentileDisplay ?? '-'}`);
    }
    if (d.diagnosisLevel) {
      rows.push(`진단\t${d.diagnosisLevel}\t${d.diagnosisLevel}`);
    }
    if (d.totalLangAgeText) {
      rows.push(`통합언어 발달연령: ${d.totalLangAgeText}`);
    }
    if (rows.length > 1) text += '\n\n' + rows.join('\n');
  }
  if (toolId === 'cplc' && result.data) {
    const d = result.data as unknown as CplcData;
    text +=
      '\n\n' +
      [
        `담화관리\t상황조절\t의사소통의도\t비언어적\t총점`,
        `${d.discourseScore}점\n(${d.discoursePercent}%)\t${d.contextualScore}점\n(${d.contextualPercent}%)\t${d.communicationScore}점\n(${d.communicationPercent}%)\t${d.nonverbalScore}점\n(${d.nonverbalPercent}%)\t${d.totalScore}점\n(${d.totalPercent}%)`,
      ].join('\n');
  }
  return text;
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
        const escaped = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const html = `<pre style="font-family:'새굴림',sans-serif;font-size:10pt;margin:0;">${escaped}</pre>`;
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
            'text/html': new Blob([html], { type: 'text/html' }),
          }),
        ]);
        showCopyFeedback(feedbackMsg);
      } catch {
        // ClipboardItem 미지원 시 plain text fallback
        try {
          await navigator.clipboard.writeText(text);
          showCopyFeedback(feedbackMsg);
        } catch {
          showCopyFeedback('복사 실패');
        }
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
      lines.push(``, `■ ${toolName} 결과`, buildToolCopyText(toolId, result));
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
              toolId={toolId}
              title={`${toolName} 결과`}
              text={result.text}
              data={result.data}
              onCopy={(copyText) => copyToClipboard(copyText, `${toolName} 결과 복사 완료`)}
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

// 진단 결과 색상 클래스
function diagnosisColorClass(level?: string | null): string {
  if (level === '정상발달') return 'text-green-600 dark:text-green-400';
  if (level === '약간의 언어발달지체') return 'text-amber-600 dark:text-amber-400';
  if (level === '언어장애') return 'text-red-600 dark:text-red-400';
  return 'text-gray-500';
}

// PRES 결과 테이블 컴포넌트
function PresTable({ data }: { data: PresData }) {
  const hasReceptive = data.receptiveDevelopmentalAgeText !== undefined;
  const hasExpressive = data.expressiveDevelopmentalAgeText !== undefined;

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border">
            <th className="border px-2 py-2 text-center font-medium" />
            {hasReceptive && (
              <th className="border px-2 py-2 text-center font-medium">수용언어</th>
            )}
            {hasExpressive && (
              <th className="border px-2 py-2 text-center font-medium">표현언어</th>
            )}
          </tr>
        </thead>
        <tbody>
          <tr className="border">
            <td className="border px-2 py-2 text-center text-xs text-gray-500">발달연령</td>
            {hasReceptive && (
              <td className="border px-2 py-2 text-center">{data.receptiveDevelopmentalAgeText}</td>
            )}
            {hasExpressive && (
              <td className="border px-2 py-2 text-center">{data.expressiveDevelopmentalAgeText}</td>
            )}
          </tr>
          <tr className="border">
            <td className="border px-2 py-2 text-center text-xs text-gray-500">백분위</td>
            {hasReceptive && (
              <td className="border px-2 py-2 text-center">{data.receptivePercentileDisplay ?? '-'}</td>
            )}
            {hasExpressive && (
              <td className="border px-2 py-2 text-center">{data.expressivePercentileDisplay ?? '-'}</td>
            )}
          </tr>
          {data.diagnosisLevel && (
            <tr className="border">
              <td className="border px-2 py-2 text-center text-xs text-gray-500">진단</td>
              {hasReceptive && (
                <td className={`border px-2 py-2 text-center text-xs font-medium ${diagnosisColorClass(data.diagnosisLevel)}`}>
                  {data.diagnosisLevel}
                </td>
              )}
              {hasExpressive && (
                <td className={`border px-2 py-2 text-center text-xs font-medium ${diagnosisColorClass(data.diagnosisLevel)}`}>
                  {data.diagnosisLevel}
                </td>
              )}
            </tr>
          )}
          {data.totalLangAgeText && (
            <tr className="border">
              <td className="border px-2 py-2 text-center text-xs text-gray-500">통합언어</td>
              <td
                colSpan={(hasReceptive ? 1 : 0) + (hasExpressive ? 1 : 0)}
                className="border px-2 py-2 text-center"
              >
                {data.totalLangAgeText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// 언어문제해결력 결과 테이블 컴포넌트 (전치: 하위검사=열, 항목=행)
function ProblemSolvingTable({ data }: { data: ProblemSolvingData }) {
  if (data.isUntestable) return null;

  const cols = [
    {
      label: '원인이유',
      rawScore: data.causeReasonRawScore,
      percentile: data.causeReasonPercentileText,
    },
    {
      label: '해결추론',
      rawScore: data.solutionInferenceRawScore,
      percentile: data.solutionInferencePercentileText,
    },
    {
      label: '단서추측',
      rawScore: data.clueGuessingRawScore,
      percentile: data.clueGuessingPercentileText,
    },
    { label: '총점', rawScore: data.totalRawScore, percentile: data.totalPercentileText },
  ];

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border">
            {cols.map((col) => (
              <th key={col.label} className="border px-2 py-2 text-center font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border">
            {cols.map((col) => (
              <td key={col.label} className="border px-2 py-2 text-center">
                {col.rawScore}점
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// CPLC 결과 테이블 컴포넌트
function CplcTable({ data }: { data: CplcData }) {
  const cols = [
    { label: '담화관리', score: data.discourseScore, percent: data.discoursePercent },
    { label: '상황조절', score: data.contextualScore, percent: data.contextualPercent },
    { label: '의사소통의도', score: data.communicationScore, percent: data.communicationPercent },
    { label: '비언어적', score: data.nonverbalScore, percent: data.nonverbalPercent },
    { label: '총점', score: data.totalScore, percent: data.totalPercent },
  ];

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border">
            {cols.map((col) => (
              <th key={col.label} className="border px-2 py-2 text-center font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border">
            {cols.map((col) => (
              <td key={col.label} className="border px-2 py-2 text-center">
                <span className="block">{col.score}점</span>
                <span className="block text-xs text-gray-500">({col.percent}%)</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// 개별 도구 결과 카드 컴포넌트
interface ToolResultCardProps {
  toolId: string;
  title: string;
  text: string;
  data?: Record<string, unknown>;
  onCopy: (text: string) => void;
}

function ToolResultCard({ toolId, title, text, data, onCopy }: ToolResultCardProps) {
  const handleCopy = () => {
    onCopy(buildToolCopyText(toolId, { text, data }));
  };

  return (
    <div className="mb-6 rounded-lg border border-green-200 bg-white/50 p-4 dark:border-green-800 dark:bg-gray-900/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-3">
          <h4 className={`${TEXT_STYLES.sectionTitle} ${TEXT_STYLES.titleColor.green}`}>{title}</h4>
          <div>
            <p className={TEXT_STYLES.body}>{text}</p>
            {toolId === 'pres' && data && (
              <PresTable data={data as unknown as PresData} />
            )}
            {toolId === 'problem_solving' && data && (
              <ProblemSolvingTable data={data as unknown as ProblemSolvingData} />
            )}
            {toolId === 'cplc' && data && (
              <CplcTable data={data as unknown as CplcData} />
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs"
          onClick={handleCopy}
        >
          복사
        </Button>
      </div>
    </div>
  );
}
