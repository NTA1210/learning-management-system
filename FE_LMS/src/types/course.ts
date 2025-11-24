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
  semesterId?: {
    _id: string;
    name: string;
    type: string;
    year: number;
    startDate: string;
    endDate: string;
  } | string | null;
  teachers?: Teacher[];
  teacherIds?: (Teacher | string)[] | null;
  isPublished: boolean;
  capacity: number;
  status?: 'ongoing' | 'draft' | 'completed';
  startDate?: string;
  endDate?: string;
  enrollRequiresApproval?: boolean;
  enrollPasswordHash?: string | null;
  createdBy?: {
    _id: string;
    username: string;
    email: string;
    fullname?: string;
  };
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: {
    _id: string;
    username?: string;
    email?: string;
    fullname?: string;
  } | null;
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

