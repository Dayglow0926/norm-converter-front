'use client';

/**
 * CPLC 점수 입력 폼 컴포넌트
 * 4개 영역 원점수 입력 → 영역별/총점 백분율 (규준 변환 아님)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

const CPLC_SUBTESTS: CplcSubtestMeta[] = [
  { key: 'discourse_management', label: '담화관리', maxScore: 33 },
  { key: 'contextual_variation', label: '상황에 따른 조절 및 적응', maxScore: 39 },
  { key: 'communication_intent', label: '의사소통 의도 사용', maxScore: 45 },
  { key: 'nonverbal_communication', label: '비언어적 의사소통', maxScore: 24 },
];

const CPLC_TOTAL_MAX = 141;

export function CplcScoreForm({ ageMonths: _ageMonths }: CplcScoreFormProps) {
  void _ageMonths;

  const cplc = useScoreEntryStore((state) => state.tools.cplc);
  const setScore = useScoreEntryStore((state) => state.setScore);

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

  // 총점 자동 합산
  const scores = CPLC_SUBTESTS.map((s) => cplc?.inputs[s.key]?.rawScore ?? null);
  const totalScore = scores.every((s) => s !== null)
    ? scores.reduce((sum, s) => (sum ?? 0) + (s ?? 0), 0)
    : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>CPLC 점수 입력</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-3 text-left font-medium">영역</th>
                <th className="px-2 py-3 text-center font-medium">만점</th>
                <th className="px-2 py-3 text-center font-medium">원점수</th>
              </tr>
            </thead>
            <tbody>
              {CPLC_SUBTESTS.map(({ key, label, maxScore }) => {
                const currentScore = cplc?.inputs[key]?.rawScore ?? null;
                const isInvalid =
                  currentScore !== null && (currentScore < 0 || currentScore > maxScore);

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
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-muted-foreground text-xs">* 4개 영역 모두 입력 후 결과 확인 가능</p>
          <p className="text-muted-foreground text-xs">* 결과: 원점수 → 영역별/총점 백분율(%)</p>
          <p className="text-muted-foreground text-xs">* 연령 범위: 60-143개월 (5세~11세 11개월)</p>
        </div>
      </CardContent>
    </Card>
  );
}
