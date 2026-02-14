import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  apiKey: string | null;
  _hasHydrated: boolean;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      apiKey: null,
      _hasHydrated: false,

      setApiKey: (key: string) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: null }),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'norm-converter-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
