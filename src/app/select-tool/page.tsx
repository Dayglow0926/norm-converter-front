'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/widgets/header';
import { TestSelectionGrid } from '@/features/test-selection';
import { useChildInfoStore } from '@/features/child-info';
import { formatAgeResult } from '@/features/child-info';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SelectToolPage() {
  const router = useRouter();
  const { childInfo, ageResult } = useChildInfoStore();

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

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 아동 정보 요약 */}
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
              <Button variant="outline" onClick={() => router.push('/')}>
                수정
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 평가도구 선택 그리드 */}
        <div className="max-w-4xl mx-auto">
          <TestSelectionGrid 
            ageMonths={ageMonths} 
            onToolSelect={(toolId) => router.push(`/score-entry/${toolId}`)}
          />
        </div>
      </main>
    </div>
  );
}
