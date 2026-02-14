/**
 * 아동 정보 Zustand 스토어
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChildInfo, AgeResult } from '@/entities/child';
import { calculateAge } from '../lib/calculate-age';

interface ChildInfoState {
  // 상태
  childInfo: ChildInfo | null;
  ageResult: AgeResult | null;
  isValid: boolean;

  // 액션
  setChildInfo: (info: ChildInfo) => void;
  clearChildInfo: () => void;
  updateBirthDate: (date: Date) => void;
  updateTestDate: (date: Date) => void;
}

export const useChildInfoStore = create<ChildInfoState>()(
  persist(
    (set, get) => ({
  // 초기 상태
  childInfo: null,
  ageResult: null,
  isValid: false,

  // 아동 정보 설정 및 연령 계산
  setChildInfo: (info: ChildInfo) => {
    try {
      const ageResult = calculateAge(info.birthDate, info.testDate);
      set({
        childInfo: info,
        ageResult,
        isValid: true,
      });
    } catch {
      set({
        childInfo: info,
        ageResult: null,
        isValid: false,
      });
    }
  },

  // 아동 정보 초기화
  clearChildInfo: () => {
    set({
      childInfo: null,
      ageResult: null,
      isValid: false,
    });
  },

  // 생년월일만 업데이트
  updateBirthDate: (date: Date) => {
    const current = get().childInfo;
    if (current) {
      get().setChildInfo({ ...current, birthDate: date });
    }
  },

  // 평가일만 업데이트
  updateTestDate: (date: Date) => {
    const current = get().childInfo;
    if (current) {
      get().setChildInfo({ ...current, testDate: date });
    }
  },
}),
    {
      name: 'norm-converter-child-info',
      // Date 객체를 문자열로 저장/복원
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Date 복원
          if (parsed?.state?.childInfo) {
            const ci = parsed.state.childInfo;
            if (ci.birthDate) ci.birthDate = new Date(ci.birthDate);
            if (ci.testDate) ci.testDate = new Date(ci.testDate);
          }
          return parsed;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
