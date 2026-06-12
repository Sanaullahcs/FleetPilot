import { create } from 'zustand';

export type PushRegistrationStatus = 'idle' | 'registered' | 'denied' | 'unavailable' | 'simulator' | 'expo_go';

interface PushStatusState {
  status: PushRegistrationStatus;
  detail: string | null;
  setStatus: (status: PushRegistrationStatus, detail?: string | null) => void;
  reset: () => void;
}

export const usePushStatusStore = create<PushStatusState>((set) => ({
  status: 'idle',
  detail: null,
  setStatus: (status, detail = null) => set({ status, detail }),
  reset: () => set({ status: 'idle', detail: null }),
}));
