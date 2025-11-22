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
    if (filters?.subjectId) params.append("subjectId", filters.subjectId);
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
};
