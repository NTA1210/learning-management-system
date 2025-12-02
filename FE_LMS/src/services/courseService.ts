/* eslint-disable @typescript-eslint/no-explicit-any */
import http from "../utils/http";
import { httpClient } from "../utils/http";
import type { Course } from "../types/course";

export interface CreateCourseData {
  title: string;
  slug: string;
  subjectId: string;
  description?: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  teacherIds: string[]; // Array of teacher IDs
  status?: 'ongoing' | 'draft' | 'completed';
  isPublished?: boolean;
  capacity?: number;
  enrollRequiresApproval?: boolean;
  semesterId?: string;
  logo?: File; // File for logo upload
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  teacherIds?: string[]; // Array of teacher IDs
  status?: 'ongoing' | 'draft' | 'completed';
  isPublished?: boolean;
  capacity?: number;
  enrollRequiresApproval?: boolean;
  semesterId?: string;
  logo?: File; // File for logo upload
}

export interface CourseFilters {
  search?: string;
  category?: string;
  teacherId?: string;
  code?: string;
  subjectId?: string;
  semesterId?: string;
  isPublished?: boolean;
  onlyDeleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "title" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface CoursePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseListResponse {
  data: Course[];
  pagination?: CoursePagination;
}

export interface MyCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  slug?: string;
  from?: string;
  to?: string;
  subjectId?: string;
  semesterId?: string;
  teacherId?: string;
  isPublished?: boolean;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const courseService = {
  // Get all courses with optional filters
  getAllCourses: async (filters?: CourseFilters): Promise<{ courses: Course[]; pagination: unknown }> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.teacherId) params.append("teacherId", filters.teacherId);
    if (filters?.code) params.append("code", filters.code);
    if (filters?.subjectId) params.append("subjectId", filters.subjectId);
    if (filters?.semesterId) params.append("semesterId", filters.semesterId);
    if (filters?.isPublished !== undefined) params.append("isPublished", String(filters.isPublished));
    if (filters?.onlyDeleted) params.append("onlyDeleted", "true");
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryString = params.toString();
    const url = `/courses${queryString ? `?${queryString}` : ""}`;
    const response = await http.get<any>(url);

    let courses: Course[] = [];
    if (Array.isArray(response?.data)) {
      courses = response.data as Course[];
    } else if (Array.isArray(response?.data?.data)) {
      courses = response.data.data as Course[];
    } else if (Array.isArray(response)) {
      courses = response as Course[];
    }

    const pagination = (response as any)?.pagination || response?.meta?.pagination;
    return { courses, pagination };
  },

  /**
   * Get courses (alias for getAllCourses with simpler interface)
   * GET /courses
   */
  getCourses: async (params?: { page?: number; limit?: number }): Promise<CourseListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    
    const queryString = queryParams.toString();
    const url = `/courses${queryString ? `?${queryString}` : ""}`;
    const response = await http.get<any>(url);

    let data: Course[] = [];
    if (Array.isArray(response?.data)) {
      data = response.data as Course[];
    } else if (Array.isArray(response)) {
      data = response as Course[];
    }

    const pagination = (response as any)?.pagination;
    return { data, pagination };
  },

  /**
   * Get my courses (courses where the current user is a teacher or enrolled student)
   * GET /courses/my-courses
   */
  getMyCourses: async (params?: MyCoursesParams): Promise<CourseListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.search) queryParams.append("search", params.search);
    if (params?.slug) queryParams.append("slug", params.slug);
    if (params?.from) queryParams.append("from", params.from);
    if (params?.to) queryParams.append("to", params.to);
    if (params?.subjectId) queryParams.append("subjectId", params.subjectId);
    if (params?.semesterId) queryParams.append("semesterId", params.semesterId);
    if (params?.teacherId) queryParams.append("teacherId", params.teacherId);
    if (params?.isPublished !== undefined) queryParams.append("isPublished", String(params.isPublished));
    if (params?.status) queryParams.append("status", params.status);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    
    const queryString = queryParams.toString();
    const url = `/courses/my-courses${queryString ? `?${queryString}` : ""}`;
    const response = await http.get<any>(url);

    let data: Course[] = [];
    if (Array.isArray(response?.data)) {
      data = response.data as Course[];
    } else if (Array.isArray(response)) {
      data = response as Course[];
    }

    const pagination = (response as any)?.pagination;
    return { data, pagination };
  },

  // Get a single course by ID
  getCourseById: async (id: string): Promise<Course> => {
    const response = await http.get<Course | { data: Course }>(`/courses/${id}`);
    // Handle both response formats
    if ((response as { data: Course }).data) {
      return (response as { data: Course }).data;
    }
    return response as Course;
  },

  // Create new course (multipart/form-data)
  createCourse: async (data: CreateCourseData): Promise<Course> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('slug', data.slug);
    formData.append('subjectId', data.subjectId);
    if (data.description) formData.append('description', data.description);
    if (data.startDate) formData.append('startDate', data.startDate);
    if (data.endDate) formData.append('endDate', data.endDate);
    if (data.teacherIds && data.teacherIds.length > 0) {
      formData.append('teacherIds', JSON.stringify(data.teacherIds));
    }
    if (data.status) formData.append('status', data.status);
    if (data.isPublished !== undefined) formData.append('isPublished', String(data.isPublished));
    if (data.capacity) formData.append('capacity', String(data.capacity));
    if (data.enrollRequiresApproval !== undefined) formData.append('enrollRequiresApproval', String(data.enrollRequiresApproval));
    if (data.semesterId) formData.append('semesterId', JSON.stringify([data.semesterId]));
    if (data.logo) formData.append('logo', data.logo);

    const response = await httpClient.post<any>("/courses", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to create course");
    }
    return response.data.data;
  },

  // Update course (multipart/form-data)
  updateCourse: async (id: string, data: UpdateCourseData): Promise<Course> => {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description !== undefined) formData.append('description', data.description || '');
    if (data.startDate) formData.append('startDate', data.startDate);
    if (data.endDate) formData.append('endDate', data.endDate);
    if (data.teacherIds && data.teacherIds.length > 0) {
      formData.append('teacherIds', JSON.stringify(data.teacherIds));
    }
    if (data.status) formData.append('status', data.status);
    if (data.isPublished !== undefined) formData.append('isPublished', String(data.isPublished));
    if (data.capacity !== undefined) formData.append('capacity', String(data.capacity));
    if (data.enrollRequiresApproval !== undefined) formData.append('enrollRequiresApproval', String(data.enrollRequiresApproval));
    if (data.semesterId) formData.append('semesterId', JSON.stringify([data.semesterId]));
    if (data.logo) formData.append('logo', data.logo);

    const response = await httpClient.put<any>(`/courses/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to update course");
    }
    return response.data.data;
  },

  // Delete course (soft delete)
  deleteCourse: async (id: string): Promise<void> => {
    await httpClient.delete(`/courses/${id}`);
  },

  // Permanent delete course
  deleteCoursePermanent: async (id: string): Promise<void> => {
    await httpClient.delete(`/courses/${id}/permanent`);
  },

  // Restore deleted course (admin only)
  restoreCourse: async (id: string): Promise<void> => {
    await httpClient.post(`/courses/${id}/restore`);
  },
};
