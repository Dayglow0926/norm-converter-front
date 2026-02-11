/**
 * 규준 변환 API 클라이언트
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const normClient = {
  /**
   * 규준 변환 요청
   */
  convert: <T>(tool: string, data: unknown) =>
    request<T>(`/api/norm/${tool}/convert`, {
      method: 'POST',
      body: data,
    }),

  /**
   * 평가도구 메타데이터 조회
   */
  getMetadata: <T>(tool: string) =>
    request<T>(`/api/norm/${tool}/metadata`),
};
