/**
 * 평가도구 타입 정의
 */

export type AssessmentToolId =
  | 'selsi'
  | 'kmb_cdi'
  | 'pres'
  | 'revt'
  | 'syntax'
  | 'problem_solving'
  | 'apac'
  | 'cplc'
  | 'kcelf5_pp'
  | 'kcelf5_ors'
  | 'language_analysis';

export type AssessmentCategory = '영유아' | '학령전기' | '전 연령';

export interface ToolMetadata {
  id: AssessmentToolId;
  name: string;
  category: AssessmentCategory;
  minAgeMonths: number;
  maxAgeMonths: number;
  subtests: string[];
  description?: string;
  supportedAgeText?: string;
}

export interface ConvertRequest {
  tool: AssessmentToolId;
  subtest?: string;
  rawScore: number;
  ageMonths: number;
  gender?: 'male' | 'female';
}

export interface ConvertResponse {
  standardScore?: number;
  percentile?: number;
  grade?: string;
  equivalentAge?: number;
  sdRange?: string;
}
