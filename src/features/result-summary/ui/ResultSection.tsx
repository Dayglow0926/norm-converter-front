'use client';

/**
 * 검사 결과 표시 섹션
 * 여러 검사 도구(SELSI, PRES, REVT 등)의 결과를 통합 표시
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CPLC_RESULT_NOTE,
  CPLC_SUBTESTS,
  CPLC_TOTAL,
  KCELF5_ORS_LABELS,
  KCELF5_PP_LABELS,
  LANGUAGE_ANALYSIS_UI,
  PROBLEM_SOLVING_LABELS,
  TOOL_METADATA,
  buildLanguageAnalysisPrompt,
  type KmbCdiToolData,
  type AssessmentToolId,
} from '@/entities/assessment-tool';
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
  causeReasonPercentile?: number | null;
  causeReasonPercentileText: string;
  causeReasonExampleTexts?: string[];
  solutionInferenceRawScore: number;
  solutionInferencePercentile?: number | null;
  solutionInferencePercentileText: string;
  solutionInferenceExampleTexts?: string[];
  clueGuessingRawScore: number;
  clueGuessingPercentile?: number | null;
  clueGuessingPercentileText: string;
  clueGuessingExampleTexts?: string[];
  totalRawScore: number;
  totalPercentile?: number | null;
  totalPercentileText: string;
  isUntestable: boolean;
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

// K-CELF-5 PP API 데이터 구조
interface Kcelf5PpData {
  conversationScore: number;
  conversationPercent: number;
  informationScore: number;
  informationPercent: number;
  nonverbalScore: number;
  nonverbalPercent: number;
  totalScore: number;
  totalPercent: number;
}

// K-CELF-5 ORS API 데이터 구조
interface Kcelf5OrsData {
  listeningScore: number;
  listeningPercent: number;
  speakingScore: number;
  speakingPercent: number;
  readingScore: number;
  readingPercent: number;
  writingScore: number;
  writingPercent: number;
  totalScore: number;
  totalPercent: number;
}

function getKcelf5PpScoreCols(data: Kcelf5PpData) {
  return [
    {
      label: KCELF5_PP_LABELS.conversation,
      score: data.conversationScore,
      percent: data.conversationPercent,
    },
    {
      label: KCELF5_PP_LABELS.information,
      score: data.informationScore,
      percent: data.informationPercent,
    },
    {
      label: KCELF5_PP_LABELS.nonverbal,
      score: data.nonverbalScore,
      percent: data.nonverbalPercent,
    },
    {
      label: KCELF5_PP_LABELS.total,
      score: data.totalScore,
      percent: data.totalPercent,
    },
  ];
}

function getKcelf5OrsScoreCols(data: Kcelf5OrsData) {
  return [
    {
      label: KCELF5_ORS_LABELS.listening,
      score: data.listeningScore,
      percent: data.listeningPercent,
    },
    {
      label: KCELF5_ORS_LABELS.speaking,
      score: data.speakingScore,
      percent: data.speakingPercent,
    },
    {
      label: KCELF5_ORS_LABELS.reading,
      score: data.readingScore,
      percent: data.readingPercent,
    },
    {
      label: KCELF5_ORS_LABELS.writing,
      score: data.writingScore,
      percent: data.writingPercent,
    },
    {
      label: KCELF5_ORS_LABELS.total,
      score: data.totalScore,
      percent: data.totalPercent,
    },
  ];
}

function getCplcScoreCols(data: CplcData) {
  return [
    {
      label: CPLC_SUBTESTS[0].headerLabel,
      score: data.discourseScore,
      percent: data.discoursePercent,
    },
    {
      label: CPLC_SUBTESTS[1].headerLabel,
      score: data.contextualScore,
      percent: data.contextualPercent,
    },
    {
      label: CPLC_SUBTESTS[2].headerLabel,
      score: data.communicationScore,
      percent: data.communicationPercent,
    },
    {
      label: CPLC_SUBTESTS[3].headerLabel,
      score: data.nonverbalScore,
      percent: data.nonverbalPercent,
    },
    {
      label: CPLC_TOTAL.headerLabel,
      score: data.totalScore,
      percent: data.totalPercent,
    },
  ];
}

// HTML 테이블 생성 헬퍼 (점수+백분율 열 구조)
const HEADER_BG = 'background-color:rgb(182,221,232);';
const H_BORDER = 'border-top:2.25pt solid black;border-bottom:2.25pt solid black;';
const V_HIDDEN_TH =
  'border-left:2.25pt solid rgb(182,221,232);border-right:2.25pt solid rgb(182,221,232);';
const V_HIDDEN_TD = 'border-left:2.25pt solid white;border-right:2.25pt solid white;';
const BASE =
  "padding:0px 8px;text-align:center;vertical-align:middle;font-family:'새굴림',sans-serif;font-size:10pt; ";
const TH_STYLE = H_BORDER + V_HIDDEN_TH + BASE + HEADER_BG;
const TD_STYLE = H_BORDER + V_HIDDEN_TD + BASE + 'font-weight:normal;';

function htmlScoreTable(
  cols: { label: string; score: number; percent: number }[],
  leadingCol?: { header: string; cell: string }
): string {
  const totalCols = cols.length + (leadingCol ? 1 : 0);
  const colWidth = `${(100 / totalCols).toFixed(4)}%`;
  const colTags = Array(totalCols).fill(`<col style="width:${colWidth};">`).join('');

  const P = `style="margin:0;padding:0;"`;
  const BOLD_TH_STYLE = TH_STYLE + 'font-weight:bold;';
  const leadingTh = leadingCol
    ? `<th valign="middle" style="${BOLD_TH_STYLE}"><p ${P}>${leadingCol.header}</p></th>`
    : '';
  const leadingTd = leadingCol
    ? `<td valign="middle" style="${BOLD_TH_STYLE}"><p ${P}>${leadingCol.cell}</p></td>`
    : '';

  const ths = cols
    .map(
      (c) =>
        `<th valign="middle" style="${TH_STYLE}"><p ${P}>${c.label.replace(/\n/g, '<br>')}</p></th>`
    )
    .join('');
  const tds = cols
    .map(
      (c) =>
        `<td valign="middle" style="${TD_STYLE}"><p ${P}>${c.score}점</p><p ${P}>(${c.percent}%)</p></td>`
    )
    .join('');

  return `<table style="border-collapse:collapse;width:100%;table-layout:fixed;"><colgroup>${colTags}</colgroup><thead><tr>${leadingTh}${ths}</tr></thead><tbody><tr>${leadingTd}${tds}</tr></tbody></table>`;
}

// 언어문제해결력 전용 HTML 테이블 (원점수/백분위수 2행 구조)
function htmlProblemSolvingTable(d: ProblemSolvingData): string {
  const cols = [
    {
      label: PROBLEM_SOLVING_LABELS.causeReason,
      rawScore: d.causeReasonRawScore,
      percentile: d.causeReasonPercentileText,
    },
    {
      label: PROBLEM_SOLVING_LABELS.solutionInference,
      rawScore: d.solutionInferenceRawScore,
      percentile: d.solutionInferencePercentileText,
    },
    {
      label: PROBLEM_SOLVING_LABELS.clueGuessing,
      rawScore: d.clueGuessingRawScore,
      percentile: d.clueGuessingPercentileText,
    },
    {
      label: PROBLEM_SOLVING_LABELS.total,
      rawScore: d.totalRawScore,
      percentile: d.totalPercentileText,
    },
  ];
  const totalCols = cols.length + 1;
  const colWidth = `${(100 / totalCols).toFixed(4)}%`;
  const colTags = Array(totalCols).fill(`<col style="width:${colWidth};">`).join('');

  // 행별 개별 border 스타일 (원점수-백분위수 사이 가로선 0pt)
  const mkTh = (top: string, bot: string) =>
    `border-top:${top};border-bottom:${bot};border-left:2.25pt solid rgb(182,221,232);border-right:2.25pt solid rgb(182,221,232);` +
    BASE +
    HEADER_BG;
  const mkTd = (top: string, bot: string) =>
    `border-top:${top};border-bottom:${bot};border-left:2.25pt solid white;border-right:2.25pt solid white;` +
    BASE +
    'font-weight:normal;';

  const ROW1_TH =
    mkTh('2.25pt solid black', '0pt solid transparent') + 'padding-bottom:0;font-weight:bold;';
  const ROW1_TD = mkTd('2.25pt solid black', '0pt solid transparent') + 'padding-bottom:0;';
  const ROW2_TH =
    mkTh('0pt solid transparent', '2.25pt solid black') + 'padding-top:0;font-weight:bold;';
  const ROW2_TD = mkTd('0pt solid transparent', '2.25pt solid black') + 'padding-top:0;';

  const P = `style="margin:0;padding:0;"`;
  const headerRow = `<tr><th valign="middle" style="${TH_STYLE}"><p ${P}></p></th>${cols.map((c) => `<th valign="middle" style="${TH_STYLE}"><p ${P}>${c.label}</p></th>`).join('')}</tr>`;
  const rawRow = `<tr><td valign="middle" style="${ROW1_TH}"><p ${P}>${PROBLEM_SOLVING_LABELS.rawScore}</p></td>${cols.map((c) => `<td valign="middle" style="${ROW1_TD}"><p ${P}>${c.rawScore}점</p></td>`).join('')}</tr>`;
  const pctRow = `<tr><td valign="middle" style="${ROW2_TH}"><p ${P}>${PROBLEM_SOLVING_LABELS.percentile}</p></td>${cols.map((c) => `<td valign="middle" style="${ROW2_TD}"><p ${P}>${c.percentile}</p></td>`).join('')}</tr>`;

  return `<table style="border-collapse:collapse;width:100%;table-layout:fixed;"><colgroup>${colTags}</colgroup><thead>${headerRow}</thead><tbody>${rawRow}${pctRow}</tbody></table>`;
}

function buildKmbCdiCopyRows(data: KmbCdiToolData) {
  const leftRows = data.vocabularyRows.filter((row) => row.id <= 13);
  const rightRows = data.vocabularyRows.filter((row) => row.id >= 14);

  return leftRows.map((leftRow, index) => {
    const rightRow = rightRows[index];
    const isSummaryStart = index === rightRows.length;

    return {
      left: leftRow,
      right: rightRow ?? null,
      summary:
        isSummaryStart
          ? {
              label: '합계',
              expressiveText: `${data.expressiveTotal}/${data.expressiveMax}`,
              receptiveText: `${data.receptiveTotal}/${data.receptiveMax}`,
            }
          : null,
    };
  });
}

function htmlKmbCdiTable(data: KmbCdiToolData): string {
  const rows = buildKmbCdiCopyRows(data);
  const summaryRowIndex = rows.findIndex((row) => row.summary !== null);
  const summaryRowSpan = summaryRowIndex >= 0 ? rows.length - summaryRowIndex : 1;
  const P = `style="margin:0;padding:0;"`;
  const borderStrong = '2px solid black';
  const borderSoft = '1px solid rgb(226,232,240)';
  const divider = '2px solid black';
  const headerStyle =
    `${BASE}${HEADER_BG}border-top:${borderStrong};border-bottom:${borderStrong};font-weight:500;`;
  const bodyStyle = `${BASE}border-bottom:${borderSoft};`;
  const summaryStyle =
    `${BASE}border:2px solid black;font-weight:500;`;
  const colTags = [
    '<col style="width:6%;">',
    '<col style="width:19%;">',
    '<col style="width:12.5%;">',
    '<col style="width:12.5%;">',
    '<col style="width:6%;">',
    '<col style="width:19%;">',
    '<col style="width:12.5%;">',
    '<col style="width:12.5%;">',
  ].join('');

  const headerCells = [
    '번호',
    '범주',
    '표현(개)',
    '수용(개)',
    '번호',
    '범주',
    '표현(개)',
    '수용(개)',
  ]
    .map((label) => `<th valign="middle" style="${headerStyle}"><p ${P}>${label}</p></th>`)
    .join('');

  const bodyRows = rows
    .map(({ left, right, summary }, index) => {
      const leftCells = [
        left.id,
        left.label,
        `${left.expressiveScore}/${left.expressiveMax}`,
        `${left.receptiveScore}/${left.receptiveMax}`,
      ]
        .map((value, cellIndex) => {
          const dividerStyle = cellIndex === 3 ? `border-right:${divider};` : '';
          return `<td valign="middle" style="${bodyStyle}${dividerStyle}"><p ${P}>${value}</p></td>`;
        })
        .join('');

      if (right) {
        const rightCells = [
          right.id,
          right.label,
          `${right.expressiveScore}/${right.expressiveMax}`,
          `${right.receptiveScore}/${right.receptiveMax}`,
        ]
          .map((value) => `<td valign="middle" style="${bodyStyle}"><p ${P}>${value}</p></td>`)
          .join('');
        return `<tr>${leftCells}${rightCells}</tr>`;
      }

      if (summary) {
        const summaryLabelCell = `<td colspan="2" valign="middle" style="${summaryStyle}" rowspan="${summaryRowSpan}"><p ${P}>${summary.label}</p></td>`;
        const summaryValueCells = [summary.expressiveText, summary.receptiveText]
          .map((value) => `<td valign="middle" style="${summaryStyle}" rowspan="${summaryRowSpan}"><p ${P}>${value}</p></td>`)
          .join('');
        return `<tr>${leftCells}${summaryLabelCell}${summaryValueCells}</tr>`;
      }

      if (summaryRowIndex >= 0 && index > summaryRowIndex) {
        return `<tr>${leftCells}</tr>`;
      }

      const emptyCells = Array.from({ length: 4 }, () => `<td valign="middle" style="${bodyStyle}"><p ${P}></p></td>`).join('');
      return `<tr>${leftCells}${emptyCells}</tr>`;
    })
    .join('');

  return `<table style="border-collapse:collapse;width:100%;table-layout:fixed;"><colgroup>${colTags}</colgroup><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

// 도구별 HTML 복사 내용 생성 (표가 있는 도구만, 없으면 null)
function buildToolCopyHtml(toolId: string, result: ToolResult): string | null {
  if (!result.data) return null;
  const escaped = result.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  const textHtml = `<p style="font-family:'새굴림',sans-serif;font-size:10pt;margin:0 0 8px 0;">${escaped}</p>`;

  if (toolId === 'problem_solving') {
    const d = result.data as unknown as ProblemSolvingData;
    if (d.isUntestable) return null;
    return textHtml + htmlProblemSolvingTable(d);
  }
  if (toolId === 'cplc') {
    const d = result.data as unknown as CplcData;
    return (
      textHtml +
      htmlScoreTable(getCplcScoreCols(d), { header: '영역', cell: '점수' })
    );
  }
  if (toolId === 'kcelf5_pp') {
    const d = result.data as unknown as Kcelf5PpData;
    return textHtml + htmlScoreTable(getKcelf5PpScoreCols(d));
  }
  if (toolId === 'kcelf5_ors') {
    const d = result.data as unknown as Kcelf5OrsData;
    return textHtml + htmlScoreTable(getKcelf5OrsScoreCols(d));
  }
  if (toolId === 'kmb_cdi') {
    const d = result.data as unknown as KmbCdiToolData;
    return textHtml + htmlKmbCdiTable(d);
  }
  return null;
}

// 도구별 복사 텍스트 생성 (테이블 포함)
function buildToolCopyText(toolId: string, result: ToolResult, step2Text?: string | null): string {
  // 언어분석: LLM 보고서(Step 2)가 있으면 우선 사용
  if (toolId === 'language_analysis' && step2Text) {
    return step2Text;
  }
  let text = result.text;
  if (toolId === 'problem_solving' && result.data) {
    const d = result.data as unknown as ProblemSolvingData;
    if (!d.isUntestable) {
      text +=
        '\n\n' +
        [
          `\t${PROBLEM_SOLVING_LABELS.causeReason}\t${PROBLEM_SOLVING_LABELS.solutionInference}\t${PROBLEM_SOLVING_LABELS.clueGuessing}\t${PROBLEM_SOLVING_LABELS.total}`,
          `${PROBLEM_SOLVING_LABELS.rawScore}\t${d.causeReasonRawScore}점\t${d.solutionInferenceRawScore}점\t${d.clueGuessingRawScore}점\t${d.totalRawScore}점`,
          `${PROBLEM_SOLVING_LABELS.percentile}\t${d.causeReasonPercentileText}\t${d.solutionInferencePercentileText}\t${d.clueGuessingPercentileText}\t${d.totalPercentileText}`,
        ].join('\n');
    }
  }
  if (toolId === 'cplc' && result.data) {
    const d = result.data as unknown as CplcData;
    const cols = getCplcScoreCols(d);
    text +=
      '\n\n' +
      [
        ['영역', ...cols.map((col) => col.label)].join('\t'),
        `점수\t${d.discourseScore}점\n(${d.discoursePercent}%)\t${d.contextualScore}점\n(${d.contextualPercent}%)\t${d.communicationScore}점\n(${d.communicationPercent}%)\t${d.nonverbalScore}점\n(${d.nonverbalPercent}%)\t${d.totalScore}점\n(${d.totalPercent}%)`,
      ].join('\n');
  }
  if (toolId === 'kcelf5_pp' && result.data) {
    const cols = getKcelf5PpScoreCols(result.data as unknown as Kcelf5PpData);
    text +=
      '\n\n' +
      [
        cols.map((col) => col.label).join('\t'),
        cols.map((col) => `${col.score}점\n(${col.percent}%)`).join('\t'),
      ].join('\n');
  }
  if (toolId === 'kcelf5_ors' && result.data) {
    const cols = getKcelf5OrsScoreCols(result.data as unknown as Kcelf5OrsData);
    text +=
      '\n\n' +
      [
        cols.map((col) => col.label).join('\t'),
        cols.map((col) => `${col.score}점\n(${col.percent}%)`).join('\t'),
      ].join('\n');
  }
  if (toolId === 'kmb_cdi' && result.data) {
    const d = result.data as unknown as KmbCdiToolData;
    const rows = buildKmbCdiCopyRows(d);

    text +=
      '\n\n' +
      [
        [
          '번호',
          '범주',
          '표현(개)',
          '수용(개)',
          '번호',
          '범주',
          '표현(개)',
          '수용(개)',
        ].join('\t'),
        ...rows.map(({ left, right, summary }) =>
          [
            left.id,
            left.label,
            `${left.expressiveScore}/${left.expressiveMax}`,
            `${left.receptiveScore}/${left.receptiveMax}`,
            ...(right
              ? [
                  right.id,
                  right.label,
                  `${right.expressiveScore}/${right.expressiveMax}`,
                  `${right.receptiveScore}/${right.receptiveMax}`,
                ]
              : summary
                ? ['', summary.label, summary.expressiveText, summary.receptiveText]
                : ['', '', '', '']),
          ].join('\t')
        ),
      ].join('\n');
  }
  return text;
}

interface ResultSectionProps {
  childInfo: ChildInfo;
  ageResult: AgeResult;
  results: Record<string, ToolResult>;
  integratedSummary?: string | null;
  laStep2Text?: string | null;
  onGenerateLLM?: () => Promise<void>;
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

function renderMultilineLabel(label: string) {
  return label.split('\n').map((line, index) => (
    <span
      key={`${label}-${index}`}
      className={index === 0 ? 'block' : 'mt-0.5 block text-xs font-medium'}
    >
      {line}
    </span>
  ));
}

function orderToolEntries(entries: Array<[string, ToolResult]>): Array<[string, ToolResult]> {
  const TOOL_ORDER: Record<string, number> = {
    pres: 2,
    selsi: 3,
    kmb_cdi: 4,
    revt: 6,
    kcelf5_pp: 7,
    kcelf5_ors: 8,
    syntax: 9,
    problem_solving: 10,
    cplc: 13,
    language_analysis: 14,
    apac: 15,
  };

  return [...entries].sort(([a], [b]) => {
    const aOrder = TOOL_ORDER[a] ?? Number.MAX_SAFE_INTEGER;
    const bOrder = TOOL_ORDER[b] ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.localeCompare(b);
  });
}

export function ResultSection({
  childInfo,
  ageResult,
  results,
  integratedSummary,
  laStep2Text,
  onGenerateLLM,
}: ResultSectionProps) {
  const copyToClipboard = useCallback(
    async (text: string, feedbackMsg: string, htmlOverride?: string) => {
      try {
        const html =
          htmlOverride ??
          (() => {
            const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<pre style="font-family:'새굴림',sans-serif;font-size:10pt;margin:0;">${escaped}</pre>`;
          })();
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
            'text/html': new Blob([html], { type: 'text/html' }),
          }),
        ]);
        toast.success(feedbackMsg);
      } catch {
        // ClipboardItem 미지원 시 plain text fallback
        try {
          await navigator.clipboard.writeText(text);
          toast.success(feedbackMsg);
        } catch {
          toast.error('복사 실패');
        }
      }
    },
    []
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
    for (const [toolId, result] of orderToolEntries(Object.entries(results))) {
      const toolName = getToolName(toolId);
      lines.push(
        ``,
        `■ ${toolName} 결과`,
        buildToolCopyText(toolId, result, toolId === 'language_analysis' ? laStep2Text : null)
      );
    }

    // 통합 요약 추가
    if (integratedSummary) {
      lines.push(``, `■ 통합 요약`, integratedSummary);
    }

    copyToClipboard(lines.join('\n'), '전체 복사 완료');
  };

  const toolEntries = orderToolEntries(Object.entries(results));

  return (
    <Card className="mt-6 w-full border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
      <CardHeader>
        <CardTitle className="text-green-800 dark:text-green-200">검사 결과</CardTitle>
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
          if (toolId === 'language_analysis') {
            return (
              <LanguageAnalysisResultCard
                key={toolId}
                title={`${toolName} 결과`}
                step1Text={result.text}
                step2Text={laStep2Text}
                onGenerateLLM={onGenerateLLM}
                onCopyPrompt={() =>
                  copyToClipboard(
                    buildLanguageAnalysisPrompt({
                      gender: childInfo.gender,
                      ageText: formatAge(ageResult),
                      step1Text: result.text,
                    }),
                    LANGUAGE_ANALYSIS_UI.copyPromptToast
                  )
                }
                onCopy={(text) => copyToClipboard(text, `${toolName} 결과 복사 완료`)}
              />
            );
          }
          return (
            <ToolResultCard
              key={toolId}
              toolId={toolId}
              title={`${toolName} 결과`}
              text={result.text}
              data={result.data}
              onCopy={(copyText, copyHtml) =>
                copyToClipboard(copyText, `${toolName} 결과 복사 완료`, copyHtml)
              }
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

// 공통 테이블 헤더 배경색
const TH_BG: React.CSSProperties = { backgroundColor: 'rgb(182,221,232)' };

// 언어문제해결력 결과 테이블 컴포넌트 (원점수/백분위수 2행 + 앞 컬럼)
function ProblemSolvingTable({ data }: { data: ProblemSolvingData }) {
  if (data.isUntestable) return null;

  const cols = [
    {
      label: PROBLEM_SOLVING_LABELS.causeReason,
      rawScore: data.causeReasonRawScore,
      percentile: data.causeReasonPercentileText,
    },
    {
      label: PROBLEM_SOLVING_LABELS.solutionInference,
      rawScore: data.solutionInferenceRawScore,
      percentile: data.solutionInferencePercentileText,
    },
    {
      label: PROBLEM_SOLVING_LABELS.clueGuessing,
      rawScore: data.clueGuessingRawScore,
      percentile: data.clueGuessingPercentileText,
    },
    {
      label: PROBLEM_SOLVING_LABELS.total,
      rawScore: data.totalRawScore,
      percentile: data.totalPercentileText,
    },
  ];

  const B = '2px solid black';

  return (
    <div className="mt-3 overflow-x-auto">
      <table
        className="w-full text-sm"
        style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
      >
        <thead>
          <tr>
            <th
              className="px-2 py-2 text-center align-middle font-medium"
              style={{ ...TH_BG, borderTop: B, borderBottom: B }}
            />
            {cols.map((col) => (
              <th
                key={col.label}
                className="px-2 py-2 text-center align-middle font-medium"
                style={{ ...TH_BG, borderTop: B, borderBottom: B }}
              >
                {renderMultilineLabel(col.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              className="px-2 pt-2 pb-0 text-center align-middle font-bold"
              style={{ ...TH_BG, borderTop: B }}
            >
              {PROBLEM_SOLVING_LABELS.rawScore}
            </td>
            {cols.map((col) => (
              <td
                key={col.label}
                className="px-2 pt-2 pb-0 text-center align-middle"
                style={{ borderTop: B }}
              >
                {col.rawScore}점
              </td>
            ))}
          </tr>
          <tr>
            <td
              className="px-2 pt-0 pb-2 text-center align-middle font-bold"
              style={{ ...TH_BG, borderBottom: B }}
            >
              {PROBLEM_SOLVING_LABELS.percentile}
            </td>
            {cols.map((col) => (
              <td
                key={col.label}
                className="px-2 pt-0 pb-2 text-center align-middle"
                style={{ borderBottom: B }}
              >
                {col.percentile}
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
  const cols = getCplcScoreCols(data);
  const B = '2px solid black';

  return (
    <div className="mt-3 overflow-x-auto">
      <table
        className="w-full text-sm"
        style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
      >
        <thead>
          <tr>
            <th
              className="px-2 py-2 text-center align-middle font-bold"
              style={{ ...TH_BG, borderTop: B, borderBottom: B }}
            >
              영역
            </th>
            {cols.map((col) => (
              <th
                key={col.label}
                className="px-2 py-2 text-center align-middle font-medium"
                style={{ ...TH_BG, borderTop: B, borderBottom: B }}
              >
                {renderMultilineLabel(col.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              className="px-2 py-2 text-center align-middle font-bold"
              style={{ ...TH_BG, borderTop: B, borderBottom: B }}
            >
              점수
            </td>
            {cols.map((col) => (
              <td
                key={col.label}
                className="px-2 py-2 text-center align-middle"
                style={{ borderTop: B, borderBottom: B }}
              >
                <span className="block">{col.score}점</span>
                <span className="block text-xs text-gray-500">({col.percent}%)</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="text-muted-foreground mt-2 text-xs">{CPLC_RESULT_NOTE}</p>
    </div>
  );
}

// K-CELF-5 PP 결과 테이블 컴포넌트
function Kcelf5PpTable({ data }: { data: Kcelf5PpData }) {
  const cols = getKcelf5PpScoreCols(data);
  const B = '2px solid black';

  return (
    <div className="mt-3 overflow-x-auto">
      <table
        className="w-full text-sm"
        style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
      >
        <thead>
          <tr>
            {cols.map((col) => (
              <th
                key={col.label}
                className="px-2 py-2 text-center align-middle font-medium"
                style={{ ...TH_BG, borderTop: B, borderBottom: B }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {cols.map((col) => (
              <td
                key={col.label}
                className="px-2 py-2 text-center align-middle"
                style={{ borderTop: B, borderBottom: B }}
              >
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

// K-CELF-5 ORS 결과 테이블 컴포넌트
function Kcelf5OrsTable({ data }: { data: Kcelf5OrsData }) {
  const cols = getKcelf5OrsScoreCols(data);

  const B = '2px solid black';

  return (
    <div className="mt-3 overflow-x-auto">
      <table
        className="w-full text-sm"
        style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
      >
        <thead>
          <tr>
            {cols.map((col) => (
              <th
                key={col.label}
                className="px-2 py-2 text-center align-middle font-medium"
                style={{ ...TH_BG, borderTop: B, borderBottom: B }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {cols.map((col) => (
              <td
                key={col.label}
                className="px-2 py-2 text-center align-middle"
                style={{ borderTop: B, borderBottom: B }}
              >
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

function KmbCdiTable({ data }: { data: KmbCdiToolData }) {
  const leftRows = data.vocabularyRows.filter((row) => row.id <= 13);
  const rightRows = data.vocabularyRows.filter((row) => row.id >= 14);
  const B = '2px solid black';
  const ROW_BORDER = '1px solid rgb(226,232,240)';
  const DIVIDER_BORDER = '2px solid black';
  const summaryRowIndex = rightRows.length;
  const summaryRowSpan = leftRows.length - rightRows.length;

  return (
    <div className="mt-3 overflow-x-auto">
      <table
        className="w-full text-sm"
        style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
      >
        <thead>
          <tr>
            <th
              className="w-12 px-2 py-2 text-center align-middle font-medium"
              style={{ ...TH_BG, borderTop: B, borderBottom: B }}
            >
              번호
            </th>
            <th
              className="px-2 py-2 text-center align-middle font-medium"
              style={{ ...TH_BG, borderTop: B, borderBottom: B }}
            >
              범주
            </th>
            <th
              className="w-16 px-1 py-2 text-center align-middle font-medium"
              style={{ ...TH_BG, borderTop: B, borderBottom: B }}
            >
              표현(개)
            </th>
            <th
              className="w-16 px-1 py-2 text-center align-middle font-medium"
              style={{ ...TH_BG, borderTop: B, borderBottom: B, borderRight: DIVIDER_BORDER }}
            >
              수용(개)
            </th>
            <th
              className="w-12 px-2 py-2 text-center align-middle font-medium"
              style={{ ...TH_BG, borderTop: B, borderBottom: B }}
            >
              번호
            </th>
            <th
              className="px-2 py-2 text-center align-middle font-medium"
              style={{ ...TH_BG, borderTop: B, borderBottom: B }}
            >
              범주
            </th>
            <th
              className="w-16 px-1 py-2 text-center align-middle font-medium"
              style={{ ...TH_BG, borderTop: B, borderBottom: B }}
            >
              표현(개)
            </th>
            <th
              className="w-16 px-1 py-2 text-center align-middle font-medium"
              style={{ ...TH_BG, borderTop: B, borderBottom: B }}
            >
              수용(개)
            </th>
          </tr>
        </thead>
        <tbody>
          {leftRows.map((row, index) => {
            const rightRow = rightRows[index];
            const isSummaryStart = index === summaryRowIndex;

            return (
              <tr key={row.id}>
                <td
                  className="px-2 py-2 text-center align-middle"
                  style={{ borderBottom: ROW_BORDER }}
                >
                  {row.id}
                </td>
                <td
                  className="px-2 py-2 text-center align-middle"
                  style={{ borderBottom: ROW_BORDER }}
                >
                  {row.label}
                </td>
                <td
                  className="px-1 py-2 text-center align-middle"
                  style={{ borderBottom: ROW_BORDER }}
                >
                  {row.expressiveScore}/{row.expressiveMax}
                </td>
                <td
                  className="px-1 py-2 text-center align-middle"
                  style={{ borderBottom: ROW_BORDER, borderRight: DIVIDER_BORDER }}
                >
                  {row.receptiveScore}/{row.receptiveMax}
                </td>
                {rightRow ? (
                  <>
                    <td
                      className="px-2 py-2 text-center align-middle"
                      style={{ borderBottom: ROW_BORDER }}
                    >
                      {rightRow.id}
                    </td>
                    <td
                      className="px-2 py-2 text-center align-middle"
                      style={{ borderBottom: ROW_BORDER }}
                    >
                      {rightRow.label}
                    </td>
                    <td
                      className="px-1 py-2 text-center align-middle"
                      style={{ borderBottom: ROW_BORDER }}
                    >
                      {rightRow.expressiveScore}/{rightRow.expressiveMax}
                    </td>
                    <td
                      className="px-1 py-2 text-center align-middle"
                      style={{ borderBottom: ROW_BORDER }}
                    >
                      {rightRow.receptiveScore}/{rightRow.receptiveMax}
                    </td>
                  </>
                ) : null}
                {isSummaryStart ? (
                  <>
                    <td
                      colSpan={2}
                      rowSpan={summaryRowSpan}
                      className="px-2 py-2 text-center align-middle font-medium"
                      style={{ border: B }}
                    >
                      합계
                    </td>
                    <td
                      rowSpan={summaryRowSpan}
                      className="px-1 py-2 text-center align-middle font-medium"
                      style={{ border: B }}
                    >
                      {data.expressiveTotal}/{data.expressiveMax}
                    </td>
                    <td
                      rowSpan={summaryRowSpan}
                      className="px-1 py-2 text-center align-middle font-medium"
                      style={{ border: B }}
                    >
                      {data.receptiveTotal}/{data.receptiveMax}
                    </td>
                  </>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// 언어분석 전용 결과 카드 (Step 1 구조화 텍스트 + Step 2 LLM 보고서 + AI 프롬프트 복사)
interface LanguageAnalysisResultCardProps {
  title: string;
  step1Text: string;
  step2Text?: string | null;
  onGenerateLLM?: () => Promise<void>;
  onCopyPrompt?: () => void;
  onCopy: (text: string) => void;
}

function LanguageAnalysisResultCard({
  title,
  step1Text,
  step2Text,
  onGenerateLLM,
  onCopyPrompt,
  onCopy,
}: LanguageAnalysisResultCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStep1, setShowStep1] = useState(false);

  const handleGenerate = async () => {
    if (!onGenerateLLM) return;
    setIsGenerating(true);
    try {
      await onGenerateLLM();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-green-200 bg-white/50 p-4 dark:border-green-800 dark:bg-gray-900/30">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2">
        <h4 className={`${TEXT_STYLES.sectionTitle} ${TEXT_STYLES.titleColor.green}`}>{title}</h4>
        <div className="flex items-center gap-1">
          {onCopyPrompt && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 border-purple-300 px-2 text-xs text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30"
              onClick={onCopyPrompt}
            >
              {LANGUAGE_ANALYSIS_UI.copyPromptButton}
            </Button>
          )}
          {onGenerateLLM && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating
                ? LANGUAGE_ANALYSIS_UI.generatingButton
                : step2Text
                  ? LANGUAGE_ANALYSIS_UI.regenerateButton
                  : LANGUAGE_ANALYSIS_UI.generateReportButton}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onCopy(step2Text ?? step1Text)}
            disabled={isGenerating}
          >
            {LANGUAGE_ANALYSIS_UI.copyButton}
          </Button>
        </div>
      </div>

      {/* Step 2: LLM 보고서 (있으면 표시, 없으면 Step 1) */}
      <div className="mt-2">
        {step2Text ? (
          <p className={TEXT_STYLES.body}>{step2Text}</p>
        ) : (
          <p className={TEXT_STYLES.body}>{step1Text}</p>
        )}
      </div>

      {/* Step 1: 구조화 데이터 토글 (Step 2 있을 때만) */}
      {step2Text && (
        <div className="mt-3 border-t pt-2">
          <button
            type="button"
            onClick={() => setShowStep1((v) => !v)}
            className="text-muted-foreground text-xs hover:underline"
          >
            {showStep1
              ? LANGUAGE_ANALYSIS_UI.hideStructuredData
              : LANGUAGE_ANALYSIS_UI.showStructuredData}
          </button>
          {showStep1 && <p className={`mt-2 ${TEXT_STYLES.body} text-xs`}>{step1Text}</p>}
        </div>
      )}
    </div>
  );
}

