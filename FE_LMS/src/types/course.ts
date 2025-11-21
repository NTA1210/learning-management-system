export interface Teacher {
  _id: string;
  username: string;
  email: string;
  fullname?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

import type { Subject } from "./subject";

export interface Course {
  _id: string;
  title: string;
  code: string;
  description: string;
  logo?: string;
  category?: Category;
  subjectId?: Subject | string | null;
  teachers: Teacher[];
  isPublished: boolean;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CourseResponse {
  success: boolean;
  message: string;
  data: Course[];
  meta: {
    timestamp: string;
    timezone: string;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

