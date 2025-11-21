export interface AssignmentCourse {
  _id: string;
  title: string;
}

export interface AssignmentAuthor {
  _id: string;
  username: string;
  email: string;
  fullname: string;
}

export interface Assignment {
  _id: string;
  courseId: AssignmentCourse;
  title: string;
  description: string;
  createdBy: AssignmentAuthor;
  maxScore: number;
  dueDate: string;
  allowLate: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AssignmentSortOption = 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc';

export interface AssignmentFormValues {
  courseId: string;
  title: string;
  description: string;
  maxScore: number;
  dueDate: string;
  allowLate: boolean;
}

