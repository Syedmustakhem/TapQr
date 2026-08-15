import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "tapqr_access_token";
const REFRESH_TOKEN_KEY = "tapqr_refresh_token";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setTokens: (
    accessToken: string,
    refreshToken?: string
  ) => Promise<void>;

  loadTokens: () => Promise<void>;

  clearTokens: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setTokens: async (
    accessToken,
    refreshToken
  ) => {
    await SecureStore.setItemAsync(
      ACCESS_TOKEN_KEY,
      accessToken
    );

    if (refreshToken) {
      await SecureStore.setItemAsync(
        REFRESH_TOKEN_KEY,
        refreshToken
      );
    }

    set({
      accessToken,
      refreshToken: refreshToken ?? null,
      isAuthenticated: true,
    });
  },

  loadTokens: async () => {
    const accessToken =
      await SecureStore.getItemAsync(
        ACCESS_TOKEN_KEY
      );

    const refreshToken =
      await SecureStore.getItemAsync(
        REFRESH_TOKEN_KEY
      );

    set({
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
    });
  },

  clearTokens: async () => {
    await SecureStore.deleteItemAsync(
      ACCESS_TOKEN_KEY
    );

    await SecureStore.deleteItemAsync(
      REFRESH_TOKEN_KEY
    );

    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));