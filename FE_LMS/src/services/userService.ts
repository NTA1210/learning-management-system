import http from "../utils/http";
import type { User } from "../types/auth";

export interface UserListParams {
  page?: number;
  limit?: number;
  role?: string;
  specialistIds?: string[];
  isVerified?: boolean | string;
  status?: string;
  username?: string;
  email?: string;
  fullname?: string;
}

export interface UserListPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface UserListMeta {
  timestamp?: string;
  timezone?: string;
  // Allow backend to send extra metadata without breaking the UI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface UserListResult {
  users: User[];
  pagination?: UserListPagination;
  meta?: UserListMeta;
}

export interface UserDetail extends User {
  email?: string;
  fullname?: string;
  phone_number?: string;
  bio?: string;
  isVerified?: boolean;
  status?: string;
  specialistIds?: any[];
  createdAt?: string;
  updatedAt?: string;
  avatar_url?: string;
  key?: string;
}

export const userService = {
  getUsers: async (params?: UserListParams): Promise<UserListResult> => {
    const queryParams = new URLSearchParams();
    
    // Pass page and limit as quoted strings: "1" instead of 1
    if (params?.page !== undefined) queryParams.append("page", `"${params.page}"`);
    if (params?.limit !== undefined) queryParams.append("limit", `"${params.limit}"`);
    if (params?.role) queryParams.append("role", params.role);
    if (params?.isVerified !== undefined) {
      const isVerifiedValue = typeof params.isVerified === 'boolean' 
        ? String(params.isVerified) 
        : params.isVerified;
      queryParams.append("isVerified", isVerifiedValue);
    }
    if (params?.status) queryParams.append("status", params.status);
    if (params?.username) queryParams.append("username", params.username);
    if (params?.email) queryParams.append("email", params.email);
    if (params?.fullname) queryParams.append("fullname", params.fullname);

    const queryString = queryParams.toString();
    const url = `/users${queryString ? `?${queryString}` : ""}`;
    const response = await http.get(url);

    return {
      users: Array.isArray(response.data) ? (response.data as User[]) : [],
      pagination: response.pagination as UserListPagination | undefined,
      meta: response.meta as UserListMeta | undefined,
    };
  },

  getUserById: async (userId: string): Promise<UserDetail> => {
    const response = await http.get(`/users/${userId}`);
    return response.data as UserDetail;
  },
};


