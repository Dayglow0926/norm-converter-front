/**
 * 연령 계산 유틸리티
 * 생년월일과 평가일을 받아 정확한 생활연령을 계산합니다.
 *
 * 월말/월초 경계 케이스 처리:
 * - 예: 1월 31일 출생 → 2월 28일 평가 시 정확한 개월수 계산
 * - 타임존: KST 기준 (Date 객체 생성 시 로컬 타임존 사용)
 */

import type { AgeResult } from '@/entities/child';

/**
 * 생년월일과 평가일을 받아 연령을 계산합니다.
 *
 * @param birthDate - 생년월일
 * @param testDate - 평가일
 * @returns AgeResult - { years, months, days, totalMonths }
 * @throws Error - 생년월일이 평가일보다 미래인 경우
 */
export function calculateAge(birthDate: Date, testDate: Date): AgeResult {
  // 날짜 정규화 (시간 부분 제거)
  const birth = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  const test = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());

  // 생년월일이 평가일보다 미래인 경우 에러
  if (birth > test) {
    throw new Error('생년월일은 평가일보다 이전이어야 합니다.');
  }

  let years = test.getFullYear() - birth.getFullYear();
  let months = test.getMonth() - birth.getMonth();
  let days = test.getDate() - birth.getDate();

  // 일수가 음수인 경우, 이전 달의 마지막 날짜를 사용하여 조정
  if (days < 0) {
    months -= 1;
    // 평가일 기준 이전 달의 마지막 날짜
    const lastDayOfPrevMonth = new Date(test.getFullYear(), test.getMonth(), 0).getDate();
    days += lastDayOfPrevMonth;
  }

  // 월수가 음수인 경우, 연도를 조정
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // 총 개월수 계산 (15일 이상이면 올림)
  const totalMonths = years * 12 + months + (days >= 15 ? 1 : 0);

  return {
    years,
    months,
    days,
    totalMonths,
  };
}

/**
 * 연령 결과를 한국어 문자열로 포맷합니다.
 *
 * @param ageResult - 연령 계산 결과
 * @returns 포맷된 문자열 (예: "3세 6개월 (총 42개월)")
 */
export function formatAgeResult(ageResult: AgeResult): string {
  const { years, months, totalMonths } = ageResult;
  return `${years}세 ${months}개월 (총 ${totalMonths}개월)`;
}
