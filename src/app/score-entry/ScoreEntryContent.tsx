'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { Header } from '@/widgets/header';
import { SelsiScoreForm } from '@/features/score-entry/ui/SelsiScoreForm';
import { PresScoreForm } from '@/features/score-entry/ui/PresScoreForm';
import { useScoreEntryStore } from '@/features/score-entry';
import { ResultSection } from '@/features/result-summary';
import { useChildInfoStore, formatAgeResult } from '@/features/child-info';
import { useTestSelectionStore } from '@/features/test-selection';
import {
  TOOL_METADATA,
  isToolActive,
  type AssessmentToolId,
} from '@/entities/assessment-tool';
import { normClient } from '@/shared/api/norm-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { ToolApiResult } from '@/features/score-entry/model/store';

// 통합 API 응답 타입
interface UnifiedConvertResponse {
  results: Record<
    string,
    {
      text: string;
      data: Record<string, unknown>;
    }
  >;
  integratedSummary: string;
}

// 도구별 필수 하위검사 (입력 완료 판단용)
const TOOL_REQUIRED_SUBTESTS: Partial<Record<AssessmentToolId, string[]>> = {
  selsi: ['receptive', 'expressive'],
  pres: ['receptive', 'expressive'],
  // 향후 추가:
  // revt: ['receptive', 'expressive'],
  // syntax: ['total'],
  // problem_solving: ['cause_reason', 'clue_guessing', 'solution_inference'],
};

