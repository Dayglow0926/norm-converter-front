'use client';

import { useEffect } from 'react';
import { API_BASE_URL } from '@/shared/config/constants';

let hasRequestedWarmup = false;

export function ApiWarmup() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (hasRequestedWarmup) {
      return;
    }

    hasRequestedWarmup = true;

    void fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
    })
      .catch(() => {
        hasRequestedWarmup = false;
      });
  }, []);

  return null;
}
