export type FeedbackType = "system" | "teacher" | "other";

export interface FeedbackUser {
  _id: string;
  username: string;
  email: string;
  fullname?: string;
}

export interface Feedback {
  _id: string;
  type: FeedbackType;
  title: string;
  description: string;
  rating: number;
  userId: FeedbackUser;
  size?: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface FeedbackPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FeedbackMeta {
  timestamp?: string;
  timezone?: string;
  [key: string]: unknown;
}

