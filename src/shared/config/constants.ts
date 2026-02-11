import type { ToolMetadata } from '@/entities/assessment-tool';

/**
 * API 기본 URL
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * 평가도구 메타데이터
 */
export const ASSESSMENT_TOOLS: ToolMetadata[] = [
  {
    id: 'selsi',
    name: 'SELSI',
    category: '영유아',
    minAgeMonths: 4,
    maxAgeMonths: 35,
    subtests: ['수용언어', '표현언어'],
    description: '영유아 언어발달검사',
  },
  {
    id: 'pres',
    name: 'PRES',
    category: '학령전기',
    minAgeMonths: 24,
    maxAgeMonths: 71,
    subtests: ['수용언어', '표현언어'],
    description: '취학전 아동의 수용언어 및 표현언어 발달척도',
  },
  {
    id: 'revt',
    name: 'REVT',
    category: '학령전기',
    minAgeMonths: 24,
    maxAgeMonths: 215,
    subtests: ['수용어휘', '표현어휘'],
    description: '수용·표현 어휘력 검사',
  },
  {
    id: 'syntax',
    name: '구문의미이해력',
    category: '학령전기',
    minAgeMonths: 48,
    maxAgeMonths: 107,
    subtests: [],
    description: '구문의미이해력검사',
  },
  {
    id: 'problem_solving',
    name: '언어문제해결력',
    category: '학령전기',
    minAgeMonths: 60,
    maxAgeMonths: 143,
    subtests: ['원인이유', '단서추측', '해결추론'],
    description: '언어문제해결력검사',
  },
  {
    id: 'apac',
    name: 'APAC',
    category: '학령전기',
    minAgeMonths: 36,
    maxAgeMonths: 215,
    subtests: ['낱말검사', '연결발화검사'],
    description: '아동용 발음평가',
  },
  {
    id: 'cplc',
    name: 'CPLC',
    category: '학령전기',
    minAgeMonths: 60,
    maxAgeMonths: 143,
    subtests: ['담화관리', '상황/청자에따른조절', '의사소통의도', '비언어적의사소통'],
    description: '아동 화용언어 체크리스트',
  },
];

/**
 * 결과 색상 코드
 */
export const SCORE_COLORS = {
  normal: { min: 90, color: 'text-green-600', bg: 'bg-green-100', label: '정상' },
  borderline: { min: 70, max: 89, color: 'text-yellow-600', bg: 'bg-yellow-100', label: '경계' },
  delayed: { max: 69, color: 'text-red-600', bg: 'bg-red-100', label: '지연' },
} as const;
