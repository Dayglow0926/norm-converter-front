'use client';

/**
 * REVT 점수 입력 폼 컴포넌트
 * 수용/표현 원점수 + 정반응/오반응 번호 입력
 */

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  REVT_ITEM_PLACEHOLDERS,
  REVT_LABELS,
  REVT_NOTES,
  REVT_SCORE_RANGE,
} from '@/entities/assessment-tool';
import { useScoreEntryStore } from '../model/store';

interface RevtScoreFormProps {
  ageMonths: number;
}

export function RevtScoreForm({ ageMonths: _ageMonths }: RevtScoreFormProps) {
  void _ageMonths;

  const revt = useScoreEntryStore((state) => state.tools.revt);
  const setScore = useScoreEntryStore((state) => state.setScore);
  const setInput = useScoreEntryStore((state) => state.setInput);

  const handleScoreChange = (subtest: 'receptive' | 'expressive', value: string) => {
    if (value === '') {
      setScore('revt', subtest, null);
      return;
    }

    const num = parseInt(value, 10);

    // 숫자 입력만 필터링, 범위 검증은 "결과 확인" 버튼 클릭 시 수행
    if (!isNaN(num)) {
      setScore('revt', subtest, num);
    }
  };

  const handleItemsChange = (
    subtest: 'receptive' | 'expressive',
    field: 'correctItems' | 'wrongItems',
    value: string
  ) => {
    setInput('revt', subtest, { [field]: value });
  };

  const receptiveScore = revt?.inputs.receptive?.rawScore ?? null;
  const expressiveScore = revt?.inputs.expressive?.rawScore ?? null;

  return (
    <Card className="w-full">
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-3 text-left font-medium">{REVT_LABELS.subtestHeader}</th>
                <th className="px-2 py-3 text-center font-medium">{REVT_LABELS.rawScoreHeader}</th>
                <th className="px-2 py-3 text-center font-medium">
                  {REVT_LABELS.correctItemsHeader}
                </th>
                <th className="px-2 py-3 text-center font-medium">
                  {REVT_LABELS.wrongItemsHeader}
                </th>
              </tr>
            </thead>
            <tbody>
              {/* 수용어휘 */}
              <tr className="border-b">
                <td className="px-2 py-3 font-medium">{REVT_LABELS.receptive}</td>
                <td className="px-2 py-3">
                  <div className="flex flex-col items-center">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={`${REVT_SCORE_RANGE.min}-${REVT_SCORE_RANGE.max}`}
                      className="w-20 text-center"
                      value={receptiveScore ?? ''}
                      onChange={(e) => handleScoreChange('receptive', e.target.value)}
                    />
                  </div>
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="text"
                    placeholder={REVT_ITEM_PLACEHOLDERS.correct}
                    className="w-full text-center text-sm"
                    value={revt?.inputs.receptive?.correctItems ?? ''}
                    onChange={(e) => handleItemsChange('receptive', 'correctItems', e.target.value)}
                  />
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="text"
                    placeholder={REVT_ITEM_PLACEHOLDERS.wrong}
                    className="w-full text-center text-sm"
                    value={revt?.inputs.receptive?.wrongItems ?? ''}
                    onChange={(e) => handleItemsChange('receptive', 'wrongItems', e.target.value)}
                  />
                </td>
              </tr>

              {/* 표현어휘 */}
              <tr className="border-b">
                <td className="px-2 py-3 font-medium">{REVT_LABELS.expressive}</td>
                <td className="px-2 py-3">
                  <div className="flex flex-col items-center">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder={`${REVT_SCORE_RANGE.min}-${REVT_SCORE_RANGE.max}`}
                      className="w-20 text-center"
                      value={expressiveScore ?? ''}
                      onChange={(e) => handleScoreChange('expressive', e.target.value)}
                    />
                  </div>
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="text"
                    placeholder={REVT_ITEM_PLACEHOLDERS.correct}
                    className="w-full text-center text-sm"
                    value={revt?.inputs.expressive?.correctItems ?? ''}
                    onChange={(e) =>
                      handleItemsChange('expressive', 'correctItems', e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-3">
                  <Input
                    type="text"
                    placeholder={REVT_ITEM_PLACEHOLDERS.wrong}
                    className="w-full text-center text-sm"
                    value={revt?.inputs.expressive?.wrongItems ?? ''}
                    onChange={(e) => handleItemsChange('expressive', 'wrongItems', e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 안내 문구 */}
        <div className="mt-4 space-y-1">
          {REVT_NOTES.map((note) => (
            <p key={note} className="text-muted-foreground text-xs">
              {note}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
