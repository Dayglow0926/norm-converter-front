/**
 * 아동 정보 타입 정의
 */

export type Gender = 'male' | 'female';

export interface ChildInfo {
  name: string;
  gender: Gender;
  birthDate: Date;
  testDate: Date;
}

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
}
