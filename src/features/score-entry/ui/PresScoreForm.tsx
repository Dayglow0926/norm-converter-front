'use client';

/**
 * PRES 점수 입력 폼 컴포넌트
 * 수용/표현 원점수 + 정반응/오반응 번호 입력
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useScoreEntryStore } from '../model/store';

interface PresScoreFormProps {
  ageMonths: number;
}

// PRES 원점수 범위
const SCORE_LIMITS = {
  receptive: { min: 1, max: 60 },
  expressive: { min: 1, max: 60 },
} as const;

// 하위검사 라벨
const SUBTEST_LABELS = {
  receptive: '수용언어',
  expressive: '표현언어',
} as const;

export function PresScoreForm({ ageMonths: _ageMonths }: PresScoreFormProps) {
  void _ageMonths;

  const pres = useScoreEntryStore((state) => state.tools.pres);
  const setScore = useScoreEntryStore((state) => state.setScore);
  const setInput = useScoreEntryStore((state) => state.setInput);

  const [inputErrors, setInputErrors] = useState<{
    receptive?: string;
    expressive?: string;
  }>({});

  const handleScoreChange = (subtest: 'receptive' | 'expressive', value: string) => {
    const limits = SCORE_LIMITS[subtest];

    if (value === '') {
      setScore('pres', subtest, null);
      setInputErrors((prev) => ({ ...prev, [subtest]: undefined }));
      return;
    }

    const num = parseInt(value, 10);

    if (isNaN(num)) {
      setInputErrors((prev) => ({ ...prev, [subtest]: '숫자만 입력 가능' }));
      return;
    }

    if (num < limits.min || num > limits.max) {
      setInputErrors((prev) => ({
        ...prev,
        [subtest]: `${limits.min}-${limits.max} 범위만 가능`,
      }));
      setScore('pres', subtest, null);
      return;
    }

    setInputErrors((prev) => ({ ...prev, [subtest]: undefined }));
    setScore('pres', subtest, num);
  };

  const handleItemsChange = (
    subtest: 'receptive' | 'expressive',
    field: 'correctItems' | 'wrongItems',
    value: string
  ) => {
    setInput('pres', subtest, { [field]: value });
  };

  const receptiveScore = pres?.inputs.receptive?.rawScore ?? null;
  const expressiveScore = pres?.inputs.expressive?.rawScore ?? null;

  return (
    <Card className="w-full">
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-3 text-left font-medium">하위검사</th>
                <th className="px-2 py-3 text-center font-medium">원점수</th>
                <th className="px-2 py-3 text-center font-medium">정반응 번호</th>
                <th className="px-2 py-3 text-center font-medium">오반응 번호</th>
              </tr>
            </thead>
            <tbody>
              {/* 수용언어 */}
              <tr className="border-b">
                <td className="px-2 py-3 font-medium">{SUBTEST_LABELS.receptive}</td>
                <td className="px-2 py-3">
                  <div className="flex flex-col items-center">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="1-60"
                      className={`w-20 text-center ${inputErrors.receptive ? 'border-destructive' : ''}`}
                      value={receptiveScore ?? ''}
                      onChange={(e) => handleScoreChange('receptive', e.target.value)}
                      aria-invalid={!!inputErrors.receptive}
                    />
                    {inputErrors.receptive && (
                      <span className="text-destructive mt-1 text-xs">{inputErrors.receptive}</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="text"
                    placeholder="1, 2, 3-6"
                    className="w-full text-center text-sm"
                    value={pres?.inputs.receptive?.correctItems ?? ''}
                    onChange={(e) => handleItemsChange('receptive', 'correctItems', e.target.value)}
                  />
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="text"
                    placeholder="7, 8, 9-12"
                    className="w-full text-center text-sm"
                    value={pres?.inputs.receptive?.wrongItems ?? ''}
                    onChange={(e) => handleItemsChange('receptive', 'wrongItems', e.target.value)}
                  />
                </td>
              </tr>

              {/* 표현언어 */}
              <tr className="border-b">
                <td className="px-2 py-3 font-medium">{SUBTEST_LABELS.expressive}</td>
                <td className="px-2 py-3">
                  <div className="flex flex-col items-center">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="1-60"
                      className={`w-20 text-center ${inputErrors.expressive ? 'border-destructive' : ''}`}
                      value={expressiveScore ?? ''}
                      onChange={(e) => handleScoreChange('expressive', e.target.value)}
                      aria-invalid={!!inputErrors.expressive}
                    />
                    {inputErrors.expressive && (
                      <span className="text-destructive mt-1 text-xs">
                        {inputErrors.expressive}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="text"
                    placeholder="1, 2, 3-6"
                    className="w-full text-center text-sm"
                    value={pres?.inputs.expressive?.correctItems ?? ''}
                    onChange={(e) =>
                      handleItemsChange('expressive', 'correctItems', e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="text"
                    placeholder="7, 8, 9-12"
                    className="w-full text-center text-sm"
                    value={pres?.inputs.expressive?.wrongItems ?? ''}
                    onChange={(e) => handleItemsChange('expressive', 'wrongItems', e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 안내 문구 */}
        <div className="mt-4 space-y-1">
          <p className="text-muted-foreground text-xs">* 원점수 범위: 수용/표현 각 1-60점</p>
          <p className="text-muted-foreground text-xs">
            * 정반응/오반응 번호: 쉼표로 구분, 범위는 &quot;3-6&quot; 형식으로 입력 (예: 1, 2, 3-6,
            10)
          </p>
          <p className="text-muted-foreground text-xs">
            * PRES는 성별 구분 없이 동일한 규준을 적용합니다
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
