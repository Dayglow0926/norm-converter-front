'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/widgets/header';
import { SelsiScoreForm } from '@/features/score-entry';
import { useChildInfoStore, formatAgeResult } from '@/features/child-info';
import { TOOL_METADATA, isToolActive, type AssessmentToolId } from '@/entities/assessment-tool';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ScoreEntryContentProps {
  tool: string;
}

export function ScoreEntryContent({ tool }: ScoreEntryContentProps) {
  const router = useRouter();
  const { childInfo, ageResult } = useChildInfoStore();

  const toolId = tool as AssessmentToolId;
  const toolMeta = TOOL_METADATA[toolId];
  const isValidTool = toolMeta && isToolActive(toolId);

  // 라우팅 가드: 아동 정보가 없거나 유효하지 않은 도구면 리다이렉트
  useEffect(() => {
    if (!childInfo || !ageResult) {
      router.replace('/');
      return;
    }
    if (!isValidTool) {
      router.replace('/select-tool');
    }
  }, [childInfo, ageResult, isValidTool, router]);

  // 유효하지 않으면 빈 화면
  if (!childInfo || !ageResult || !isValidTool) {
    return null;
  }

  const ageMonths = ageResult.totalMonths;

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 아동 정보 + 선택된 도구 요약 */}
        <Card className="mb-8 max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">아동 정보</p>
                <p className="text-lg font-semibold">
                  {childInfo.name} ({childInfo.gender === 'male' ? '남' : '여'})
                </p>
                <p className="text-muted-foreground">
                  {formatAgeResult(ageResult)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">평가도구</p>
                <p className="text-lg font-semibold">{toolMeta.name}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push('/select-tool')}
                >
                  도구 변경
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 점수 입력 폼 */}
        <div className="max-w-xl mx-auto">
          {toolId === 'selsi' && (
            <SelsiScoreForm ageMonths={ageMonths} gender={childInfo.gender} />
          )}
          {/* 향후 다른 도구 추가 */}
          {/* {toolId === 'pres' && <PresScoreForm ... />} */}
        </div>

        {/* 네비게이션 */}
        <div className="max-w-xl mx-auto mt-8 flex justify-between">
          <Button variant="outline" onClick={() => router.push('/select-tool')}>
            ← 도구 선택
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            처음으로
          </Button>
        </div>
      </main>
    </div>
  );
}
