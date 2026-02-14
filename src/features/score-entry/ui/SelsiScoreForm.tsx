'use client';

/**
 * SELSI 점수 입력 폼 컴포넌트
 * 수용/표현 원점수 입력 → 실시간 등가연령 변환
 */

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useScoreEntryStore } from '../model/store';
import { normClient } from '@/shared/api/norm-client';
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

interface ConvertApiResponse {
  equivalentAge: number;
}

/**
 * 등가연령을 표시 형식으로 변환 (개월 → "N개월" 또는 "N세 N개월")
 */
function formatEquivalentAge(months: number | null): string {
  if (months === null) return '-';
  if (months < 12) return `${months}개월`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years}세`;
  return `${years}세 ${remainingMonths}개월`;
}

export function SelsiScoreForm({ ageMonths, gender }: SelsiScoreFormProps) {
  const { selsiScores, selsiResults, loading, error, setSelsiScore, setSelsiResults, setLoading, setError } =
    useScoreEntryStore();

  // 입력값 유효성 에러
  const [inputErrors, setInputErrors] = useState<{
    receptive?: string;
    expressive?: string;
  }>({});

  // 개별 점수 변환 함수
  const convertScore = useCallback(
    async (subtest: 'receptive' | 'expressive', rawScore: number) => {
      try {
        const response = await normClient.convert<ConvertApiResponse>('selsi', {
          subtest,
          rawScore,
          ageMonths,
          gender,
        });
        return response.equivalentAge;
      } catch (err) {
        console.error(`SELSI ${subtest} 변환 실패:`, err);
        return null;
      }
    },
    [ageMonths, gender]
  );

  // 통합 점수 변환 함수
  const convertCombined = useCallback(
    async (receptiveScore: number, expressiveScore: number) => {
      try {
        const combinedRawScore = receptiveScore + expressiveScore;
        const response = await normClient.convert<ConvertApiResponse>('selsi', {
          subtest: 'combined',
          rawScore: combinedRawScore,
          ageMonths,
          gender,
        });
        return response.equivalentAge;
      } catch (err) {
        console.error('SELSI combined 변환 실패:', err);
        return null;
      }
    },
    [ageMonths, gender]
  );

  // 점수 변경 시 API 호출 (디바운스 적용)
  useEffect(() => {
    const { receptive, expressive } = selsiScores;
    
    // 둘 다 null이면 리턴
    if (receptive === null && expressive === null) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const newResults = {
          receptive: null as number | null,
          expressive: null as number | null,
          combined: null as number | null,
        };

        // 수용언어 변환
        if (receptive !== null) {
          newResults.receptive = await convertScore('receptive', receptive);
        }

        // 표현언어 변환
        if (expressive !== null) {
          newResults.expressive = await convertScore('expressive', expressive);
        }

        // 통합 변환 (둘 다 있을 때만)
        if (receptive !== null && expressive !== null) {
          newResults.combined = await convertCombined(receptive, expressive);
        }

        setSelsiResults(newResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : '변환 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timer);
  }, [selsiScores, convertScore, convertCombined, setLoading, setError, setSelsiResults]);

  // 입력 핸들러
  const handleScoreChange = (
    subtest: 'receptive' | 'expressive',
    value: string
  ) => {
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>SELSI 점수 입력</span>
          {loading && (
            <span className="text-sm font-normal text-muted-foreground animate-pulse">
              변환 중...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* 점수 입력 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">하위검사</th>
                <th className="text-center py-3 px-2 font-medium">원점수</th>
                <th className="text-center py-3 px-2 font-medium">등가연령</th>
              </tr>
            </thead>
            <tbody>
              {/* 수용언어 */}
              <tr className="border-b">
                <td className="py-3 px-2 font-medium">{SUBTEST_LABELS.receptive}</td>
                <td className="py-3 px-2">
                  <div className="flex flex-col items-center">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0-54"
                      className={`w-24 text-center ${inputErrors.receptive ? 'border-destructive' : ''}`}
                      value={selsiScores.receptive ?? ''}
                      onChange={(e) => handleScoreChange('receptive', e.target.value)}
                      aria-invalid={!!inputErrors.receptive}
                    />
                    {inputErrors.receptive && (
                      <span className="text-xs text-destructive mt-1">
                        {inputErrors.receptive}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-center font-semibold">
                  {loading && selsiScores.receptive !== null ? (
                    <span className="text-muted-foreground">...</span>
                  ) : (
                    formatEquivalentAge(selsiResults.receptive)
                  )}
                </td>
              </tr>

              {/* 표현언어 */}
              <tr className="border-b">
                <td className="py-3 px-2 font-medium">{SUBTEST_LABELS.expressive}</td>
                <td className="py-3 px-2">
                  <div className="flex flex-col items-center">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0-54"
                      className={`w-24 text-center ${inputErrors.expressive ? 'border-destructive' : ''}`}
                      value={selsiScores.expressive ?? ''}
                      onChange={(e) => handleScoreChange('expressive', e.target.value)}
                      aria-invalid={!!inputErrors.expressive}
                    />
                    {inputErrors.expressive && (
                      <span className="text-xs text-destructive mt-1">
                        {inputErrors.expressive}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-center font-semibold">
                  {loading && selsiScores.expressive !== null ? (
                    <span className="text-muted-foreground">...</span>
                  ) : (
                    formatEquivalentAge(selsiResults.expressive)
                  )}
                </td>
              </tr>

              {/* 통합 (자동 계산) */}
              <tr className="bg-muted/30">
                <td className="py-3 px-2 font-medium">통합</td>
                <td className="py-3 px-2 text-center text-muted-foreground">
                  {selsiScores.receptive !== null && selsiScores.expressive !== null
                    ? selsiScores.receptive + selsiScores.expressive
                    : '-'}
                </td>
                <td className="py-3 px-2 text-center font-semibold">
                  {loading && selsiScores.receptive !== null && selsiScores.expressive !== null ? (
                    <span className="text-muted-foreground">...</span>
                  ) : (
                    formatEquivalentAge(selsiResults.combined)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 안내 문구 */}
        <p className="mt-4 text-xs text-muted-foreground">
          * 원점수 범위: 수용/표현 각 0-54점, 통합 0-108점
        </p>
      </CardContent>
    </Card>
  );
}
