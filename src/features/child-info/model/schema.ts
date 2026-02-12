/**
 * 아동 정보 입력 폼 Zod 스키마
 */

import { z } from 'zod';

export const childInfoSchema = z
  .object({
    name: z
      .string()
      .min(1, '이름을 입력해주세요.')
      .max(20, '이름은 20자 이내로 입력해주세요.'),
    gender: z.enum(['male', 'female'], '성별을 선택해주세요.'),
    birthDate: z.date('생년월일을 선택해주세요.'),
    testDate: z.date('평가일을 선택해주세요.'),
  })
  .refine((data) => data.birthDate <= data.testDate, {
    message: '생년월일은 평가일보다 이전이어야 합니다.',
    path: ['birthDate'],
  });

export type ChildInfoFormData = z.infer<typeof childInfoSchema>;
