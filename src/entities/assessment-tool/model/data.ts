/**
 * 평가도구 메타데이터 정의
 * SELSI만 활성화, 나머지는 "준비 중" 상태
 */

import type { AssessmentToolId, ToolMetadata } from './types';
import { APAC_SUBTEST_KEYS } from './apac';
import { CPLC_SUBTEST_KEYS } from './cplc';
import { KCELF5_ORS_SUBTEST_KEYS } from './kcelf5-ors';
import { KCELF5_PP_SUBTEST_KEYS } from './kcelf5-pp';
import { KMB_CDI_LABELS } from './kmb-cdi';
import { PROBLEM_SOLVING_SUBTEST_KEYS } from './problem-solving';
import { PRES_SUBTEST_KEYS } from './pres';
import { REVT_SUBTEST_KEYS } from './revt';
import { SELSI_META_SUBTEST_KEYS } from './selsi';
import { SYNTAX_SUBTEST_KEYS } from './syntax';

export const TOOL_METADATA: Record<AssessmentToolId, ToolMetadata> = {
  selsi: {
    id: 'selsi',
    name: 'SELSI',
    category: '영유아',
    minAgeMonths: 4,
    maxAgeMonths: 35,
    subtests: SELSI_META_SUBTEST_KEYS,
    description: '영유아 언어발달 검사 (4-35개월)',
  },
  kmb_cdi: {
    id: 'kmb_cdi',
    name: KMB_CDI_LABELS.name,
    category: '영유아',
    minAgeMonths: 18,
    maxAgeMonths: 36,
    subtests: [],
    description: '유아용 어휘/문장과 문법 체크리스트 (18-36개월)',
  },
  pres: {
    id: 'pres',
    name: 'PRES',
    category: '학령전기',
    minAgeMonths: 24,
    maxAgeMonths: 71,
    subtests: PRES_SUBTEST_KEYS,
    description: '취학전 아동 수용·표현 언어척도 (2-5세)',
  },
  revt: {
    id: 'revt',
    name: 'REVT',
    category: '학령전기',
    minAgeMonths: 24,
    maxAgeMonths: 215,
    subtests: REVT_SUBTEST_KEYS,
    description: '수용·표현 어휘력 검사 (2-16세)',
  },
  syntax: {
    id: 'syntax',
    name: '구문의미이해력',
    category: '학령전기',
    minAgeMonths: 48,
    maxAgeMonths: 119,
    subtests: SYNTAX_SUBTEST_KEYS,
    description: '구문의미이해력 검사 (4-9세)',
  },
  problem_solving: {
    id: 'problem_solving',
    name: '언어문제해결력',
    category: '학령전기',
    minAgeMonths: 60,
    maxAgeMonths: 143,
    subtests: PROBLEM_SOLVING_SUBTEST_KEYS,
    description: '언어문제해결력 검사 (5-11세)',
  },
  apac: {
    id: 'apac',
    name: 'APAC',
    category: '학령전기',
    minAgeMonths: 30,
    maxAgeMonths: 215,
    subtests: APAC_SUBTEST_KEYS,
    description: '아동용 발음 검사 (30개월 이상)',
  },
  cplc: {
    id: 'cplc',
    name: 'CPLC',
    category: '학령전기',
    minAgeMonths: 60,
    maxAgeMonths: 143,
    subtests: CPLC_SUBTEST_KEYS,
    description: '아동 화용언어 체크리스트 (5-11세)',
  },
  kcelf5_pp: {
    id: 'kcelf5_pp',
    name: 'K-CELF-5 PP',
    category: '전 연령',
    minAgeMonths: 0,
    maxAgeMonths: 9999,
    subtests: KCELF5_PP_SUBTEST_KEYS,
    description: '화용프로파일 (보호자 보고)',
  },
  kcelf5_ors: {
    id: 'kcelf5_ors',
    name: 'K-CELF-5 ORS',
    category: '전 연령',
    minAgeMonths: 0,
    maxAgeMonths: 9999,
    subtests: KCELF5_ORS_SUBTEST_KEYS,
    description: '관찰 평가척도',
  },
  language_analysis: {
    id: 'language_analysis',
    name: '언어분석',
    category: '전 연령',
    minAgeMonths: 0,
    maxAgeMonths: 9999,
    subtests: [],
    description: '행동관찰 / 자발화 / 대화분석',
  },
};

/**
 * 현재 활성화된 평가도구 ID 목록
 */
export const ACTIVE_TOOLS: AssessmentToolId[] = ['selsi', 'kmb_cdi', 'pres', 'revt', 'syntax', 'problem_solving', 'apac', 'cplc', 'kcelf5_pp', 'kcelf5_ors', 'language_analysis'];

/**
 * 전체 평가도구 ID 목록 (표시 순서)
 */
export const ALL_TOOL_IDS: AssessmentToolId[] = [
  'selsi',
  'kmb_cdi',
  'pres',
  'revt',
  'syntax',
  'problem_solving',
  'apac',
  'cplc',
  'kcelf5_pp',
  'kcelf5_ors',
  'language_analysis',
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
 * 평가도구 비활성화 사유 반환 (준비 중인 도구만 차단)
 */
export function getDisabledReason(
  toolId: AssessmentToolId,
  _ageMonths: number | null
): string | null {
  if (!isToolActive(toolId)) {
    return '준비 중';
  }
  return null;
}

/**
 * 연령 범위 벗어남 안내 텍스트 반환 (선택 차단 없음, 표시만)
 */
export function getAgeWarning(
  toolId: AssessmentToolId,
  ageMonths: number | null
): string | null {
  if (ageMonths === null) return null;
  const meta = TOOL_METADATA[toolId];
  if (meta.maxAgeMonths >= 9999) return null;
  if (ageMonths < meta.minAgeMonths) {
    return `${meta.minAgeMonths}개월 이상 적용 가능`;
  }
  if (ageMonths > meta.maxAgeMonths) {
    return `${meta.maxAgeMonths}개월 이하 적용 가능`;
  }
  return null;
}
