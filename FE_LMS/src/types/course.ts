export interface Teacher {
  _id: string;
  username: string;
  email: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Course {
  _id: string;
  title: string;
  code: string;
  description: string;
  category: Category;
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

