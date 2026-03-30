'use client';

import { useEffect } from 'react';
import { API_BASE_URL } from '@/shared/config/constants';

const WARMUP_INTERVAL_MS = 10 * 60 * 1000;
const WARMUP_DEDUP_MS = 30 * 1000;

let lastWarmupAt = 0;
let warmupInFlight: Promise<void> | null = null;

async function requestWarmup(force = false): Promise<void> {
  const now = Date.now();

  if (!force && now - lastWarmupAt < WARMUP_DEDUP_MS) {
    return;
  }

  if (warmupInFlight) {
    return warmupInFlight;
  }

  warmupInFlight = fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    cache: 'no-store',
  })
    .then(() => {
      lastWarmupAt = Date.now();
    })
    .catch(() => {
      // 네트워크 오류가 나더라도 다음 heartbeat/focus에서 재시도한다.
    })
    .finally(() => {
      warmupInFlight = null;
    });

  return warmupInFlight;
}

export function ApiWarmup() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    void requestWarmup(true);

    const intervalId = window.setInterval(() => {
      void requestWarmup(true);
    }, WARMUP_INTERVAL_MS);

    const handleResume = () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      if (Date.now() - lastWarmupAt >= WARMUP_INTERVAL_MS) {
        void requestWarmup(true);
      }
    };

    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, []);

  return null;
}
