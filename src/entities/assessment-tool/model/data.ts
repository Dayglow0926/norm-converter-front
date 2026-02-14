/**
 * 평가도구 메타데이터 정의
 * SELSI만 활성화, 나머지는 "준비 중" 상태
 */

import type { AssessmentToolId, ToolMetadata } from './types';

export const TOOL_METADATA: Record<AssessmentToolId, ToolMetadata> = {
  selsi: {
    id: 'selsi',
    name: 'SELSI',
    category: '영유아',
    minAgeMonths: 4,
    maxAgeMonths: 35,
    subtests: ['receptive', 'expressive', 'combined'],
    description: '영유아 언어발달 검사 (4-35개월)',
  },
  pres: {
    id: 'pres',
    name: 'PRES',
    category: '학령전기',
    minAgeMonths: 24,
    maxAgeMonths: 71,
    subtests: ['receptive', 'expressive'],
    description: '취학전 아동 수용·표현 언어척도 (2-5세)',
  },
  revt: {
    id: 'revt',
    name: 'REVT',
    category: '학령전기',
    minAgeMonths: 24,
    maxAgeMonths: 215,
    subtests: ['receptive', 'expressive'],
    description: '수용·표현 어휘력 검사 (2-16세)',
  },
  syntax: {
    id: 'syntax',
    name: '구문의미이해력',
    category: '학령전기',
    minAgeMonths: 48,
    maxAgeMonths: 107,
    subtests: [],
    description: '구문의미이해력 검사 (4-8세)',
  },
  problem_solving: {
    id: 'problem_solving',
    name: '언어문제해결력',
    category: '학령전기',
    minAgeMonths: 60,
    maxAgeMonths: 143,
    subtests: ['cause_reason', 'clue_guessing', 'solution_inference'],
    description: '언어문제해결력 검사 (5-11세)',
  },
  apac: {
    id: 'apac',
    name: 'APAC',
    category: '학령전기',
    minAgeMonths: 36,
    maxAgeMonths: 215,
    subtests: [],
    description: '아동용 발음 검사 (3-16세)',
  },
  cplc: {
    id: 'cplc',
    name: 'CPLC',
    category: '학령전기',
    minAgeMonths: 60,
    maxAgeMonths: 143,
    subtests: ['discourse', 'context', 'nonverbal', 'supralinguistic'],
    description: '아동 화용언어 체크리스트 (5-11세)',
  },
};

/**
 * 현재 활성화된 평가도구 ID 목록
 */
export const ACTIVE_TOOLS: AssessmentToolId[] = ['selsi'];

/**
 * 전체 평가도구 ID 목록 (표시 순서)
 */
export const ALL_TOOL_IDS: AssessmentToolId[] = [
  'selsi',
  'pres',
  'revt',
  'syntax',
  'problem_solving',
  'apac',
  'cplc',
];

/**
 * 평가도구가 활성화되었는지 확인
 */
export function isToolActive(toolId: AssessmentToolId): boolean {
  return ACTIVE_TOOLS.includes(toolId);
}

/**
 * 아동 연령이 평가도구 범위 내인지 확인
 */
export function isAgeInRange(toolId: AssessmentToolId, ageMonths: number): boolean {
  const meta = TOOL_METADATA[toolId];
  return ageMonths >= meta.minAgeMonths && ageMonths <= meta.maxAgeMonths;
}

/**
 * 평가도구 비활성화 사유 반환
 */
export function getDisabledReason(
  toolId: AssessmentToolId,
  ageMonths: number | null
): string | null {
  const meta = TOOL_METADATA[toolId];

  // 연령이 범위 밖인 경우
  if (ageMonths !== null) {
    if (ageMonths < meta.minAgeMonths) {
      return `${meta.minAgeMonths}개월 이상 적용 가능`;
    }
    if (ageMonths > meta.maxAgeMonths) {
      return `${meta.maxAgeMonths}개월 이하 적용 가능`;
    }
  }

  // 아직 구현되지 않은 도구
  if (!isToolActive(toolId)) {
    return '준비 중';
  }

  return null;
}
