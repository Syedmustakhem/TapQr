// src/api/authApi.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://api.tapqr.shop/api';

const api = axios.create({ baseURL: API_BASE_URL });

const ACCESS_TOKEN_KEY = 'tapqr_access_token';
const REFRESH_TOKEN_KEY = 'tapqr_refresh_token';

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

api.interceptors.request.use(async (config) => {
  const tokens = await getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokens = await getTokens();
      if (!tokens?.refreshToken) throw error;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        });
        await saveTokens(data.accessToken, tokens.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        throw refreshError;
      }
    }
    throw error;
  }
);

export const sendEmailOtp = (email: string) =>
  api.post('/auth/email/send-otp', { email }).then((res) => res.data);

export const verifyEmailOtp = (email: string, otp: string, fullName?: string) =>
  api.post('/auth/email/verify-otp', { email, otp, fullName }).then((res) => res.data);

export const sendWhatsappOtp = (phone: string) =>
  api.post('/auth/whatsapp/send-otp', { phone }).then((res) => res.data);

export const verifyWhatsappOtp = (phone: string, otp: string, fullName?: string) =>
  api.post('/auth/whatsapp/verify-otp', { phone, otp, fullName }).then((res) => res.data);

export const googleLogin = (idToken: string) =>
  api.post('/auth/google', { idToken }).then((res) => res.data);

export const getMe = () => api.get('/auth/me').then((res) => res.data);

export const logout = async () => {
  const tokens = await getTokens();
  await api.post('/auth/logout', { refreshToken: tokens?.refreshToken });
  await clearTokens();
};

export default api;