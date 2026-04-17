'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  KMB_CDI_GRAMMAR_FEATURES,
  KMB_CDI_LABELS,
  KMB_CDI_VOCAB_CATEGORIES,
  KMB_CDI_VOCAB_TOTALS,
  type KmbCdiGrammarFeatureStatus,
} from '@/entities/assessment-tool';
import {
  calculateKmbCdiTotals,
  getKmbCdiGrammarAgeText,
} from '../lib/kmb-cdi-preview';
import { useKmbCdiStore } from '../model/kmbCdiStore';

interface KmbCdiScoreFormProps {
  gender: 'male' | 'female';
}

type InputErrorMap = Partial<Record<string, string>>;

const FEATURE_STATUS_OPTIONS: Array<{
  label: string;
  value: KmbCdiGrammarFeatureStatus;
}> = [
  { label: '사용함', value: 'used' },
  { label: '사용안함', value: 'not_used' },
  { label: '빈칸', value: null },
];

function getFeatureButtonClass(
  selected: boolean,
  value: KmbCdiGrammarFeatureStatus
): string {
  if (!selected) return 'border-border text-muted-foreground';
  if (value === 'used') return 'border-emerald-500 bg-emerald-50 text-emerald-700';
  if (value === 'not_used') return 'border-slate-500 bg-slate-100 text-slate-700';
  return 'border-amber-500 bg-amber-50 text-amber-700';
}

