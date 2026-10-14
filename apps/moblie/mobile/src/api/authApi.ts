
import axios, {
  AxiosError,
  AxiosRequestConfig,
} from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://api.tapqr.shop/api";

const ACCESS_TOKEN_KEY = "tapqr_access_token";
const REFRESH_TOKEN_KEY = "tapqr_refresh_token";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AuthMode = "login" | "register";

export type AuthMethod = "email" | "phone";

export type User = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
};

export type AuthResponse = {
  success?: boolean;
  message?: string;
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: User;
  };
};

export type IdentifyResponse = {
  success?: boolean;
  message?: string;
  code?: string;
  data?: {
    exists: boolean;
    method: "email" | "phone";
    email?: string;
    phone?: string;
  };
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

/* -------------------------------------------------------------------------- */
/* Axios                                                                      */
/* -------------------------------------------------------------------------- */

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* -------------------------------------------------------------------------- */
/* Token storage                                                              */
/* -------------------------------------------------------------------------- */

export async function saveTokens(
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    return;
  }

  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function getTokens(): Promise<TokenPair | null> {
  let accessToken: string | null;
  let refreshToken: string | null;

  if (Platform.OS === "web") {
    [accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem(ACCESS_TOKEN_KEY),
      AsyncStorage.getItem(REFRESH_TOKEN_KEY),
    ]);
  } else {
    [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
  }

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: refreshToken ?? "",
  };
}

export async function clearTokens(): Promise<void> {
  if (Platform.OS === "web") {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    ]);

    return;
  }

  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

/* -------------------------------------------------------------------------- */
/* Request interceptor                                                        */
/* -------------------------------------------------------------------------- */

api.interceptors.request.use(async (config) => {
  const tokens = await getTokens();

  if (tokens?.accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  return config;
});

/* -------------------------------------------------------------------------- */
/* Refresh handling                                                           */
/* -------------------------------------------------------------------------- */

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | RetryableRequestConfig
      | undefined;

    if (!originalRequest) {
      throw error;
    }

    if (
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      throw error;
    }

    originalRequest._retry = true;

    const tokens = await getTokens();

    if (!tokens?.refreshToken) {
      await clearTokens();
      throw error;
    }

    try {
      // Use plain axios to prevent the refresh request from
      // entering the authenticated request interceptor again.
      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/auth/refresh`,
        {
          refreshToken: tokens.refreshToken,
        },
        {
          timeout: 20_000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const accessToken =
        response.data.accessToken ??
        response.data.data?.accessToken;

      const refreshToken =
        response.data.refreshToken ??
        response.data.data?.refreshToken ??
        tokens.refreshToken;

      if (!accessToken) {
        throw new Error(
          "Refresh response did not contain an access token."
        );
      }

      await saveTokens(accessToken, refreshToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      await clearTokens();
      throw refreshError;
    }
  }
);

/* -------------------------------------------------------------------------- */
/* Account identification                                                     */
/* -------------------------------------------------------------------------- */

export async function identifyAccount(
  value: string,
  method: AuthMethod
): Promise<IdentifyResponse> {
  const payload =
    method === "email"
      ? { email: value.trim().toLowerCase() }
      : { phone: value.trim() };

  const response = await api.post<IdentifyResponse>(
    "/auth/identify",
    payload
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Email OTP                                                                  */
/* -------------------------------------------------------------------------- */

export async function sendEmailOtp(
  email: string,
  mode: AuthMode = "login"
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/email/send-otp",
    {
      email: email.trim().toLowerCase(),
      mode,
    }
  );

  return response.data;
}

export async function verifyEmailOtp(
  email: string,
  otp: string,
  mode: AuthMode = "login",
  fullName?: string
): Promise<AuthResponse> {
  const payload: {
    email: string;
    otp: string;
    mode: AuthMode;
    fullName?: string;
  } = {
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
    mode,
  };

  if (mode === "register" && fullName?.trim()) {
    payload.fullName = fullName.trim();
  }

  const response = await api.post<AuthResponse>(
    "/auth/email/verify-otp",
    payload
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* WhatsApp OTP                                                               */
/* -------------------------------------------------------------------------- */

export async function sendWhatsappOtp(
  phone: string,
  mode: AuthMode = "login"
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/whatsapp/send-otp",
    {
      phone: phone.trim(),
      mode,
    }
  );

  return response.data;
}

export async function verifyWhatsappOtp(
  phone: string,
  otp: string,
  mode: AuthMode = "login",
  fullName?: string
): Promise<AuthResponse> {
  const payload: {
    phone: string;
    otp: string;
    mode: AuthMode;
    fullName?: string;
  } = {
    phone: phone.trim(),
    otp: otp.trim(),
    mode,
  };

  if (mode === "register" && fullName?.trim()) {
    payload.fullName = fullName.trim();
  }

  const response = await api.post<AuthResponse>(
    "/auth/whatsapp/verify-otp",
    payload
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Google                                                                     */
/* -------------------------------------------------------------------------- */

export async function googleLogin(
  idToken: string,
  mode: AuthMode = "login"
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/google",
    {
      idToken,
      mode,
    }
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Current user                                                               */
/* -------------------------------------------------------------------------- */

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Logout                                                                     */
/* -------------------------------------------------------------------------- */

export async function logout(): Promise<void> {
  const tokens = await getTokens();

  try {
    await api.post("/auth/logout", {
      refreshToken: tokens?.refreshToken,
    });
  } finally {
    await clearTokens();
  }
}

/* -------------------------------------------------------------------------- */
/* Error helper                                                               */
/* -------------------------------------------------------------------------- */

export function getAuthErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          error?: string;
        }
      | undefined;

    if (data?.message) {
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    if (error.response?.status === 401) {
      return "Your session has expired. Please sign in again.";
    }

    if (error.response?.status === 429) {
      return "Too many attempts. Please wait a moment and try again.";
    }

    if (!error.response) {
      return "Unable to connect to TapQR. Please check your internet connection.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default api;
