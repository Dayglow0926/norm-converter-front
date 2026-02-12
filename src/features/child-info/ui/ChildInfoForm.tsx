'use client';

/**
 * 아동 정보 입력 폼 컴포넌트
 *
 * 이름, 성별, 생년월일, 평가일을 입력받고
 * 생활연령(N세 N개월, 총 N개월)을 자동 계산하여 표시합니다.
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useChildInfoStore } from '../model/store';
import { childInfoSchema, type ChildInfoFormData } from '../model/schema';
import { formatAgeResult } from '../lib/calculate-age';

/**
 * 날짜를 YYYY-MM-DD 형식 문자열로 변환
 */
function formatDateForInput(date: Date | undefined): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * YYYY-MM-DD 문자열을 Date 객체로 변환
 */
function parseDateFromInput(dateString: string): Date | undefined {
  if (!dateString) return undefined;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function ChildInfoForm() {
  const { setChildInfo, ageResult, childInfo } = useChildInfoStore();

  const {
    register,
    handleSubmit,
    control,
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

  const onSubmit = (data: ChildInfoFormData) => {
    setChildInfo({
      name: data.name,
      gender: data.gender,
      birthDate: data.birthDate,
      testDate: data.testDate,
    });
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
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* 성별 */}
          <div className="space-y-2">
            <Label>성별 *</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="font-normal cursor-pointer">
                      남
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="font-normal cursor-pointer">
                      여
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
            {errors.gender && (
              <p className="text-sm text-destructive">{errors.gender.message}</p>
            )}
          </div>

          {/* 생년월일 */}
          <div className="space-y-2">
            <Label htmlFor="birthDate">생년월일 *</Label>
            <Controller
              name="birthDate"
              control={control}
              render={({ field }) => (
                <Input
                  id="birthDate"
                  type="date"
                  value={formatDateForInput(field.value)}
                  onChange={(e) => {
                    const date = parseDateFromInput(e.target.value);
                    field.onChange(date);
                  }}
                  aria-invalid={!!errors.birthDate}
                  className="block"
                />
              )}
            />
            {errors.birthDate && (
              <p className="text-sm text-destructive">{errors.birthDate.message}</p>
            )}
          </div>

          {/* 평가일 */}
          <div className="space-y-2">
            <Label htmlFor="testDate">평가일 *</Label>
            <Controller
              name="testDate"
              control={control}
              render={({ field }) => (
                <Input
                  id="testDate"
                  type="date"
                  value={formatDateForInput(field.value)}
                  onChange={(e) => {
                    const date = parseDateFromInput(e.target.value);
                    field.onChange(date);
                  }}
                  aria-invalid={!!errors.testDate}
                  className="block"
                />
              )}
            />
            {errors.testDate && (
              <p className="text-sm text-destructive">{errors.testDate.message}</p>
            )}
          </div>

          {/* 계산 버튼 */}
          <Button type="submit" className="w-full" disabled={!isValid}>
            연령 계산
          </Button>

          {/* 연령 계산 결과 */}
          {ageResult && (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">생활연령</p>
              <p className="text-lg font-semibold">{formatAgeResult(ageResult)}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
