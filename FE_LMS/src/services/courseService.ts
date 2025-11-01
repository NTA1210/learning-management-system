import http from "../utils/http";
import type { Course } from "../types/course";

export interface CreateCourseData {
  title: string;
  code?: string;
  description?: string;
  category?: string;
  teachers: string[];
  isPublished?: boolean;
  capacity?: number;
}

export interface UpdateCourseData {
  title?: string;
  code?: string;
  description?: string;
  category?: string;
  teachers?: string[];
  isPublished?: boolean;
  capacity?: number;
}

export interface CourseFilters {
  search?: string;
  category?: string;
  teacherId?: string;
  code?: string;
  isPublished?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "title" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export const courseService = {
  // Get all courses with optional filters
  getAllCourses: async (filters?: CourseFilters): Promise<{ courses: Course[]; pagination: unknown }> => {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append("search", filters.search);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.teacherId) params.append("teacherId", filters.teacherId);
    if (filters?.code) params.append("code", filters.code);
    if (filters?.isPublished !== undefined) params.append("isPublished", String(filters.isPublished));
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryString = params.toString();
    const url = `/courses${queryString ? `?${queryString}` : ""}`;
    const response = await http.get<Course[]>(url);
    
    // Handle response format - response.data is always an array
    const courses = Array.isArray(response.data) ? response.data : [];
    const pagination = response.meta?.pagination;
    
    return { courses, pagination };
  },

  // Get a single course by ID
  getCourseById: async (id: string): Promise<Course> => {
    const response = await http.get<Course>(`/courses/${id}`);
    return response.data;
  },

  // Create new course
  createCourse: async (data: CreateCourseData): Promise<Course> => {
    const response = await http.post<Course>("/courses", data);
    return response.data;
  },

  // Update course
  updateCourse: async (id: string, data: UpdateCourseData): Promise<Course> => {
    const response = await http.put<Course>(`/courses/${id}`, data);
    return response.data;
  },

  // Delete course
  deleteCourse: async (id: string): Promise<void> => {
    await http.del(`/courses/${id}`);
  },
};