export function ScoreEntryContent() {
  const router = useRouter();
  const { childInfo, ageResult, _hasHydrated, clearChildInfo } = useChildInfoStore();

  // selector로 필요한 데이터만 구독
  const { tools, integratedSummary } = useScoreEntryStore(
    useShallow((state) => ({
      tools: state.tools,
      integratedSummary: state.integratedSummary,
    }))
  );
  const initTool = useScoreEntryStore((state) => state.initTool);
  const setApiResult = useScoreEntryStore((state) => state.setApiResult);
  const setIntegratedSummary = useScoreEntryStore((state) => state.setIntegratedSummary);
  const clearAll = useScoreEntryStore((state) => state.clearAll);
  const clearResults = useScoreEntryStore((state) => state.clearResults);

  const { selectedTools, clearSelection } = useTestSelectionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // 선택된 도구 중 활성화된 것만 필터
  const activeSelectedTools = selectedTools.filter((id) => isToolActive(id));

  // 선택된 도구의 store 초기화
  useEffect(() => {
    for (const toolId of activeSelectedTools) {
      const meta = TOOL_METADATA[toolId];
      // combined는 자동 계산이므로 초기화에서 제외
      const subtests = meta.subtests.filter((s) => s !== 'combined');
      initTool(toolId, subtests.length > 0 ? subtests : ['total']);
    }
  }, [activeSelectedTools, initTool]);

  // 라우팅 가드
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!childInfo || !ageResult) {
      router.replace('/');
      return;
    }
    if (activeSelectedTools.length === 0) {
      router.replace('/select-tool');
    }
  }, [childInfo, ageResult, activeSelectedTools.length, _hasHydrated, router]);

  if (!_hasHydrated || !childInfo || !ageResult || activeSelectedTools.length === 0) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  const ageMonths = ageResult.totalMonths;

  // 도구별 입력 완료 여부 확인
  const isToolComplete = (toolId: AssessmentToolId): boolean => {
    const toolData = tools[toolId];
    if (!toolData) return false;

    const requiredSubtests = TOOL_REQUIRED_SUBTESTS[toolId];
    if (!requiredSubtests) return false;

    return requiredSubtests.every((subtest) => {
      const input = toolData.inputs[subtest];
      return input && input.rawScore !== null;
    });
  };

  // 모든 선택된 도구의 입력이 완료되었는지
  const isAllComplete = activeSelectedTools.every(isToolComplete);

  // 결과가 있는지
  const hasResults = activeSelectedTools.some((id) => tools[id]?.apiResult !== null);

  // 도구 변경: 점수만 초기화
  const handleToolChange = () => {
    clearAll();
    router.push('/select-tool');
  };

  // 처음으로: 모든 정보 초기화
  const handleGoHome = () => {
    clearAll();
    clearSelection();
    clearChildInfo();
    router.push('/');
  };

  // 결과 요청: 통합 API 호출
  const handleRequestResult = async () => {
    if (!isAllComplete || !childInfo || !ageResult) return;

    setIsLoading(true);
    setApiError(null);
    clearResults();

    try {
      // 선택된 도구별 요청 데이터 구성
      const toolsPayload: Record<string, Record<string, unknown>> = {};

      for (const toolId of activeSelectedTools) {
        const toolData = tools[toolId];
        if (!toolData) continue;

        const subtestPayload: Record<string, unknown> = {};
        for (const [subtest, input] of Object.entries(toolData.inputs)) {
          subtestPayload[subtest] = {
            rawScore: input.rawScore!,
            correctItems: input.correctItems,
            wrongItems: input.wrongItems,
          };
        }
        toolsPayload[toolId] = subtestPayload;
      }

      const response = await normClient.convertUnified<UnifiedConvertResponse>({
        childInfo: {
          name: childInfo.name,
          gender: childInfo.gender,
          ageYears: ageResult.years,
          ageMonths: ageResult.totalMonths,
          ageRemainingMonths: ageResult.months,
        },
        tools: toolsPayload,
      });

      // 결과 저장 (범용)
      for (const [toolId, result] of Object.entries(response.results)) {
        if (result) {
          const apiResult: ToolApiResult = {
            text: result.text,
            data: result.data,
          };
          setApiResult(toolId as AssessmentToolId, apiResult);
        }
      }
      setIntegratedSummary(response.integratedSummary);
    } catch (err) {
      console.error('API 호출 실패:', err);
      setApiError(err instanceof Error ? err.message : 'API 호출 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 도구별 폼 렌더링
  const renderToolForm = (toolId: AssessmentToolId) => {
    switch (toolId) {
      case 'selsi':
        return <SelsiScoreForm ageMonths={ageMonths} gender={childInfo.gender} />;
      case 'pres':
        return <PresScoreForm ageMonths={ageMonths} />;
      default:
        return <p className="text-muted-foreground py-4">준비 중입니다.</p>;
    }
  };

  // 미완료 도구 이름 목록
  const incompleteTools = activeSelectedTools
    .filter((id) => !isToolComplete(id))
    .map((id) => TOOL_METADATA[id].name);

  // 결과 표시용 데이터 구성
  const resultsForDisplay: Record<string, { text: string }> = {};
  for (const toolId of activeSelectedTools) {
    const apiResult = tools[toolId]?.apiResult;
    if (apiResult) {
      resultsForDisplay[toolId] = { text: apiResult.text };
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 상단 정보 바 */}
        <Card className="sticky top-4 z-10 mx-auto mb-8 max-w-xl shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {childInfo.name} ({childInfo.gender === 'male' ? '남' : '여'})
                </p>
                <p className="text-muted-foreground text-sm">{formatAgeResult(ageResult)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleToolChange}>
                  &larr; 도구 변경
                </Button>
                <Button variant="ghost" size="sm" onClick={handleGoHome}>
                  처음으로
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 도구별 아코디언 점수 입력 */}
        <div className="mx-auto max-w-xl">
          <Accordion type="multiple" defaultValue={activeSelectedTools} className="space-y-4">
            {activeSelectedTools.map((toolId) => {
              const meta = TOOL_METADATA[toolId];
              const complete = isToolComplete(toolId);
              return (
                <AccordionItem key={toolId} value={toolId} className="rounded-lg border px-4">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>{meta.name}</span>
                      <span className="text-muted-foreground text-xs font-normal">
                        {meta.description}
                      </span>
                      {complete && (
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                          입력 완료
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>{renderToolForm(toolId)}</AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* 검사 결과 섹션 */}
        {hasResults && (
          <div className="mx-auto max-w-xl">
            <ResultSection
              childInfo={childInfo}
              ageResult={ageResult}
              results={resultsForDisplay}
              integratedSummary={integratedSummary}
            />
          </div>
        )}

        {/* 결과 요청 버튼 */}
        <div className="mx-auto mt-8 max-w-xl">
          {apiError && (
            <div className="bg-destructive/10 border-destructive/20 mb-4 rounded-md border p-3">
              <p className="text-destructive text-sm">{apiError}</p>
            </div>
          )}
          <Button
            onClick={handleRequestResult}
            disabled={!isAllComplete || isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? '변환 중...' : '결과 확인 →'}
          </Button>
          {!isAllComplete && incompleteTools.length > 0 && (
            <p className="text-muted-foreground mt-2 text-center text-sm">
              {incompleteTools.join(', ')} 점수를 입력해주세요
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
