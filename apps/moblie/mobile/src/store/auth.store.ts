
import { create } from "zustand";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "tapqr_access_token";
const REFRESH_TOKEN_KEY = "tapqr_refresh_token";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setTokens: (
    accessToken: string,
    refreshToken?: string
  ) => Promise<void>;

  loadTokens: () => Promise<void>;
  clearTokens: () => Promise<void>;
}

async function saveValue(key: string, value: string) {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getValue(key: string) {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function deleteValue(key: string) {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,

  setTokens: async (accessToken, refreshToken) => {
    await saveValue(ACCESS_TOKEN_KEY, accessToken);

    if (refreshToken) {
      await saveValue(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      await deleteValue(REFRESH_TOKEN_KEY);
    }

    set({
      accessToken,
      refreshToken: refreshToken ?? null,
      isAuthenticated: true,
      isHydrated: true,
    });
  },

  loadTokens: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        getValue(ACCESS_TOKEN_KEY),
        getValue(REFRESH_TOKEN_KEY),
      ]);

      set({
        accessToken,
        refreshToken,
        isAuthenticated: Boolean(accessToken),
        isHydrated: true,
      });
    } catch (error) {
      console.error("Failed to restore authentication:", error);

      set({
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },

  clearTokens: async () => {
    await Promise.all([
      deleteValue(ACCESS_TOKEN_KEY),
      deleteValue(REFRESH_TOKEN_KEY),
    ]);

    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  },
}));
