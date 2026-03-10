'use client';

/**
 * 검사 결과 표시 섹션
 * 여러 검사 도구(SELSI, PRES, REVT 등)의 결과를 통합 표시
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
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


// HTML 테이블 생성 헬퍼 (점수+백분율 열 구조)
const HEADER_BG = 'background-color:rgb(182,221,232);';
const H_BORDER = 'border-top:2.25pt solid black;border-bottom:2.25pt solid black;';
const V_HIDDEN_TH = 'border-left:2.25pt solid rgb(182,221,232);border-right:2.25pt solid rgb(182,221,232);';
const V_HIDDEN_TD = 'border-left:2.25pt solid white;border-right:2.25pt solid white;';
const BASE = "padding:4px 8px;text-align:center;vertical-align:middle;font-family:'새굴림',sans-serif;font-size:10pt;";
const TH_STYLE = H_BORDER + V_HIDDEN_TH + BASE + HEADER_BG;
const TD_STYLE = H_BORDER + V_HIDDEN_TD + BASE;

function htmlScoreTable(
  cols: { label: string; score: number; percent: number }[],
  leadingCol?: { header: string; cell: string }
): string {
  const totalCols = cols.length + (leadingCol ? 1 : 0);
  const colWidth = `${(100 / totalCols).toFixed(4)}%`;
  const colTags = Array(totalCols).fill(`<col style="width:${colWidth};">`).join('');

  const BOLD_TH_STYLE = TH_STYLE + 'font-weight:bold;';
  const leadingTh = leadingCol ? `<th valign="middle" style="${BOLD_TH_STYLE}">${leadingCol.header}</th>` : '';
  const leadingTd = leadingCol ? `<td valign="middle" style="${BOLD_TH_STYLE}">${leadingCol.cell}</td>` : '';

  const ths = cols.map((c) => `<th valign="middle" style="${TH_STYLE}">${c.label}</th>`).join('');
  const tds = cols.map((c) => `<td valign="middle" style="${TD_STYLE}">${c.score}점<br>(${c.percent}%)</td>`).join('');

  return `<table style="border-collapse:collapse;width:100%;table-layout:fixed;"><colgroup>${colTags}</colgroup><thead><tr>${leadingTh}${ths}</tr></thead><tbody><tr>${leadingTd}${tds}</tr></tbody></table>`;
}

// 언어문제해결력 전용 HTML 테이블 (원점수/백분위수 2행 구조)
function htmlProblemSolvingTable(d: ProblemSolvingData): string {
  const cols = [
    { label: '원인이유', rawScore: d.causeReasonRawScore, percentile: d.causeReasonPercentileText },
    { label: '해결추론', rawScore: d.solutionInferenceRawScore, percentile: d.solutionInferencePercentileText },
    { label: '단서추측', rawScore: d.clueGuessingRawScore, percentile: d.clueGuessingPercentileText },
    { label: '총점', rawScore: d.totalRawScore, percentile: d.totalPercentileText },
  ];
  const totalCols = cols.length + 1;
  const colWidth = `${(100 / totalCols).toFixed(4)}%`;
  const colTags = Array(totalCols).fill(`<col style="width:${colWidth};">`).join('');

  // 행별 개별 border 스타일 (원점수-백분위수 사이 가로선 0pt)
  const mkTh = (top: string, bot: string) =>
    `border-top:${top};border-bottom:${bot};border-left:2.25pt solid rgb(182,221,232);border-right:2.25pt solid rgb(182,221,232);` + BASE + HEADER_BG;
  const mkTd = (top: string, bot: string) =>
    `border-top:${top};border-bottom:${bot};border-left:2.25pt solid white;border-right:2.25pt solid white;` + BASE;

  const ROW1_TH = mkTh('2.25pt solid black', '0pt solid transparent') + 'padding-bottom:0;font-weight:bold;';
  const ROW1_TD = mkTd('2.25pt solid black', '0pt solid transparent') + 'padding-bottom:0;';
  const ROW2_TH = mkTh('0pt solid transparent', '2.25pt solid black') + 'padding-top:0;font-weight:bold;';
  const ROW2_TD = mkTd('0pt solid transparent', '2.25pt solid black') + 'padding-top:0;';

  const headerRow = `<tr><th valign="middle" style="${TH_STYLE}"></th>${cols.map((c) => `<th valign="middle" style="${TH_STYLE}">${c.label}</th>`).join('')}</tr>`;
  const rawRow = `<tr><td valign="middle" style="${ROW1_TH}">원점수</td>${cols.map((c) => `<td valign="middle" style="${ROW1_TD}">${c.rawScore}점</td>`).join('')}</tr>`;
  const pctRow = `<tr><td valign="middle" style="${ROW2_TH}">백분위수</td>${cols.map((c) => `<td valign="middle" style="${ROW2_TD}">${c.percentile}</td>`).join('')}</tr>`;

  return `<table style="border-collapse:collapse;width:100%;table-layout:fixed;"><colgroup>${colTags}</colgroup><thead>${headerRow}</thead><tbody>${rawRow}${pctRow}</tbody></table>`;
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
    return textHtml + htmlScoreTable(
      [
        { label: '담화관리', score: d.discourseScore, percent: d.discoursePercent },
        { label: '상황조절', score: d.contextualScore, percent: d.contextualPercent },
        { label: '의사소통의도', score: d.communicationScore, percent: d.communicationPercent },
        { label: '비언어적', score: d.nonverbalScore, percent: d.nonverbalPercent },
        { label: '총점', score: d.totalScore, percent: d.totalPercent },
      ],
      { header: '영역', cell: '점수' }
    );
  }
  if (toolId === 'kcelf5_pp') {
    const d = result.data as unknown as Kcelf5PpData;
    return textHtml + htmlScoreTable([
      { label: '대화기술', score: d.conversationScore, percent: d.conversationPercent },
      { label: '정보요청+제공+응하기', score: d.informationScore, percent: d.informationPercent },
      { label: '비언어적', score: d.nonverbalScore, percent: d.nonverbalPercent },
      { label: '총점', score: d.totalScore, percent: d.totalPercent },
    ]);
  }
  if (toolId === 'kcelf5_ors') {
    const d = result.data as unknown as Kcelf5OrsData;
    return textHtml + htmlScoreTable([
      { label: '듣기', score: d.listeningScore, percent: d.listeningPercent },
      { label: '말하기', score: d.speakingScore, percent: d.speakingPercent },
      { label: '읽기', score: d.readingScore, percent: d.readingPercent },
      { label: '쓰기', score: d.writingScore, percent: d.writingPercent },
      { label: '총점', score: d.totalScore, percent: d.totalPercent },
    ]);
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
  if (toolId === 'kcelf5_pp' && result.data) {
    const d = result.data as unknown as Kcelf5PpData;
    text +=
      '\n\n' +
      [
        `대화기술\t정보요청+제공+응하기\t비언어적\t총점`,
        `${d.conversationScore}점\n(${d.conversationPercent}%)\t${d.informationScore}점\n(${d.informationPercent}%)\t${d.nonverbalScore}점\n(${d.nonverbalPercent}%)\t${d.totalScore}점\n(${d.totalPercent}%)`,
      ].join('\n');
  }
  if (toolId === 'kcelf5_ors' && result.data) {
    const d = result.data as unknown as Kcelf5OrsData;
    text +=
      '\n\n' +
      [
        `듣기\t말하기\t읽기\t쓰기\t총점`,
        `${d.listeningScore}점\n(${d.listeningPercent}%)\t${d.speakingScore}점\n(${d.speakingPercent}%)\t${d.readingScore}점\n(${d.readingPercent}%)\t${d.writingScore}점\n(${d.writingPercent}%)\t${d.totalScore}점\n(${d.totalPercent}%)`,
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

// AI 요청용 프롬프트 생성 (LLM 시스템 프롬프트와 동일한 규칙 적용)
function buildAIPrompt(childInfo: ChildInfo, ageResult: AgeResult, step1Text: string): string {
  const gender = childInfo.gender === 'male' ? '남' : '여';
  const age = formatAge(ageResult);

  return `다음 자발화 분석 데이터를 바탕으로 규칙을 엄수하여 객관적인 단일 문단 임상 요약 텍스트를 작성해 줘. (주관적 해석 및 문단 나눔 절대 금지)

[아동 정보]
성별: ${gender} / 연령: 만 ${age}
(주의: 아동의 이름은 요약에 포함하지 마시오)

## ⚠️ 절대 엄수 규칙
1. **구조 통일**: 들여쓰기, 줄바꿈, 번호 매기기 금지. 처음부터 끝까지 이어지는 단 하나의 문단(One Paragraph)으로만 작성. 마지막에 '종합적으로' 등의 요약 문장 절대 추가 금지.
2. **환각 및 해석 금지**: 데이터에 없는 임상적 추측, 진단, 주관적 가치 판단("~능력을 보여줌", "~을 시사함", "~로 해석됨") 절대 금지. 단, 임상적 관찰 용어("관찰됨", "나타남", "~어려움을 보임", "~양상을 보임")는 사용 가능.
3. **메타 서술 및 빈 항목 생략**: "데이터에 예시가 제공되지 않음", "관찰 항목이 있음" 등 입력받은 데이터의 유무를 설명하는 말투 절대 금지. 항목이 비어있거나 구체적 예시가 없다면 억지로 지어내지 말고 해당 내용 자체를 텍스트에서 완전히 누락시킬 것.
4. **구문 길이 포맷(엄격 적용)**: 반드시 다음 형태의 단일 문장으로 병합하여 작성할 것. (두 문장 분리 금지) "평균어절길이가 X(연령 수준), 최장어절길이가 Y(연령 수준)로 또래 대비 [수준] 양상을 보임."

## 📝 세부 작성 규칙
5. **문체 및 표기**: 반드시 "~음 체"(비격식 서술체)만 사용. "~습니다", "~입니다" 금지. 아동의 이름은 "아동"으로만 표기.
6. **유기적 서술**: 단순 나열을 피하고, 긍정적 결과와 한계점을 "그러나", "또한" 등의 접속사로 자연스럽게 연결할 것.
7. **조건부 예시 삽입**: 데이터에 아동의 발화 예시(S:/C: 등)나 단어가 있다면 괄호 안에 적극 삽입할 것.

## 💡 [모범 출력 예시]
(⚠️ 주의: 아래 예시의 수치, 연령, 발화 내용 등의 '데이터'는 절대 베끼지 말 것. 오직 문장의 '구조'와 '서술 톤(Tone)'만 완벽하게 모방할 것.)

자발화 분석 결과, 아동의 평균어절길이가 2.5(42~45개월 수준), 최장어절길이가 7(42개월 수준)로 나타나 또래 대비 구문의 길이가 짧은 양상을 보임. 가장 긴 구문은 "바다 갔다 왔고 호텔 6층 갔다 왔어요"로 경험을 이야기하는 상황에서 산출됨. 의사소통 기능 측면에서는 요구, 반응, 객관적 언급 등을 사용하는 것으로 확인됨. 문법형태소는 조사 '이/가', 연결어미 '-고'가 관찰됨. 화용 및 담화 능력에서는 기본적인 대화 주고받기가 가능하나, 빈번하게 선행 발화와 관련 없는 주제를 개시함(예: "선생님 1월이 지나면 뭐가 돼요?"). 상황별로 경험 이야기 시 이전 경험을 단편적으로 나열하였고, 보드게임 시 세부 내용을 충분히 포함하지 않은 채 발화하여 조리 있게 설명하는 데 어려움을 보임. 공동주의에서는 눈 맞춤은 유지되나, 호명반응은 관찰되지 않음.

[분석 데이터]
${step1Text}`;
}

export function ResultSection({
  childInfo,
  ageResult,
  results,
  integratedSummary,
  laStep2Text,
  onGenerateLLM,
}: ResultSectionProps) {
  const copyToClipboard = useCallback(async (text: string, feedbackMsg: string, htmlOverride?: string) => {
    try {
      const html = htmlOverride ?? (() => {
        const escaped = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
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
  }, []);

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
      lines.push(``, `■ ${toolName} 결과`, buildToolCopyText(toolId, result, toolId === 'language_analysis' ? laStep2Text : null));
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
                    buildAIPrompt(childInfo, ageResult, result.text),
                    'AI 프롬프트 복사 완료'
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
              onCopy={(copyText, copyHtml) => copyToClipboard(copyText, `${toolName} 결과 복사 완료`, copyHtml)}
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

// 공통 테이블 헤더 배경색
const TH_BG: React.CSSProperties = { backgroundColor: 'rgb(182,221,232)' };

// 언어문제해결력 결과 테이블 컴포넌트 (원점수/백분위수 2행 + 앞 컬럼)
function ProblemSolvingTable({ data }: { data: ProblemSolvingData }) {
  if (data.isUntestable) return null;

  const cols = [
    { label: '원인이유', rawScore: data.causeReasonRawScore, percentile: data.causeReasonPercentileText },
    { label: '해결추론', rawScore: data.solutionInferenceRawScore, percentile: data.solutionInferencePercentileText },
    { label: '단서추측', rawScore: data.clueGuessingRawScore, percentile: data.clueGuessingPercentileText },
    { label: '총점', rawScore: data.totalRawScore, percentile: data.totalPercentileText },
  ];

  const B = '2px solid black';

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th className="px-2 py-2 text-center font-medium align-middle" style={{ ...TH_BG, borderTop: B, borderBottom: B }} />
            {cols.map((col) => (
              <th key={col.label} className="px-2 py-2 text-center font-medium align-middle" style={{ ...TH_BG, borderTop: B, borderBottom: B }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-2 pt-2 pb-0 text-center font-bold align-middle" style={{ ...TH_BG, borderTop: B }}>원점수</td>
            {cols.map((col) => (
              <td key={col.label} className="px-2 pt-2 pb-0 text-center align-middle" style={{ borderTop: B }}>
                {col.rawScore}점
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-2 pt-0 pb-2 text-center font-bold align-middle" style={{ ...TH_BG, borderBottom: B }}>백분위수</td>
            {cols.map((col) => (
              <td key={col.label} className="px-2 pt-0 pb-2 text-center align-middle" style={{ borderBottom: B }}>
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
  const cols = [
    { label: '담화관리', score: data.discourseScore, percent: data.discoursePercent },
    { label: '상황조절', score: data.contextualScore, percent: data.contextualPercent },
    { label: '의사소통의도', score: data.communicationScore, percent: data.communicationPercent },
    { label: '비언어적', score: data.nonverbalScore, percent: data.nonverbalPercent },
    { label: '총점', score: data.totalScore, percent: data.totalPercent },
  ];
  const B = '2px solid black';

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th className="px-2 py-2 text-center font-bold align-middle" style={{ ...TH_BG, borderTop: B, borderBottom: B }}>영역</th>
            {cols.map((col) => (
              <th key={col.label} className="px-2 py-2 text-center font-medium align-middle" style={{ ...TH_BG, borderTop: B, borderBottom: B }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-2 py-2 text-center font-bold align-middle" style={{ ...TH_BG, borderTop: B, borderBottom: B }}>점수</td>
            {cols.map((col) => (
              <td key={col.label} className="px-2 py-2 text-center align-middle" style={{ borderTop: B, borderBottom: B }}>
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

// K-CELF-5 PP 결과 테이블 컴포넌트
function Kcelf5PpTable({ data }: { data: Kcelf5PpData }) {
  const cols = [
    { label: '대화기술', score: data.conversationScore, percent: data.conversationPercent },
    { label: '정보요청+제공+응하기', score: data.informationScore, percent: data.informationPercent },
    { label: '비언어적', score: data.nonverbalScore, percent: data.nonverbalPercent },
    { label: '총점', score: data.totalScore, percent: data.totalPercent },
  ];
  const B = '2px solid black';

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {cols.map((col) => (
              <th key={col.label} className="px-2 py-2 text-center font-medium align-middle" style={{ ...TH_BG, borderTop: B, borderBottom: B }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {cols.map((col) => (
              <td key={col.label} className="px-2 py-2 text-center align-middle" style={{ borderTop: B, borderBottom: B }}>
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
  const cols = [
    { label: '듣기', score: data.listeningScore, percent: data.listeningPercent },
    { label: '말하기', score: data.speakingScore, percent: data.speakingPercent },
    { label: '읽기', score: data.readingScore, percent: data.readingPercent },
    { label: '쓰기', score: data.writingScore, percent: data.writingPercent },
    { label: '총점', score: data.totalScore, percent: data.totalPercent },
  ];

  const B = '2px solid black';

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {cols.map((col) => (
              <th key={col.label} className="px-2 py-2 text-center font-medium align-middle" style={{ ...TH_BG, borderTop: B, borderBottom: B }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {cols.map((col) => (
              <td key={col.label} className="px-2 py-2 text-center align-middle" style={{ borderTop: B, borderBottom: B }}>
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
              className="h-7 px-2 text-xs text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-700 dark:hover:bg-purple-950/30"
              onClick={onCopyPrompt}
            >
              AI 요청 복사
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
              {isGenerating ? '생성 중...' : step2Text ? '재생성' : '보고서 생성'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onCopy(step2Text ?? step1Text)}
            disabled={isGenerating}
          >
            복사
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
            {showStep1 ? '▲ 구조화 데이터 숨기기' : '▼ 구조화 데이터 보기'}
          </button>
          {showStep1 && (
            <p className={`mt-2 ${TEXT_STYLES.body} text-xs`}>{step1Text}</p>
          )}
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
            {toolId === 'pres' && data && (
              <PresTable data={data as unknown as PresData} />
            )}
            {toolId === 'problem_solving' && data && (
              <ProblemSolvingTable data={data as unknown as ProblemSolvingData} />
            )}
            {toolId === 'cplc' && data && (
              <CplcTable data={data as unknown as CplcData} />
            )}
            {toolId === 'kcelf5_pp' && data && (
              <Kcelf5PpTable data={data as unknown as Kcelf5PpData} />
            )}
            {toolId === 'kcelf5_ors' && data && (
              <Kcelf5OrsTable data={data as unknown as Kcelf5OrsData} />
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
