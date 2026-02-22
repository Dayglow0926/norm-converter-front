'use client';

/**
 * APAC 점수 입력 폼 컴포넌트
 * rawScore = 오류 개수 (0-70, 정수). 낮을수록 정확도 높음.
 * imitationType: 전체 모방(total) | 일부 모방(partial, 시행 불가)
 */

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useScoreEntryStore } from '../model/store';

interface ApacScoreFormProps {
  ageMonths: number;
}

const MIN_SCORE = 0;
const MAX_SCORE = 70;

type ImitationType = 'total' | 'partial' | '';

export function ApacScoreForm({ ageMonths: _ageMonths }: ApacScoreFormProps) {
  void _ageMonths;

  const apac = useScoreEntryStore((state) => state.tools.apac);
  const setScore = useScoreEntryStore((state) => state.setScore);
  const setInput = useScoreEntryStore((state) => state.setInput);

  // rawScore: inputs.rawScore.rawScore
  // imitationType: inputs.rawScore.correctItems ("total" | "partial" | "")
  const currentScore = apac?.inputs.rawScore?.rawScore ?? null;
  const imitationType = (apac?.inputs.rawScore?.correctItems ?? '') as ImitationType;
  const isPartial = imitationType === 'partial';
  const isTotal = imitationType === 'total';

  const handleImitationChange = (value: 'total' | 'partial') => {
    setInput('apac', 'rawScore', { correctItems: value });
    if (value === 'partial') {
      setScore('apac', 'rawScore', null);
    }
  };

  const handleScoreChange = (value: string) => {
    if (value === '') {
      setScore('apac', 'rawScore', null);
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num < MIN_SCORE || num > MAX_SCORE) {
      setScore('apac', 'rawScore', null);
      return;
    }
    setScore('apac', 'rawScore', num);
  };

  const scoreInvalid =
    isTotal && currentScore !== null && (currentScore < MIN_SCORE || currentScore > MAX_SCORE);

  const btnBase =
    'flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none';
  const btnActive = 'bg-primary text-primary-foreground border-primary';
  const btnInactive = 'border-border hover:bg-muted';

  return (
    <Card className="w-full">
      <CardContent className="space-y-5 pt-4">
        {/* 모방 유형 선택 */}
        <div>
          <p className="mb-2 text-sm font-medium">모방 유형</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleImitationChange('total')}
              className={`${btnBase} ${isTotal ? btnActive : btnInactive}`}
            >
              전체 모방
            </button>
            <button
              type="button"
              onClick={() => handleImitationChange('partial')}
              className={`${btnBase} ${isPartial ? btnActive : btnInactive}`}
            >
              일부 모방
              <span className="ml-1 text-xs font-normal opacity-70">(시행 불가)</span>
            </button>
          </div>
        </div>

        {/* 시행 불가 안내 */}
        {isPartial && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              일부 모방으로 시행하여 결과 해석이 제한됩니다. 원점수 입력 불필요.
            </p>
          </div>
        )}

        {/* 원점수 입력 (전체 모방 선택 시) */}
        {isTotal && (
          <div>
            <p className="mb-2 text-sm font-medium">오류 개수 (원점수)</p>
            <div className="flex items-center gap-3">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={`${MIN_SCORE}-${MAX_SCORE}`}
                className={`w-24 text-center ${scoreInvalid ? 'border-destructive' : ''}`}
                value={currentScore ?? ''}
                onChange={(e) => handleScoreChange(e.target.value)}
                aria-invalid={scoreInvalid}
              />
              <span className="text-muted-foreground text-sm">/ 70점</span>
            </div>
            {scoreInvalid && (
              <p className="text-destructive mt-1 text-xs">
                {MIN_SCORE}-{MAX_SCORE} 범위만 가능
              </p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">
            * 원점수 = 오류 개수 (낮을수록 정확도 높음, 0-70)
          </p>
          <p className="text-muted-foreground text-xs">
            * 연령 범위: 30개월 이상 (78개월 이상은 최고 연령 규준 적용)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
