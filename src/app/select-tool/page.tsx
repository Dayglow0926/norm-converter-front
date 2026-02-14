'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/widgets/header';
import { TestSelectionGrid, useTestSelectionStore } from '@/features/test-selection';
import { useChildInfoStore } from '@/features/child-info';
import { formatAgeResult } from '@/features/child-info';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SelectToolPage() {
  const router = useRouter();
  const { childInfo, ageResult } = useChildInfoStore();
  const { selectedTools } = useTestSelectionStore();

  // 라우팅 가드: 아동 정보가 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (!childInfo || !ageResult) {
      router.replace('/');
    }
  }, [childInfo, ageResult, router]);

  // 아동 정보가 없으면 로딩 또는 빈 화면
  if (!childInfo || !ageResult) {
    return null;
  }

  const ageMonths = ageResult.totalMonths;
  const hasSelection = selectedTools.length > 0;

  const handleNext = () => {
    if (hasSelection) {
      // 첫 번째 선택된 도구의 점수 입력 페이지로 이동
      router.push(`/score-entry/${selectedTools[0]}`);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 아동 정보 + 선택 상태 (상단 고정) */}
        <Card className="mb-8 max-w-4xl mx-auto sticky top-4 z-10 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              {/* 아동 정보 */}
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">아동 정보</p>
                  <p className="text-lg font-semibold">
                    {childInfo.name} ({childInfo.gender === 'male' ? '남' : '여'})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatAgeResult(ageResult)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                  수정
                </Button>
              </div>

              {/* 선택 상태 및 다음 버튼 */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">선택된 도구</p>
                  <p className={`text-lg font-semibold ${hasSelection ? 'text-primary' : 'text-muted-foreground'}`}>
                    {hasSelection ? `${selectedTools.length}개` : '없음'}
                  </p>
                </div>
                <Button 
                  onClick={handleNext} 
                  disabled={!hasSelection}
                  size="lg"
                >
                  점수 입력 →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 평가도구 선택 그리드 */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">평가도구 선택</h2>
          <TestSelectionGrid ageMonths={ageMonths} />
        </div>
      </main>
    </div>
  );
}
