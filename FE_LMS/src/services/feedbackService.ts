import http from "../utils/http";
import type { Feedback, FeedbackMeta, FeedbackPagination, FeedbackType } from "../types/feedback";

export interface CreateFeedbackPayload {
  type: FeedbackType;
  title: string;
  description: string;
  rating: number;
  // When type is "teacher", this should contain the selected teacher's user ID
  targetId?: string;
}

export interface FeedbackListParams {
  page?: number;
  limit?: number;
  type?: FeedbackType;
  from?: string; // Date format: YYYY-MM-DD
  to?: string; // Date format: YYYY-MM-DD
}

export interface FeedbackListResult {
  feedbacks: Feedback[];
  pagination?: FeedbackPagination;
  meta?: FeedbackMeta;
}

export const feedbackService = {
  submitFeedback: async (payload: CreateFeedbackPayload): Promise<Feedback> => {
    const response = await http.post<Feedback>("/feedbacks", payload);
    return response.data as Feedback;
  },

  getFeedbacks: async (params?: FeedbackListParams): Promise<FeedbackListResult> => {
    const response = await http.get<Feedback[]>("/feedbacks", { params });
    return {
      feedbacks: Array.isArray(response.data) ? response.data : [],
      pagination: response.pagination as FeedbackPagination | undefined,
      meta: response.meta as FeedbackMeta | undefined,
    };
  },

  deleteFeedback: async (id: string): Promise<void> => {
    await http.del(`/feedbacks/${id}`);
  },
};

