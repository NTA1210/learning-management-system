//do business like API call, auth service, ...
import http from "../utils/http";
import { type LoginRequest, type RegisterRequest, type AuthResponse } from "../types/auth";

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await http.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await http.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  logout: async (): Promise<AuthResponse> => {
    const response = await http.get<AuthResponse>("/auth/logout");
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
};
