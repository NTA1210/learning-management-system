//Define types here
export interface User {
    username: string;
    role: string;
    fullname: string;
    avatar_url: string;
    bio: string;
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
  }
  
  export interface AuthResponse {
    success: boolean;
    message: string;
    data: User;
    meta?: {
      timestamp: string;
      timezone: string;
    };
  }
  