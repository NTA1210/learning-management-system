//do business like API call, auth service, ...
import http from "../utils/http";

import { type LoginRequest, type RegisterRequest, type AuthResponse, type User } from "../types/auth";
export * from './mock';
export const authService = {
  login: async (data: LoginRequest): Promise<User> => {
    const response = await http.post<User>("/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await http.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  logout: async (): Promise<AuthResponse> => {
    const response = await http.get<AuthResponse>("/auth/logout");
    // Clear local storage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await http.get<AuthResponse>("/auth/refresh");
    return response.data;
  },

  sendPasswordReset: async (email: string): Promise<AuthResponse> => {
    const response = await http.post<AuthResponse>("/auth/password/forgot", { email });
    return response.data;
  },

  resetPassword: async (verificationCode: string, password: string): Promise<AuthResponse> => {
    const response = await http.post<AuthResponse>("/auth/password/reset", {
      verificationCode,
      password,
    });
    return response.data;
  },

  verifyEmail: async (code: string): Promise<AuthResponse> => {
    const response = await http.get<AuthResponse>(`/auth/email/verify/${code}`);
    return response.data;
  },

  // Get current user info (requires authentication)
  getCurrentUser: async (): Promise<User> => {
    const response = await http.get<User>("/user");
    return response.data;
  },
};
