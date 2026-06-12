import { create } from 'zustand';

export type ChatBannerPayload = {
  conversationId: string;
  title: string;
  body: string;
};

type ChatBannerState = {
  banner: ChatBannerPayload | null;
  showBanner: (payload: ChatBannerPayload) => void;
  hideBanner: () => void;
};

export const useChatBannerStore = create<ChatBannerState>((set) => ({
  banner: null,
  showBanner: (banner) => set({ banner }),
  hideBanner: () => set({ banner: null }),
}));
