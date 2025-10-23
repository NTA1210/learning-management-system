//Define types here
export interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
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
    message: string;
    user?: User;
  }
  