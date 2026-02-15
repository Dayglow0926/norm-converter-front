/**
 * 규준 변환 API 클라이언트
 */

import { useAuthStore } from '@/features/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const apiKey = useAuthStore.getState().apiKey;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    useAuthStore.getState().clearApiKey();
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const normClient = {
  /**
   * 규준 변환 요청 (개별 도구)
   */
  convert: <T>(tool: string, data: unknown) =>
    request<T>(`/api/norm/${tool}/convert`, {
      method: 'POST',
      body: data,
    }),

  /**
   * 통합 변환 요청 (모든 도구 한 번에)
   */
  convertUnified: <T>(data: unknown) =>
    request<T>(`/api/norm/convert`, {
      method: 'POST',
      body: data,
    }),

  /**
   * 평가도구 메타데이터 조회
   */
  getMetadata: <T>(tool: string) =>
    request<T>(`/api/norm/${tool}/metadata`),
};
