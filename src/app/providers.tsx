'use client';

import { type ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * 전역 Provider 래퍼
 * - Zustand는 별도 Provider 불필요 (자동 주입)
 * - 향후 QueryClient 등 추가 가능
 */
export function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}
