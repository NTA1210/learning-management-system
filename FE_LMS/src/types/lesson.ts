export interface LessonCourse {
  _id: string;
  title: string;
  description?: string;
  teacherIds?: string[];
  isPublished?: boolean;
}

export interface Lesson {
  _id: string;
  title: string;
  courseId: LessonCourse;
  content: string;
  order: number;
  durationMinutes: number;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  hasAccess: boolean;
  accessReason: string;
}

export type LessonSortOption = 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc';

export interface LessonFormValues {
  courseId: string;
  title: string;
  content: string;
  order: number;
  durationMinutes: number;
  publishedAt: string;
}

