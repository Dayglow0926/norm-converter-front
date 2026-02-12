/**
 * 연령 계산 로직 테스트
 *
 * 이 파일은 월말/월초 경계 케이스를 검증합니다.
 * 실행: pnpm --dir norm-converter-front test (Vitest 설정 필요)
 *
 * 현재는 개발 중이므로 수동으로 콘솔에서 테스트할 수 있습니다.
 */

import { calculateAge, formatAgeResult } from './calculate-age';

// 테스트 유틸리티
function runTests() {
  console.log('=== 연령 계산 로직 테스트 ===\n');

  // 테스트 케이스 1: 기본 케이스
  const test1 = calculateAge(new Date(2020, 0, 15), new Date(2023, 6, 15));
  console.log('Test 1: 2020-01-15 → 2023-07-15');
  console.log(`  결과: ${formatAgeResult(test1)}`);
  console.log(`  기대: 3세 6개월 (총 42개월)`);
  console.log(`  검증: years=${test1.years}, months=${test1.months}, days=${test1.days}\n`);

  // 테스트 케이스 2: 월말/월초 경계 (1월 31일 → 2월 28일)
  const test2 = calculateAge(new Date(2020, 0, 31), new Date(2021, 1, 28));
  console.log('Test 2: 2020-01-31 → 2021-02-28 (월말 경계)');
  console.log(`  결과: ${formatAgeResult(test2)}`);
  console.log(`  기대: 1세 0개월 (총 12개월) 또는 1세 1개월 (총 13개월)`);
  console.log(`  검증: years=${test2.years}, months=${test2.months}, days=${test2.days}\n`);

  // 테스트 케이스 3: 생일 당일
  const test3 = calculateAge(new Date(2020, 5, 15), new Date(2023, 5, 15));
  console.log('Test 3: 2020-06-15 → 2023-06-15 (생일 당일)');
  console.log(`  결과: ${formatAgeResult(test3)}`);
  console.log(`  기대: 3세 0개월 (총 36개월)`);
  console.log(`  검증: years=${test3.years}, months=${test3.months}, days=${test3.days}\n`);

  // 테스트 케이스 4: 윤년 (2월 29일)
  const test4 = calculateAge(new Date(2020, 1, 29), new Date(2021, 1, 28));
  console.log('Test 4: 2020-02-29 → 2021-02-28 (윤년 경계)');
  console.log(`  결과: ${formatAgeResult(test4)}`);
  console.log(`  기대: 0세 11개월 또는 1세 0개월`);
  console.log(`  검증: years=${test4.years}, months=${test4.months}, days=${test4.days}\n`);

  // 테스트 케이스 5: 신생아 (같은 달)
  const test5 = calculateAge(new Date(2023, 6, 1), new Date(2023, 6, 20));
  console.log('Test 5: 2023-07-01 → 2023-07-20 (같은 달)');
  console.log(`  결과: ${formatAgeResult(test5)}`);
  console.log(`  기대: 0세 0개월 (총 1개월) - 15일 이상이므로 올림`);
  console.log(`  검증: years=${test5.years}, months=${test5.months}, days=${test5.days}\n`);

  // 테스트 케이스 6: 에러 케이스 (생년월일 > 평가일)
  console.log('Test 6: 2023-07-15 → 2020-01-15 (에러 케이스)');
  try {
    calculateAge(new Date(2023, 6, 15), new Date(2020, 0, 15));
    console.log('  실패: 에러가 발생해야 합니다.');
  } catch (e) {
    console.log(`  성공: ${(e as Error).message}\n`);
  }

  console.log('=== 테스트 완료 ===');
}

// 브라우저 콘솔이나 Node.js에서 실행 가능하도록 export
export { runTests };
