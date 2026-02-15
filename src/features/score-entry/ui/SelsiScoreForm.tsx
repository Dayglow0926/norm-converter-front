'use client';

/**
 * SELSI 점수 입력 폼 컴포넌트
 * 수용/표현 원점수 + 정반응/오반응 번호 입력
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useScoreEntryStore } from '../model/store';
import type { Gender } from '@/entities/child';

interface SelsiScoreFormProps {
  ageMonths: number;
  gender: Gender;
}

// SELSI 원점수 범위
const SCORE_LIMITS = {
  receptive: { min: 0, max: 54 },
  expressive: { min: 0, max: 54 },
} as const;

// 하위검사 라벨
const SUBTEST_LABELS = {
  receptive: '수용언어',
  expressive: '표현언어',
} as const;

export function SelsiScoreForm({ ageMonths: _ageMonths, gender: _gender }: SelsiScoreFormProps) {
  // ageMonths, gender는 향후 결과 요청 시 사용
  void _ageMonths;
  void _gender;
  const { selsiScores, selsiInputs, setSelsiScore, setSelsiInput } = useScoreEntryStore();

  // 입력값 유효성 에러
  const [inputErrors, setInputErrors] = useState<{
    receptive?: string;
    expressive?: string;
  }>({});

  // 원점수 핸들러
  const handleScoreChange = (subtest: 'receptive' | 'expressive', value: string) => {
    const limits = SCORE_LIMITS[subtest];

    // 빈 값 처리
    if (value === '') {
      setSelsiScore(subtest, null);
      setInputErrors((prev) => ({ ...prev, [subtest]: undefined }));
      return;
    }

    const num = parseInt(value, 10);

    // 숫자가 아닌 경우
    if (isNaN(num)) {
      setInputErrors((prev) => ({ ...prev, [subtest]: '숫자만 입력 가능' }));
      return;
    }

    // 범위 검증
    if (num < limits.min || num > limits.max) {
      setInputErrors((prev) => ({
        ...prev,
        [subtest]: `${limits.min}-${limits.max} 범위만 가능`,
      }));
      setSelsiScore(subtest, null);
      return;
    }

    // 유효한 값
    setInputErrors((prev) => ({ ...prev, [subtest]: undefined }));
    setSelsiScore(subtest, num);
  };

  // 정반응/오반응 번호 핸들러
  const handleItemsChange = (
    subtest: 'receptive' | 'expressive',
    field: 'correctItems' | 'wrongItems',
    value: string
  ) => {
    setSelsiInput(subtest, { [field]: value });
  };

  // 통합 점수 계산
  const combinedScore =
    selsiScores.receptive !== null && selsiScores.expressive !== null
      ? selsiScores.receptive + selsiScores.expressive
      : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>SELSI 점수 입력</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 점수 입력 테이블 */}
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
                      placeholder="0-54"
                      className={`w-20 text-center ${inputErrors.receptive ? 'border-destructive' : ''}`}
                      value={selsiScores.receptive ?? ''}
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
                    value={selsiInputs.receptive.correctItems}
                    onChange={(e) => handleItemsChange('receptive', 'correctItems', e.target.value)}
                  />
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="text"
                    placeholder="7, 8, 9-12"
                    className="w-full text-center text-sm"
                    value={selsiInputs.receptive.wrongItems}
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
                      placeholder="0-54"
                      className={`w-20 text-center ${inputErrors.expressive ? 'border-destructive' : ''}`}
                      value={selsiScores.expressive ?? ''}
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
                    value={selsiInputs.expressive.correctItems}
                    onChange={(e) => handleItemsChange('expressive', 'correctItems', e.target.value)}
                  />
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="text"
                    placeholder="7, 8, 9-12"
                    className="w-full text-center text-sm"
                    value={selsiInputs.expressive.wrongItems}
                    onChange={(e) => handleItemsChange('expressive', 'wrongItems', e.target.value)}
                  />
                </td>
              </tr>

              {/* 통합 (자동 계산) */}
              <tr className="bg-muted/30">
                <td className="px-2 py-3 font-medium">통합</td>
                <td className="text-muted-foreground px-2 py-3 text-center font-semibold">
                  {combinedScore ?? '-'}
                </td>
                <td className="px-2 py-3 text-center text-muted-foreground">-</td>
                <td className="px-2 py-3 text-center text-muted-foreground">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 안내 문구 */}
        <div className="mt-4 space-y-1">
          <p className="text-muted-foreground text-xs">
            * 원점수 범위: 수용/표현 각 0-54점, 통합 0-108점
          </p>
          <p className="text-muted-foreground text-xs">
            * 정반응/오반응 번호: 쉼표로 구분, 범위는 &quot;3-6&quot; 형식으로 입력 (예: 1, 2, 3-6, 10)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
