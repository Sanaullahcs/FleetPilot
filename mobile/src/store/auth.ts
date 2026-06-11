import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@/lib/types';

const TOKEN_KEY = 'fleetpilot_token';
const USER_KEY = 'fleetpilot_user';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  setUser: (user: AuthUser) => void;
  clear: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  loading: true,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      let user: AuthUser | null = null;

      if (userJson) {
        try {
          user = JSON.parse(userJson) as AuthUser;
        } catch {
          await SecureStore.deleteItemAsync(USER_KEY);
          user = null;
        }
      }

      set({
        token: token ?? null,
        user,
        loading: false,
      });
    } catch {
      set({ token: null, user: null, loading: false });
    }
  },

  setSession: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },

  setUser: (user) => {
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)).catch(() => {});
    set({ user });
  },

  clear: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ token: null, user: null });
  },
}));
