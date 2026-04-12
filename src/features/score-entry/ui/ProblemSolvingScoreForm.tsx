'use client';

/**
 * 언어문제해결력 점수 입력 폼 컴포넌트
 * 3개 하위검사(원인이유/해결추론/단서추측) 원점수 + 지시문 번호 입력
 * 총점: 3개 합산 자동 계산
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  PROBLEM_SOLVING_SUBTESTS,
  type ProblemSolvingSubtestKey,
} from '@/entities/assessment-tool';
import { useScoreEntryStore } from '../model/store';

interface ProblemSolvingScoreFormProps {
  ageMonths: number;
}

export function ProblemSolvingScoreForm({ ageMonths: _ageMonths }: ProblemSolvingScoreFormProps) {
  void _ageMonths;

  const problemSolving = useScoreEntryStore((state) => state.tools.problem_solving);
  const setScore = useScoreEntryStore((state) => state.setScore);
  const setInput = useScoreEntryStore((state) => state.setInput);

  const [scoreErrors, setScoreErrors] = useState<Partial<Record<ProblemSolvingSubtestKey, string>>>(
    {}
  );

  const handleScoreChange = (subtest: ProblemSolvingSubtestKey, value: string) => {
    if (value === '') {
      setScore('problem_solving', subtest, null);
      setScoreErrors((prev) => ({ ...prev, [subtest]: undefined }));
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      setScoreErrors((prev) => ({ ...prev, [subtest]: '0 이상의 숫자를 입력하세요' }));
      return;
    }

    setScoreErrors((prev) => ({ ...prev, [subtest]: undefined }));
    setScore('problem_solving', subtest, num);
  };

  const handleExampleItemsChange = (subtest: ProblemSolvingSubtestKey, value: string) => {
    setInput('problem_solving', subtest, { exampleItems: value });
  };

  // 총점 자동 합산
  const scores = PROBLEM_SOLVING_SUBTESTS.map((s) => problemSolving?.inputs[s.key]?.rawScore ?? null);
  const totalScore = scores.every((s) => s !== null)
    ? scores.reduce((sum, s) => sum! + s!, 0)
    : null;

  // 부분 입력 경고 (1~2개만 입력)
  const filledCount = scores.filter((s) => s !== null).length;
  const showPartialWarning = filledCount > 0 && filledCount < 3;

  return (
    <Card className="w-full">
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-3 text-left font-medium">하위검사</th>
                <th className="px-2 py-3 text-center font-medium">원점수</th>
                <th className="px-2 py-3 text-center font-medium">지시문 번호</th>
              </tr>
            </thead>
            <tbody>
              {PROBLEM_SOLVING_SUBTESTS.map(({ key, label }) => {
                const currentScore = problemSolving?.inputs[key]?.rawScore ?? null;
                const currentExample = problemSolving?.inputs[key]?.exampleItems ?? '';
                const error = scoreErrors[key];

                return (
                  <tr key={key} className="border-b">
                    <td className="px-2 py-3 font-medium">{label}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col items-center">
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0"
                          className={`w-20 text-center ${error ? 'border-destructive' : ''}`}
                          value={currentScore ?? ''}
                          onChange={(e) => handleScoreChange(key, e.target.value)}
                          aria-invalid={!!error}
                        />
                        {error && <span className="text-destructive mt-1 text-xs">{error}</span>}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <Input
                        type="text"
                        placeholder="예: 1,2,3"
                        className="w-full text-center text-sm"
                        value={currentExample}
                        onChange={(e) => handleExampleItemsChange(key, e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}

              {/* 총점 자동 합산 행 */}
              <tr className="bg-muted/30">
                <td className="px-2 py-3 font-medium">총점 (자동)</td>
                <td className="text-muted-foreground px-2 py-3 text-center font-semibold">
                  {totalScore ?? '-'}
                </td>
                <td className="text-muted-foreground px-2 py-3 text-center">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 부분 입력 경고 */}
        {showPartialWarning && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2">
            <p className="text-xs text-amber-700">
              3개 하위검사를 모두 입력해야 결과가 생성됩니다 ({filledCount}/3 입력됨)
            </p>
          </div>
        )}

        <div className="mt-4 space-y-1">
          <p className="text-muted-foreground text-xs">
            * 3개 하위검사를 모두 입력하면 규준 결과가 생성됩니다
          </p>
          <p className="text-muted-foreground text-xs">
            * 3개를 모두 비워두면 시행 불가 결과 문장이 생성됩니다
          </p>
          <p className="text-muted-foreground text-xs">
            * 1~2개만 입력하면 결과를 생성할 수 없습니다
          </p>
          <p className="text-muted-foreground text-xs">
            * 지시문 번호: 쉼표로 구분 (예: 1,2,3) — 선택 사항
          </p>
          <p className="text-muted-foreground text-xs">* 연령 범위: 60-143개월 (5세~11세 11개월)</p>
        </div>
      </CardContent>
    </Card>
  );
}
