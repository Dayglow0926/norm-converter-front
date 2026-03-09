'use client';

/**
 * K-CELF-5 ORS (관찰 평가척도) 점수 입력 폼
 * 4개 영역 원점수 → 영역별 백분율 (규준 변환 아님)
 */

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useScoreEntryStore } from '../model/store';

type OrsSubtest = 'listening' | 'speaking' | 'reading' | 'writing';

interface OrsSubtestMeta {
  key: OrsSubtest;
  label: string;
  maxScore: number;
}

const ORS_SUBTESTS: OrsSubtestMeta[] = [
  { key: 'listening', label: '듣기', maxScore: 36 },
  { key: 'speaking', label: '말하기', maxScore: 76 },
  { key: 'reading', label: '읽기', maxScore: 24 },
  { key: 'writing', label: '쓰기', maxScore: 24 },
];

const ORS_TOTAL_MAX = 160;

export function Kcelf5OrsScoreForm() {
  const ors = useScoreEntryStore((state) => state.tools.kcelf5_ors);
  const setScore = useScoreEntryStore((state) => state.setScore);

  const handleScoreChange = (subtest: OrsSubtest, maxScore: number, value: string) => {
    if (value === '') {
      setScore('kcelf5_ors', subtest, null);
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > maxScore) {
      setScore('kcelf5_ors', subtest, null);
      return;
    }
    setScore('kcelf5_ors', subtest, num);
  };

  // 총점 자동 합산
  const scores = ORS_SUBTESTS.map((s) => ors?.inputs[s.key]?.rawScore ?? null);
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
              </tr>
            </thead>
            <tbody>
              {ORS_SUBTESTS.map(({ key, label, maxScore }) => {
                const currentScore = ors?.inputs[key]?.rawScore ?? null;
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
                <td className="text-muted-foreground px-2 py-3 text-center">{ORS_TOTAL_MAX}점</td>
                <td className="text-muted-foreground px-2 py-3 text-center font-semibold">
                  {totalScore ?? '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-muted-foreground text-xs">* 4개 영역 모두 입력 후 결과 확인 가능</p>
          <p className="text-muted-foreground text-xs">* 관찰자 평가 기반 (규준 변환 아님, 백분율 산출)</p>
        </div>
      </CardContent>
    </Card>
  );
}
