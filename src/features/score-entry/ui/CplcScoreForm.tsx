'use client';

/**
 * CPLC 점수 입력 폼 컴포넌트
 * 4개 영역 원점수 + 정반응/오반응 번호 입력 → 영역별/총점 백분율 (규준 변환 아님)
 */

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useScoreEntryStore } from '../model/store';

interface CplcScoreFormProps {
  ageMonths: number;
}

type CplcSubtest =
  | 'discourse_management'
  | 'contextual_variation'
  | 'communication_intent'
  | 'nonverbal_communication';

interface CplcSubtestMeta {
  key: CplcSubtest;
  label: string;
  maxScore: number;
  itemMin: number;
  itemMax: number;
}

const CPLC_SUBTESTS: CplcSubtestMeta[] = [
  { key: 'discourse_management', label: '담화관리', maxScore: 33, itemMin: 1, itemMax: 11 },
  { key: 'contextual_variation', label: '상황에 따른 조절 및 적응', maxScore: 39, itemMin: 12, itemMax: 24 },
  { key: 'communication_intent', label: '의사소통 의도 사용', maxScore: 45, itemMin: 25, itemMax: 39 },
  { key: 'nonverbal_communication', label: '비언어적 의사소통', maxScore: 24, itemMin: 40, itemMax: 47 },
];

const CPLC_TOTAL_MAX = 141;

/**
 * "1, 2, 3-6" 형식 문자열을 숫자 배열로 파싱
 */
function parseNumberArray(str: string): number[] {
  if (!str.trim()) return [];
  const result: number[] = [];
  for (const part of str.split(',')) {
    const trimmed = part.trim();
    const range = trimmed.match(/^(\d+)-(\d+)$/);
    if (range) {
      const start = parseInt(range[1], 10);
      const end = parseInt(range[2], 10);
      for (let i = start; i <= end; i++) result.push(i);
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num)) result.push(num);
    }
  }
  return result;
}

/**
 * 문자열의 모든 번호가 [min, max] 범위 안에 있는지 확인
 * 빈 문자열이면 항상 유효
 */
function isItemRangeValid(str: string, min: number, max: number): boolean {
  if (!str.trim()) return true;
  const nums = parseNumberArray(str);
  return nums.every((n) => n >= min && n <= max);
}

export function CplcScoreForm({ ageMonths: _ageMonths }: CplcScoreFormProps) {
  void _ageMonths;

  const cplc = useScoreEntryStore((state) => state.tools.cplc);
  const setScore = useScoreEntryStore((state) => state.setScore);
  const setInput = useScoreEntryStore((state) => state.setInput);

  const handleScoreChange = (subtest: CplcSubtest, maxScore: number, value: string) => {
    if (value === '') {
      setScore('cplc', subtest, null);
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > maxScore) {
      setScore('cplc', subtest, null);
      return;
    }
    setScore('cplc', subtest, num);
  };

  const handleItemsChange = (
    subtest: CplcSubtest,
    field: 'correctItems' | 'wrongItems',
    value: string
  ) => {
    setInput('cplc', subtest, { [field]: value });
  };

  // 총점 자동 합산
  const scores = CPLC_SUBTESTS.map((s) => cplc?.inputs[s.key]?.rawScore ?? null);
  const totalScore = scores.every((s) => s !== null)
    ? scores.reduce((sum, s) => (sum ?? 0) + (s ?? 0), 0)
    : null;

  return (
    <Card className="w-full">
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-3 text-left font-medium">영역</th>
                <th className="px-2 py-3 text-center font-medium">만점</th>
                <th className="px-2 py-3 text-center font-medium">원점수</th>
                <th className="px-2 py-3 text-center font-medium">정반응 번호</th>
                <th className="px-2 py-3 text-center font-medium">오반응 번호</th>
              </tr>
            </thead>
            <tbody>
              {CPLC_SUBTESTS.map(({ key, label, maxScore, itemMin, itemMax }) => {
                const currentScore = cplc?.inputs[key]?.rawScore ?? null;
                const isInvalid =
                  currentScore !== null && (currentScore < 0 || currentScore > maxScore);
                const correctItemsVal = cplc?.inputs[key]?.correctItems ?? '';
                const wrongItemsVal = cplc?.inputs[key]?.wrongItems ?? '';
                const correctRangeError = !isItemRangeValid(correctItemsVal, itemMin, itemMax);
                const wrongRangeError = !isItemRangeValid(wrongItemsVal, itemMin, itemMax);

                return (
                  <tr key={key} className="border-b">
                    <td className="px-2 py-3 font-medium">{label}</td>
                    <td className="text-muted-foreground px-2 py-3 text-center">{maxScore}점</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col items-center">
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder={`0-${maxScore}`}
                          className={`w-20 text-center ${isInvalid ? 'border-destructive' : ''}`}
                          value={currentScore ?? ''}
                          onChange={(e) => handleScoreChange(key, maxScore, e.target.value)}
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && (
                          <span className="text-destructive mt-1 text-xs">0-{maxScore} 범위</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col">
                        <Input
                          type="text"
                          placeholder={`${itemMin}-${itemMax}`}
                          className={`w-full text-center text-sm ${correctRangeError ? 'border-destructive' : ''}`}
                          value={correctItemsVal}
                          onChange={(e) => handleItemsChange(key, 'correctItems', e.target.value)}
                          aria-invalid={correctRangeError}
                        />
                        {correctRangeError && (
                          <span className="text-destructive mt-1 text-xs">
                            {itemMin}-{itemMax}번만 입력 가능
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col">
                        <Input
                          type="text"
                          placeholder={`${itemMin}-${itemMax}`}
                          className={`w-full text-center text-sm ${wrongRangeError ? 'border-destructive' : ''}`}
                          value={wrongItemsVal}
                          onChange={(e) => handleItemsChange(key, 'wrongItems', e.target.value)}
                          aria-invalid={wrongRangeError}
                        />
                        {wrongRangeError && (
                          <span className="text-destructive mt-1 text-xs">
                            {itemMin}-{itemMax}번만 입력 가능
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* 총점 자동 합산 */}
              <tr className="bg-muted/30">
                <td className="px-2 py-3 font-medium">총점 (자동)</td>
                <td className="text-muted-foreground px-2 py-3 text-center">{CPLC_TOTAL_MAX}점</td>
                <td className="text-muted-foreground px-2 py-3 text-center font-semibold">
                  {totalScore ?? '-'}
                </td>
                <td className="text-muted-foreground px-2 py-3 text-center">-</td>
                <td className="text-muted-foreground px-2 py-3 text-center">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-muted-foreground text-xs">* 4개 영역 모두 입력 후 결과 확인 가능</p>
          <p className="text-muted-foreground text-xs">
            * 정반응/오반응 번호: 쉼표로 구분, 범위는 &quot;3-6&quot; 형식 — 각 영역에 해당하는
            번호만 입력 가능 (선택 사항)
          </p>
          <p className="text-muted-foreground text-xs">* 연령 범위: 60-143개월 (5세~11세 11개월)</p>
        </div>
      </CardContent>
    </Card>
  );
}
