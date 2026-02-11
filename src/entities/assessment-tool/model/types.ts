/**
 * 평가도구 타입 정의
 */

export type AssessmentToolId =
  | 'selsi'
  | 'pres'
  | 'revt'
  | 'syntax'
  | 'problem_solving'
  | 'apac'
  | 'cplc';

export type AssessmentCategory = '영유아' | '학령전기';

export interface ToolMetadata {
  id: AssessmentToolId;
  name: string;
  category: AssessmentCategory;
  minAgeMonths: number;
  maxAgeMonths: number;
  subtests: string[];
  description?: string;
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
