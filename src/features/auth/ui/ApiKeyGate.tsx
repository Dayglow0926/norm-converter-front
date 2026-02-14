'use client';

import { useState, type ReactNode } from 'react';
import { useAuthStore } from '../model/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiKeyGateProps {
  children: ReactNode;
}

export function ApiKeyGate({ children }: ApiKeyGateProps) {
  const { apiKey, _hasHydrated, setApiKey, clearApiKey } = useAuthStore();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!_hasHydrated) {
    return null;
  }

  if (apiKey) {
    return <>{children}</>;
  }

  const handleVerify = async () => {
    const trimmedKey = inputKey.trim();
    if (!trimmedKey) {
      setError('API 키를 입력해주세요');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${trimmedKey}` },
      });

      if (response.ok) {
        setApiKey(trimmedKey);
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.message || '유효하지 않은 API 키입니다');
      }
    } catch {
      setError('서버에 연결할 수 없습니다');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="API 키 입력"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isVerifying}
            className="min-h-[48px]"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            onClick={handleVerify}
            disabled={isVerifying || !inputKey.trim()}
            className="min-h-[48px] w-full"
          >
            {isVerifying ? '확인 중...' : '인증'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
