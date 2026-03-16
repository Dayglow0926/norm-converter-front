'use client';

/**
 * 아동 정보 입력 폼 컴포넌트
 *
 * 이름, 성별, 생년월일, 평가일을 입력받고
 * 생활연령(N세 N개월, 총 N개월)을 자동 계산하여 표시합니다.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useChildInfoStore } from '../model/store';
import { childInfoSchema, type ChildInfoFormData } from '../model/schema';
import { formatAgeResult } from '../lib/calculate-age';

/**
 * 6자리 숫자(YYMMDD)를 Date 객체로 파싱
 * 연도는 2000년대로 가정 (예: 19 → 2019)
 */
function parseYYMMDD(str: string): Date | undefined {
  if (!str) return undefined;
  const clean = str.replace(/\D/g, '');
  if (clean.length !== 6) return undefined;

  const y = 2000 + +clean.slice(0, 2);
  const m = +clean.slice(2, 4);
  const d = +clean.slice(4, 6);

  const date = new Date(y, m - 1, d);
  // 유효한 날짜인지 검증
  if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
    return date;
  }
  return undefined;
}

/**
 * Date 객체를 YYMMDD 형식 문자열로 변환
 */
function formatToYYMMDD(date: Date | undefined): string {
  if (!date) return '';
  const yy = String(date.getFullYear() % 100).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${yy}${m}${d}`;
}

/**
 * 성별 선택 버튼 컴포넌트
 */
function GenderButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[52px] flex-1 rounded-lg border-2 px-6 py-3 text-lg font-medium transition-all ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background hover:bg-muted border-input hover:border-primary/50'
      } `}
    >
      {children}
    </button>
  );
}

export function ChildInfoForm() {
  const router = useRouter();
  const { setChildInfo, ageResult, childInfo } = useChildInfoStore();

  // 6자리 숫자 입력 상태 (YYMMDD)
  const [birthDateStr, setBirthDateStr] = useState(() => formatToYYMMDD(childInfo?.birthDate));
  const [testDateStr, setTestDateStr] = useState(() =>
    formatToYYMMDD(childInfo?.testDate ?? new Date())
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isValid },
  } = useForm<ChildInfoFormData>({
    resolver: zodResolver(childInfoSchema),
    defaultValues: {
      name: childInfo?.name ?? '',
      gender: childInfo?.gender,
      birthDate: childInfo?.birthDate,
      testDate: childInfo?.testDate ?? new Date(),
    },
    mode: 'onChange',
  });

  const handleBirthDateChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setBirthDateStr(cleaned);
    const date = parseYYMMDD(cleaned);
    setValue('birthDate', date as Date, { shouldValidate: true });
  };

  const handleTestDateChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setTestDateStr(cleaned);
    const date = parseYYMMDD(cleaned);
    setValue('testDate', date as Date, { shouldValidate: true });
  };

  const onSubmit = (data: ChildInfoFormData) => {
    setChildInfo({
      name: data.name,
      gender: data.gender,
      birthDate: data.birthDate,
      testDate: data.testDate,
    });
  };

  const handleNext = () => {
    router.push('/select-tool');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">아동 정보 입력</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              type="text"
              placeholder="김○○"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>

          {/* 성별 */}
          <div className="space-y-2">
            <Label>성별 *</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <div className="flex gap-3">
                  <GenderButton
                    selected={field.value === 'male'}
                    onClick={() => field.onChange('male')}
                  >
                    남
                  </GenderButton>
                  <GenderButton
                    selected={field.value === 'female'}
                    onClick={() => field.onChange('female')}
                  >
                    여
                  </GenderButton>
                </div>
              )}
            />
            {errors.gender && <p className="text-destructive text-sm">{errors.gender.message}</p>}
          </div>

          {/* 생년월일 */}
          <div className="space-y-2">
            <Label htmlFor="birthDate">생년월일 *</Label>
            <Input
              id="birthDate"
              type="text"
              inputMode="numeric"
              placeholder="YYMMDD (예: 200115)"
              maxLength={6}
              value={birthDateStr}
              onChange={(e) => handleBirthDateChange(e.target.value)}
              aria-invalid={!!errors.birthDate}
            />
            {errors.birthDate && (
              <p className="text-destructive text-sm">{errors.birthDate.message}</p>
            )}
          </div>

          {/* 평가일 */}
          <div className="space-y-2">
            <Label htmlFor="testDate">평가일 *</Label>
            <Input
              id="testDate"
              type="text"
              inputMode="numeric"
              placeholder="YYMMDD (예: 260212)"
              maxLength={6}
              value={testDateStr}
              onChange={(e) => handleTestDateChange(e.target.value)}
              aria-invalid={!!errors.testDate}
            />
            {errors.testDate && (
              <p className="text-destructive text-sm">{errors.testDate.message}</p>
            )}
          </div>

          {/* 계산 버튼 */}
          <Button type="submit" className="w-full" disabled={!isValid}>
            연령 계산
          </Button>

          {/* 연령 계산 결과 */}
          {ageResult && (
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-muted-foreground mb-1 text-sm">생활연령</p>
              <p className="text-lg font-semibold">{formatAgeResult(ageResult)}</p>
            </div>
          )}
        </form>

        {/* 다음 버튼 (연령 계산 완료 시 표시) */}
        {ageResult && (
          <Button type="button" className="mt-4 w-full" onClick={handleNext}>
            평가도구 선택 →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
