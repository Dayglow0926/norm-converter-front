'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';
import { Header } from '@/widgets/header';
import { SelsiScoreForm } from '@/features/score-entry/ui/SelsiScoreForm';
import { PresScoreForm } from '@/features/score-entry/ui/PresScoreForm';
import { SyntaxScoreForm } from '@/features/score-entry/ui/SyntaxScoreForm';
import { ProblemSolvingScoreForm } from '@/features/score-entry/ui/ProblemSolvingScoreForm';
import { ApacScoreForm } from '@/features/score-entry/ui/ApacScoreForm';
import { CplcScoreForm } from '@/features/score-entry/ui/CplcScoreForm';
import { LanguageAnalysisForm } from '@/features/score-entry/ui/LanguageAnalysisForm';
import { useScoreEntryStore } from '@/features/score-entry';
import { useLanguageAnalysisStore } from '@/features/score-entry/model/languageAnalysisStore';
import { ResultSection } from '@/features/result-summary';
import { useChildInfoStore, formatAgeResult } from '@/features/child-info';
import { useTestSelectionStore } from '@/features/test-selection';
import { TOOL_METADATA, isToolActive, type AssessmentToolId } from '@/entities/assessment-tool';
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
  syntax: ['total'],
  problem_solving: ['cause_reason', 'clue_guessing', 'solution_inference'],
  apac: ['rawScore'],
  cplc: [
    'discourse_management',
    'contextual_variation',
    'communication_intent',
    'nonverbal_communication',
  ],
  // language_analysis는 useLanguageAnalysisStore.selectedType 기반으로 별도 처리
  // revt: ['receptive', 'expressive'],
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
  const { selectedType: laSelectedType, spontaneous: laSpontaneous, clearAll: laClearAll, clearResult: laClearResult } = useLanguageAnalysisStore();
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
    // 언어분석: 유형 선택 여부로 완료 판단
    if (toolId === 'language_analysis') {
      // 모든 섹션 선택사항 → 유형 선택만으로 완료
      return laSelectedType !== null;
    }

    const toolData = tools[toolId];
    if (!toolData) return false;

    const requiredSubtests = TOOL_REQUIRED_SUBTESTS[toolId];
    if (!requiredSubtests) return false;

    // problem_solving: 전부 입력 OR 전부 비움(isUntestable) 모두 완료로 처리
    if (toolId === 'problem_solving') {
      const filled = requiredSubtests.filter((s) => toolData.inputs[s]?.rawScore !== null).length;
      return filled === 0 || filled === requiredSubtests.length;
    }

    // apac: 모방 유형 선택 필수. partial이면 rawScore 없어도 완료, total이면 rawScore 필요
    if (toolId === 'apac') {
      const imitationType = toolData.inputs.rawScore?.correctItems ?? '';
      if (imitationType === 'partial') return true;
      if (imitationType === 'total') return toolData.inputs.rawScore?.rawScore !== null;
      return false; // 모방 유형 미선택
    }

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
    laClearAll();
    router.push('/select-tool');
  };

  // 처음으로: 모든 정보 초기화
  const handleGoHome = () => {
    clearAll();
    laClearAll();
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
    laClearResult();

    try {
      // 선택된 도구별 요청 데이터 구성
      const toolsPayload: Record<string, Record<string, unknown>> = {};

      for (const toolId of activeSelectedTools) {
        const toolData = tools[toolId];
        if (!toolData) continue;

        // language_analysis: 유형 + 입력 데이터 구성
        if (toolId === 'language_analysis') {
          if (!laSelectedType) continue;
          const laPayload: Record<string, unknown> = { analysisType: laSelectedType };
          if (laSelectedType === 'spontaneous_speech') {
            const sp = laSpontaneous;
            const spontaneousData: Record<string, unknown> = {};
            if (sp.mluW !== null) spontaneousData.mluW = sp.mluW;
            if (sp.mluMax !== null) spontaneousData.mluMax = sp.mluMax;
            if (sp.longestUtterance) spontaneousData.longestUtterance = sp.longestUtterance;
            if (sp.speakingSituation) spontaneousData.speakingSituation = sp.speakingSituation;

            // 의사소통 기능: 카테고리별 선택 항목을 flat array로 변환
            const allCommFunctions = Object.values(sp.communicationFunctions).flat();
            if (allCommFunctions.length > 0) spontaneousData.communicationFunctions = allCommFunctions;

            // 문법형태소
            const hasMorphemes =
              sp.morphemes.particles.length > 0 ||
              sp.morphemes.conjunctions.length > 0 ||
              sp.morphemes.endings.length > 0;
            if (hasMorphemes) spontaneousData.morphemes = sp.morphemes;

            // 의미/문법 오류
            if (sp.semanticErrors.enabled && sp.semanticErrors.examples) {
              spontaneousData.semanticErrors = sp.semanticErrors.examples;
            }

            // 화용/담화: 선택된 항목 (positive/negative 각각)
            const pragmaticSelected = sp.pragmatic.items
              .filter((item) => item.value !== null)
              .map((item) => `${item.label}(${item.value === 'positive' ? '예' : '아니오'})`);
            if (pragmaticSelected.length > 0) {
              spontaneousData.pragmatic = pragmaticSelected;
            }
            if (sp.pragmatic.examples) spontaneousData.pragmaticExamples = sp.pragmatic.examples;

            // 주제 관리: 선택된 항목
            const topicSelected = sp.topicManagement
              .filter((item) => item.value !== null)
              .map((item) => `${item.label}(${item.value === 'positive' ? '예' : '아니오'})`);
            if (topicSelected.length > 0) spontaneousData.topicManagement = topicSelected;

            // 상황별 관찰: 내용이 있는 항목만
            const observations = sp.situationalObservations.filter(
              (obs) => obs.observation || obs.example
            );
            if (observations.length > 0) spontaneousData.situationalObservations = observations;

            // 공동주의/활동/호명
            const jointSelected = sp.jointAttention
              .filter((item) => item.value !== null)
              .map((item) => `${item.label}(${item.value === 'positive' ? '예' : '아니오'})`);
            if (jointSelected.length > 0) spontaneousData.jointAttention = jointSelected;

            if (Object.keys(spontaneousData).length > 0) laPayload.spontaneous = spontaneousData;
          }
          toolsPayload[toolId] = laPayload;
          continue;
        }

        // syntax: BE API가 subtest 래퍼 없이 { rawScore } 직접 기대
        if (toolId === 'syntax') {
          toolsPayload[toolId] = { rawScore: toolData.inputs.total?.rawScore ?? 0 };
          continue;
        }

        // apac: { rawScore, imitationType? } 직접 기대
        if (toolId === 'apac') {
          const rawScore = toolData.inputs.rawScore?.rawScore ?? 0;
          const imitationType = toolData.inputs.rawScore?.correctItems || undefined;
          toolsPayload[toolId] = {
            rawScore,
            ...(imitationType ? { imitationType } : {}),
          };
          continue;
        }

        // cplc: 영역별 { rawScore, correctItems?, wrongItems? } 객체
        if (toolId === 'cplc') {
          const cplcPayload: Record<string, unknown> = {};
          for (const [subtest, input] of Object.entries(toolData.inputs)) {
            if (input.rawScore !== null) {
              const areaPayload: Record<string, unknown> = { rawScore: input.rawScore };
              if (input.correctItems) areaPayload.correctItems = input.correctItems;
              if (input.wrongItems) areaPayload.wrongItems = input.wrongItems;
              cplcPayload[subtest] = areaPayload;
            }
          }
          toolsPayload[toolId] = cplcPayload;
          continue;
        }

        const subtestPayload: Record<string, unknown> = {};
        for (const [subtest, input] of Object.entries(toolData.inputs)) {
          const entry: Record<string, unknown> = { rawScore: input.rawScore };
          if (input.correctItems) entry.correctItems = input.correctItems;
          if (input.wrongItems) entry.wrongItems = input.wrongItems;
          if (input.exampleItems) entry.exampleItems = input.exampleItems;
          subtestPayload[subtest] = entry;
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
      case 'syntax':
        return <SyntaxScoreForm ageMonths={ageMonths} />;
      case 'problem_solving':
        return <ProblemSolvingScoreForm ageMonths={ageMonths} />;
      case 'apac':
        return <ApacScoreForm ageMonths={ageMonths} />;
      case 'cplc':
        return <CplcScoreForm ageMonths={ageMonths} />;
      case 'language_analysis':
        return <LanguageAnalysisForm />;
      default:
        return <p className="text-muted-foreground py-4">준비 중입니다.</p>;
    }
  };

  // 미완료 도구 이름 목록
  const incompleteTools = activeSelectedTools
    .filter((id) => !isToolComplete(id))
    .map((id) => TOOL_METADATA[id].name);

  // 결과 표시용 데이터 구성
  const resultsForDisplay: Record<string, { text: string; data?: Record<string, unknown> }> = {};
  for (const toolId of activeSelectedTools) {
    const apiResult = tools[toolId]?.apiResult;
    if (apiResult) {
      resultsForDisplay[toolId] = { text: apiResult.text, data: apiResult.data };
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 상단 정보 바 */}
        <Card className="sticky top-4 z-10 mx-auto mb-8 max-w-xl px-6 shadow-lg">
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
      </main>
    </div>
  );
}
