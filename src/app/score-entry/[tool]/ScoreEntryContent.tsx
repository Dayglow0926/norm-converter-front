'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/widgets/header';
import { SelsiScoreForm, useScoreEntryStore } from '@/features/score-entry';
import { useChildInfoStore, formatAgeResult } from '@/features/child-info';
import { useTestSelectionStore } from '@/features/test-selection';
import { TOOL_METADATA, isToolActive, type AssessmentToolId } from '@/entities/assessment-tool';
import { normClient } from '@/shared/api/norm-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ScoreEntryContentProps {
  tool: string;
}

export function ScoreEntryContent({ tool }: ScoreEntryContentProps) {
  const router = useRouter();
  const { childInfo, ageResult, _hasHydrated, clearChildInfo } = useChildInfoStore();
  const { selsiScores, setSelsiResults, clearScores } = useScoreEntryStore();
  const { clearSelection } = useTestSelectionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const toolId = tool as AssessmentToolId;
  const toolMeta = TOOL_METADATA[toolId];
  const isValidTool = toolMeta && isToolActive(toolId);

  // 라우팅 가드: hydration 완료 후 아동 정보가 없거나 유효하지 않은 도구면 리다이렉트
  useEffect(() => {
    if (!_hasHydrated) return;

    if (!childInfo || !ageResult) {
      router.replace('/');
      return;
    }
    if (!isValidTool) {
      router.replace('/select-tool');
    }
  }, [childInfo, ageResult, isValidTool, _hasHydrated, router]);

  // hydration 완료 전 또는 유효하지 않으면 로딩
  if (!_hasHydrated || !childInfo || !ageResult || !isValidTool) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  const ageMonths = ageResult.totalMonths;

  // SELSI 점수 입력 완료 여부
  const isSelsiComplete =
    toolId === 'selsi' && selsiScores.receptive !== null && selsiScores.expressive !== null;

  // 도구 변경: 점수만 초기화
  const handleToolChange = () => {
    clearScores();
    router.push('/select-tool');
  };

  // 처음으로: 모든 정보 초기화
  const handleGoHome = () => {
    clearScores();
    clearSelection();
    clearChildInfo();
    router.push('/');
  };

  // 결과 요청: API 호출
  const handleRequestResult = async () => {
    if (!isSelsiComplete || !childInfo || !ageResult) return;

    setIsLoading(true);
    setApiError(null);

    try {
      // 수용언어 변환
      const receptiveResult = await normClient.convert<{ equivalentAge: number }>('selsi', {
        subtest: 'receptive',
        rawScore: selsiScores.receptive,
        ageMonths: ageResult.totalMonths,
        gender: childInfo.gender,
      });

      // 표현언어 변환
      const expressiveResult = await normClient.convert<{ equivalentAge: number }>('selsi', {
        subtest: 'expressive',
        rawScore: selsiScores.expressive,
        ageMonths: ageResult.totalMonths,
        gender: childInfo.gender,
      });

      // 통합 변환
      const combinedResult = await normClient.convert<{ equivalentAge: number }>('selsi', {
        subtest: 'combined',
        rawScore: (selsiScores.receptive ?? 0) + (selsiScores.expressive ?? 0),
        ageMonths: ageResult.totalMonths,
        gender: childInfo.gender,
      });

      // 결과 저장
      setSelsiResults({
        receptive: receptiveResult.equivalentAge,
        expressive: expressiveResult.equivalentAge,
        combined: combinedResult.equivalentAge,
      });

      // TODO: 결과 페이지로 이동 (현재는 알림으로 확인)
      alert(
        `API 호출 성공!\n수용: ${receptiveResult.equivalentAge}개월\n표현: ${expressiveResult.equivalentAge}개월\n통합: ${combinedResult.equivalentAge}개월`
      );
    } catch (err) {
      console.error('API 호출 실패:', err);
      setApiError(err instanceof Error ? err.message : 'API 호출 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 상단 정보 바: 아동 정보 + 네비게이션 */}
        <Card className="sticky top-4 z-10 mx-auto mb-8 max-w-xl shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              {/* 아동 정보 */}
              <div>
                <p className="text-lg font-semibold">
                  {childInfo.name} ({childInfo.gender === 'male' ? '남' : '여'})
                </p>
                <p className="text-muted-foreground text-sm">{formatAgeResult(ageResult)}</p>
              </div>

              {/* 네비게이션 버튼 */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleToolChange}>
                  ← 도구 변경
                </Button>
                <Button variant="ghost" size="sm" onClick={handleGoHome}>
                  처음으로
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 점수 입력 폼 */}
        <div className="mx-auto max-w-xl">
          {toolId === 'selsi' && <SelsiScoreForm ageMonths={ageMonths} gender={childInfo.gender} />}
          {/* 향후 다른 도구 추가 */}
          {/* {toolId === 'pres' && <PresScoreForm ... />} */}
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
            disabled={!isSelsiComplete || isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? '변환 중...' : '결과 확인 →'}
          </Button>
          {!isSelsiComplete && (
            <p className="text-muted-foreground mt-2 text-center text-sm">
              수용언어와 표현언어 점수를 모두 입력해주세요
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