export function KmbCdiScoreForm({ gender }: KmbCdiScoreFormProps) {
  const {
    vocabulary,
    grammarRawScore,
    grammarFeatures,
    longestUtterance,
    _hasHydrated,
    setVocabularyScore,
    setGrammarRawScore,
    setGrammarFeatureStatus,
    setLongestUtterance,
  } = useKmbCdiStore();

  const [inputErrors, setInputErrors] = useState<InputErrorMap>({});

  const { expressiveTotal, receptiveTotal } = calculateKmbCdiTotals(vocabulary);
  const errorCount = Object.keys(inputErrors).length;
  void gender;
  const grammarAgeText = grammarRawScore !== null ? getKmbCdiGrammarAgeText(grammarRawScore) : null;

  const handleVocabularyChange = (
    categoryKey: (typeof KMB_CDI_VOCAB_CATEGORIES)[number]['key'],
    field: 'expressive' | 'receptive',
    max: number,
    rawValue: string
  ) => {
    const errorKey = `${categoryKey}-${field}`;

    if (rawValue === '') {
      setVocabularyScore(categoryKey, field, null);
      setInputErrors((state) => {
        const next = { ...state };
        delete next[errorKey];
        return next;
      });
      return;
    }

    const value = Number(rawValue);

    if (!Number.isInteger(value) || value < 0) {
      setInputErrors((state) => ({
        ...state,
        [errorKey]: '0 이상의 정수만 입력 가능',
      }));
      return;
    }

    if (value > max) {
      setInputErrors((state) => ({
        ...state,
        [errorKey]: `${max} 이하만 입력 가능`,
      }));
      return;
    }

    setVocabularyScore(categoryKey, field, value);
    setInputErrors((state) => {
      const next = { ...state };
      delete next[errorKey];
      return next;
    });
  };

  const handleGrammarRawScoreChange = (rawValue: string) => {
    if (rawValue === '') {
      setGrammarRawScore(null);
      setInputErrors((state) => {
        const next = { ...state };
        delete next.grammarRawScore;
        return next;
      });
      return;
    }

    const value = Number(rawValue);

    if (!Number.isInteger(value) || value < 0) {
      setInputErrors((state) => ({
        ...state,
        grammarRawScore: '0 이상의 정수만 입력 가능',
      }));
      return;
    }

    setGrammarRawScore(value);
    setInputErrors((state) => {
      const next = { ...state };
      delete next.grammarRawScore;
      return next;
    });
  };

  if (!_hasHydrated) {
    return (
      <Card className="w-full">
        <CardContent>
          <p className="text-muted-foreground text-sm">K M-B CDI 입력값을 불러오는 중입니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardContent className="space-y-4">
          {errorCount > 0 && (
            <p className="text-destructive text-xs">
              입력 범위를 벗어난 칸이 {errorCount}개 있습니다. 빨간 테두리 칸을 확인하세요.
            </p>
          )}

          <div className="space-y-3">
            <div className="hidden rounded-lg border bg-muted/40 px-4 py-2 text-sm font-medium text-slate-600 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div>범주</div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <span>표현</span>
                <span>수용</span>
              </div>
            </div>

            {KMB_CDI_VOCAB_CATEGORIES.map((category) => {
              const current = vocabulary[category.key];
              const expressiveError = inputErrors[`${category.key}-expressive`];
              const receptiveError = inputErrors[`${category.key}-receptive`];

              return (
                <div
                  key={category.key}
                  className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="bg-muted text-muted-foreground flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-xs font-semibold">
                      {category.id}
                    </div>
                    <p className="min-w-0 pt-1 text-sm font-medium break-keep">{category.label}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md border bg-slate-50/70 p-3">
                      <p className="mb-2 text-center text-xs font-medium text-slate-500">표현</p>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={`0-${category.expressiveMax}`}
                        className={`text-center ${expressiveError ? 'border-destructive' : ''}`}
                        value={current.expressive ?? ''}
                        onChange={(e) =>
                          handleVocabularyChange(
                            category.key,
                            'expressive',
                            category.expressiveMax,
                            e.target.value
                          )
                        }
                        aria-invalid={!!expressiveError}
                      />
                    </div>

                    <div className="rounded-md border bg-slate-50/70 p-3">
                      <p className="mb-2 text-center text-xs font-medium text-slate-500">수용</p>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder={`0-${category.receptiveMax}`}
                        className={`text-center ${receptiveError ? 'border-destructive' : ''}`}
                        value={current.receptive ?? ''}
                        onChange={(e) =>
                          handleVocabularyChange(
                            category.key,
                            'receptive',
                            category.receptiveMax,
                            e.target.value
                          )
                        }
                        aria-invalid={!!receptiveError}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
              <div className="rounded-md border bg-white/80 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">표현 총점</p>
                <p className="mt-1 text-lg font-semibold">
                  {expressiveTotal}/{KMB_CDI_VOCAB_TOTALS.expressiveMax}
                </p>
              </div>
              <div className="rounded-md border bg-white/80 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">수용 총점</p>
                <p className="mt-1 text-lg font-semibold">
                  {receptiveTotal}/{KMB_CDI_VOCAB_TOTALS.receptiveMax}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full pt-0">
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <div className="space-y-1">
              <p className="font-medium">문장과 문법 원점수</p>
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="원점수 입력"
                className={`w-full text-center ${inputErrors.grammarRawScore ? 'border-destructive' : ''}`}
                value={grammarRawScore ?? ''}
                onChange={(e) => handleGrammarRawScoreChange(e.target.value)}
                aria-invalid={!!inputErrors.grammarRawScore}
              />
              {inputErrors.grammarRawScore && (
                <p className="text-destructive text-xs">{inputErrors.grammarRawScore}</p>
              )}
              {grammarAgeText && <p className="text-muted-foreground text-xs">{grammarAgeText}</p>}
            </div>
          </div>

          <div className="space-y-3">
            {KMB_CDI_GRAMMAR_FEATURES.map((feature) => {
              const current = grammarFeatures[feature.key];

              return (
                <div
                  key={feature.key}
                  className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{feature.label}</p>
                    <p className="text-muted-foreground text-xs">{feature.usedText}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {FEATURE_STATUS_OPTIONS.map((option) => (
                      <Button
                        key={`${feature.key}-${option.label}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`w-full ${getFeatureButtonClass(current === option.value, option.value)}`}
                        onClick={() => setGrammarFeatureStatus(feature.key, option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="space-y-3">
          <h4 className="text-base font-semibold">{KMB_CDI_LABELS.longestUtteranceTitle}</h4>
          <Textarea
            placeholder="예: 어린이집에서 윤찬이 자동차 뺏어서 혼났어..."
            value={longestUtterance}
            onChange={(e) => setLongestUtterance(e.target.value)}
            className="min-h-28 resize-y"
          />
        </CardContent>
      </Card>
    </div>
  );
}
