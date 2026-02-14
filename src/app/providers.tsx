'use client';

import { type ReactNode } from 'react';
import { ApiKeyGate } from '@/features/auth';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * 전역 Provider 래퍼
 * - ApiKeyGate: API 키 인증 게이트
 * - Zustand는 별도 Provider 불필요 (자동 주입)
 */
export function Providers({ children }: ProvidersProps) {
  return <ApiKeyGate>{children}</ApiKeyGate>;
}
