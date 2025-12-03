//Define types here
export interface User {
  _id: string;
  username: string;
  role: string;
  fullname: string;
  avatar_url: string;
  bio: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
  fullname: string;
}

export interface AuthMeta {
  timestamp: string;
  timezone: string;
}

export interface AuthResponse<T = User | null> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: AuthMeta;
}

export type RefreshAuthResponse = AuthResponse<null>;
