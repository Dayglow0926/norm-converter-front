'use client';

/**
 * APAC 점수 입력 폼 컴포넌트
 * rawScore = 오류 개수 (0-70, 정수). 낮을수록 정확도 높음.
 * imitationType: 기본 직접검사(standard) | 전체 모방(total) | 일부 모방(partial, 시행 불가)
 */

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  APAC_IMITATION_LABELS,
  APAC_NOTES,
  APAC_SCORE_RANGE,
  type ApacImitationType,
} from '@/entities/assessment-tool';
import { useScoreEntryStore } from '../model/store';

interface ApacScoreFormProps {
  ageMonths: number;
}

export function ApacScoreForm({ ageMonths: _ageMonths }: ApacScoreFormProps) {
  void _ageMonths;

  const apac = useScoreEntryStore((state) => state.tools.apac);
  const setScore = useScoreEntryStore((state) => state.setScore);
  const setInput = useScoreEntryStore((state) => state.setInput);

  // rawScore: inputs.rawScore.rawScore
  // imitationType: inputs.rawScore.correctItems ("total" | "partial" | "")
  const currentScore = apac?.inputs.rawScore?.rawScore ?? null;
  const imitationType = (apac?.inputs.rawScore?.correctItems ?? '') as ApacImitationType;
  const isDirect = imitationType === '';
  const isTotal = imitationType === 'total';
  const isPartial = imitationType === 'partial';

  const handleImitationChange = (value: ApacImitationType) => {
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
    if (isNaN(num) || num < APAC_SCORE_RANGE.min || num > APAC_SCORE_RANGE.max) {
      setScore('apac', 'rawScore', null);
      return;
    }
    setScore('apac', 'rawScore', num);
  };

  const scoreInvalid =
    !isPartial &&
    currentScore !== null &&
    (currentScore < APAC_SCORE_RANGE.min || currentScore > APAC_SCORE_RANGE.max);

  const btnBase =
    'flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none';
  const btnActive = 'bg-primary text-primary-foreground border-primary';
  const btnInactive = 'border-border hover:bg-muted';

  return (
    <Card className="w-full">
      <CardContent className="space-y-5 pt-4">
        {/* 시행 유형 선택 */}
        <div>
          <p className="mb-2 text-sm font-medium">{APAC_IMITATION_LABELS.title}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleImitationChange('')}
              className={`${btnBase} ${isDirect ? btnActive : btnInactive}`}
            >
              {APAC_IMITATION_LABELS.direct}
              <span className="ml-1 text-xs font-normal opacity-70">
                {APAC_IMITATION_LABELS.directHint}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleImitationChange('total')}
              className={`${btnBase} ${isTotal ? btnActive : btnInactive}`}
            >
              {APAC_IMITATION_LABELS.total}
            </button>
            <button
              type="button"
              onClick={() => handleImitationChange('partial')}
              className={`${btnBase} ${isPartial ? btnActive : btnInactive}`}
            >
              {APAC_IMITATION_LABELS.partial}
              <span className="ml-1 text-xs font-normal opacity-70">
                {APAC_IMITATION_LABELS.partialHint}
              </span>
            </button>
          </div>
        </div>

        {/* 시행 불가 안내 */}
        {isPartial && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {APAC_IMITATION_LABELS.partialNotice}
            </p>
          </div>
        )}

        {/* 원점수 입력 (직접 검사/전체 모방 선택 시) */}
        {!isPartial && (
          <div>
            <p className="mb-2 text-sm font-medium">{APAC_IMITATION_LABELS.scoreTitle}</p>
            <div className="flex items-center gap-3">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={`${APAC_SCORE_RANGE.min}-${APAC_SCORE_RANGE.max}`}
                className={`w-24 text-center ${scoreInvalid ? 'border-destructive' : ''}`}
                value={currentScore ?? ''}
                onChange={(e) => handleScoreChange(e.target.value)}
                aria-invalid={scoreInvalid}
              />
              <span className="text-muted-foreground text-sm">{APAC_IMITATION_LABELS.scoreSuffix}</span>
            </div>
            {scoreInvalid && (
              <p className="text-destructive mt-1 text-xs">
                {APAC_SCORE_RANGE.min}-{APAC_SCORE_RANGE.max} 범위만 가능
              </p>
            )}
          </div>
        )}

        <div className="space-y-1">
          {APAC_NOTES.map((note) => (
            <p key={note} className="text-muted-foreground text-xs">
              {note}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
