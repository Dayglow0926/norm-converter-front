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
        {/* 상단 정보 바: 아동 정보 + 네비게이션 */}
        <Card className="mx-auto mb-8 max-w-xl sticky top-4 z-10 shadow-lg">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/select-tool')}
                >
                  ← 도구 변경
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/')}
                >
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
      </main>
    </div>
  );
}
