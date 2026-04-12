'use client';

/**
 * PRES 점수 입력 폼 컴포넌트
 * 수용/표현 원점수 + 정반응/오반응 번호 입력
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  PRES_ITEM_PLACEHOLDERS,
  PRES_LABELS,
  PRES_NOTES,
  PRES_SCORE_LIMITS,
} from '@/entities/assessment-tool';
import { useScoreEntryStore } from '../model/store';

interface PresScoreFormProps {
  ageMonths: number;
}

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
    const limits = PRES_SCORE_LIMITS[subtest];

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
                <th className="px-2 py-3 text-left font-medium">{PRES_LABELS.subtestHeader}</th>
                <th className="px-2 py-3 text-center font-medium">{PRES_LABELS.rawScoreHeader}</th>
                <th className="px-2 py-3 text-center font-medium">
                  {PRES_LABELS.correctItemsHeader}
                </th>
                <th className="px-2 py-3 text-center font-medium">
                  {PRES_LABELS.wrongItemsHeader}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* 수용언어 */}
              <tr className="border-b">
                <td className="px-2 py-3 font-medium">{PRES_LABELS.receptive}</td>
                <td className="px-2 py-3">
                  <div className="flex flex-col items-center">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={`${PRES_SCORE_LIMITS.receptive.min}-${PRES_SCORE_LIMITS.receptive.max}`}
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
                    placeholder={PRES_ITEM_PLACEHOLDERS.correct}
                    className="w-full text-center text-sm"
                    value={pres?.inputs.receptive?.correctItems ?? ''}
                    onChange={(e) => handleItemsChange('receptive', 'correctItems', e.target.value)}
                  />
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="text"
                    placeholder={PRES_ITEM_PLACEHOLDERS.wrong}
                    className="w-full text-center text-sm"
                    value={pres?.inputs.receptive?.wrongItems ?? ''}
                    onChange={(e) => handleItemsChange('receptive', 'wrongItems', e.target.value)}
                  />
                </td>
              </tr>

              {/* 표현언어 */}
              <tr className="border-b">
                <td className="px-2 py-3 font-medium">{PRES_LABELS.expressive}</td>
                <td className="px-2 py-3">
                  <div className="flex flex-col items-center">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={`${PRES_SCORE_LIMITS.expressive.min}-${PRES_SCORE_LIMITS.expressive.max}`}
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
                    placeholder={PRES_ITEM_PLACEHOLDERS.correct}
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
                    placeholder={PRES_ITEM_PLACEHOLDERS.wrong}
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
          {PRES_NOTES.map((note) => (
            <p key={note} className="text-muted-foreground text-xs">
              {note}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
