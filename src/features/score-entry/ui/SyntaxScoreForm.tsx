'use client';

/**
 * 구문의미이해력 점수 입력 폼 컴포넌트
 * 하위검사 없음 — 단일 원점수만 입력
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useScoreEntryStore } from '../model/store';

interface SyntaxScoreFormProps {
  ageMonths: number;
}

const MIN_SCORE = 0;
const MAX_SCORE = 63;

export function SyntaxScoreForm({ ageMonths: _ageMonths }: SyntaxScoreFormProps) {
  void _ageMonths;

  const syntax = useScoreEntryStore((state) => state.tools.syntax);
  const setScore = useScoreEntryStore((state) => state.setScore);

  const [inputError, setInputError] = useState<string | undefined>();

  const currentScore = syntax?.inputs.total?.rawScore ?? null;

  const handleScoreChange = (value: string) => {
    if (value === '') {
      setScore('syntax', 'total', null);
      setInputError(undefined);
      return;
    }

    const num = parseInt(value, 10);

    if (isNaN(num)) {
      setInputError('숫자만 입력 가능');
      return;
    }

    if (num < MIN_SCORE || num > MAX_SCORE) {
      setInputError(`${MIN_SCORE}-${MAX_SCORE} 범위만 가능`);
      setScore('syntax', 'total', null);
      return;
    }

    setInputError(undefined);
    setScore('syntax', 'total', num);
  };

  return (
    <Card className="w-full">
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-3 text-left font-medium">검사</th>
                <th className="px-2 py-3 text-center font-medium">원점수</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-2 py-3 font-medium">구문의미이해력</td>
                <td className="px-2 py-3">
                  <div className="flex flex-col items-center">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={`${MIN_SCORE}-${MAX_SCORE}`}
                      className={`w-20 text-center ${inputError ? 'border-destructive' : ''}`}
                      value={currentScore ?? ''}
                      onChange={(e) => handleScoreChange(e.target.value)}
                      aria-invalid={!!inputError}
                    />
                    {inputError && (
                      <span className="text-destructive mt-1 text-xs">{inputError}</span>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-muted-foreground text-xs">* 원점수 범위: 0-63점</p>
          <p className="text-muted-foreground text-xs">* 연령 범위: 48-119개월 (4세~9세 11개월)</p>
        </div>
      </CardContent>
    </Card>
  );
}
