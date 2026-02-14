'use client';

import { ChildInfoForm, useChildInfoStore } from '@/features/child-info';
import { TestSelectionGrid, useTestSelectionStore } from '@/features/test-selection';
import { SelsiScoreForm } from '@/features/score-entry';

export function HomePage() {
  const { ageResult, childInfo } = useChildInfoStore();
  const { selectedTool } = useTestSelectionStore();

  const ageMonths = ageResult?.totalMonths ?? null;

  return (
    <main className="min-h-screen py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">언어재활사 규준변환기</h1>
          <p className="text-muted-foreground">SLP Norm Converter</p>
        </header>

        {/* 1단계: 아동 정보 입력 */}
        <section className="mb-8 flex justify-center">
          <ChildInfoForm />
        </section>

        {/* 2단계: 평가도구 선택 (연령 계산 완료 시 표시) */}
        {ageResult && (
          <section className="mb-8">
            <TestSelectionGrid ageMonths={ageMonths} />
          </section>
        )}

        {/* 3단계: SELSI 점수 입력 (SELSI 선택 시 표시) */}
        {selectedTool === 'selsi' && ageMonths && childInfo && (
          <section className="mb-8 max-w-xl mx-auto">
            <SelsiScoreForm ageMonths={ageMonths} gender={childInfo.gender} />
          </section>
        )}
      </div>
    </main>
  );
}
