'use client';

/**
 * K-CELF-5 PP (화용프로파일) 점수 입력 폼
 * 3개 영역 원점수 → 영역별 백분율 (규준 변환 아님)
 */

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useScoreEntryStore } from '../model/store';

type PpSubtest = 'conversation_skills' | 'information_group' | 'nonverbal_skills';

interface PpSubtestMeta {
  key: PpSubtest;
  label: string;
  maxScore: number;
}

const PP_SUBTESTS: PpSubtestMeta[] = [
  { key: 'conversation_skills', label: '대화기술', maxScore: 72 },
  { key: 'information_group', label: '정보요청,정보제공,정보에 응하기', maxScore: 80 },
  { key: 'nonverbal_skills', label: '비언어적 대화기술', maxScore: 48 },
];

const PP_TOTAL_MAX = 200;

export function Kcelf5PpScoreForm() {
  const pp = useScoreEntryStore((state) => state.tools.kcelf5_pp);
  const setScore = useScoreEntryStore((state) => state.setScore);

  const handleScoreChange = (subtest: PpSubtest, maxScore: number, value: string) => {
    if (value === '') {
      setScore('kcelf5_pp', subtest, null);
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > maxScore) {
      setScore('kcelf5_pp', subtest, null);
      return;
    }
    setScore('kcelf5_pp', subtest, num);
  };

  // 총점 자동 합산
  const scores = PP_SUBTESTS.map((s) => pp?.inputs[s.key]?.rawScore ?? null);
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
              {PP_SUBTESTS.map(({ key, label, maxScore }) => {
                const currentScore = pp?.inputs[key]?.rawScore ?? null;
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
                <td className="text-muted-foreground px-2 py-3 text-center">{PP_TOTAL_MAX}점</td>
                <td className="text-muted-foreground px-2 py-3 text-center font-semibold">
                  {totalScore ?? '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-muted-foreground text-xs">
            * 일부 또는 미입력 상태로도 결과 확인 가능 (미입력은 0점 처리)
          </p>
          <p className="text-muted-foreground text-xs">
            * 보호자 보고 기반 화용 평가 (규준 변환 아님, 백분율 산출)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
