import http from "../utils/http";
import type { User } from "../types/auth";

export interface UserListParams {
  page?: number;
  limit?: number;
  role?: string;
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

export const userService = {
  getUsers: async (params?: UserListParams): Promise<UserListResult> => {
    const response = await http.get("/users", { params });

    return {
      users: Array.isArray(response.data) ? (response.data as User[]) : [],
      pagination: response.pagination as UserListPagination | undefined,
      meta: response.meta as UserListMeta | undefined,
    };
  },
};