// 개별 도구 결과 카드 컴포넌트
interface ToolResultCardProps {
  toolId: string;
  title: string;
  text: string;
  data?: Record<string, unknown>;
  onCopy: (text: string, html?: string) => void;
}

function ToolResultCard({ toolId, title, text, data, onCopy }: ToolResultCardProps) {
  const handleCopy = () => {
    const plainText = buildToolCopyText(toolId, { text, data });
    const htmlContent = buildToolCopyHtml(toolId, { text, data }) ?? undefined;
    onCopy(plainText, htmlContent);
  };

  return (
    <div className="mb-6 rounded-lg border border-green-200 bg-white/50 p-4 dark:border-green-800 dark:bg-gray-900/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-3">
          <h4 className={`${TEXT_STYLES.sectionTitle} ${TEXT_STYLES.titleColor.green}`}>{title}</h4>
          <div>
            <p className={TEXT_STYLES.body}>{text}</p>
            {toolId === 'problem_solving' && data && (
              <ProblemSolvingTable data={data as unknown as ProblemSolvingData} />
            )}
            {toolId === 'cplc' && data && <CplcTable data={data as unknown as CplcData} />}
            {toolId === 'kcelf5_pp' && data && (
              <Kcelf5PpTable data={data as unknown as Kcelf5PpData} />
            )}
            {toolId === 'kcelf5_ors' && data && (
              <Kcelf5OrsTable data={data as unknown as Kcelf5OrsData} />
            )}
            {toolId === 'kmb_cdi' && data && <KmbCdiTable data={data as unknown as KmbCdiToolData} />}
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
