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
  userId?: string;
  targetId?: string;
  from?: string; // Date format: YYYY-MM-DD
  to?: string; // Date format: YYYY-MM-DD
}

export interface FeedbackListResult {
  feedbacks: Feedback[];
  pagination?: FeedbackPagination;
  meta?: FeedbackMeta;
  averageRating?: number;
}

export const feedbackService = {
  submitFeedback: async (payload: CreateFeedbackPayload): Promise<Feedback> => {
    const response = await http.post<Feedback>("/feedbacks", payload);
    return response.data as Feedback;
  },

  getFeedbacks: async (params?: FeedbackListParams): Promise<FeedbackListResult> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.type) queryParams.append("type", params.type);
    if (params?.userId) queryParams.append("userId", params.userId);
    if (params?.targetId) queryParams.append("targetId", params.targetId);
    if (params?.from) queryParams.append("from", params.from);
    if (params?.to) queryParams.append("to", params.to);
    
    const queryString = queryParams.toString();
    const url = `/feedbacks${queryString ? `?${queryString}` : ""}`;
    const response = await http.get<Feedback[]>(url);
    
    // Handle response that might include averageRating
    const responseData = response as any;
    return {
      feedbacks: Array.isArray(response.data) ? response.data : [],
      pagination: response.pagination as FeedbackPagination | undefined,
      meta: response.meta as FeedbackMeta | undefined,
      averageRating: responseData.averageRating,
    };
  },

  deleteFeedback: async (id: string): Promise<void> => {
    await http.del(`/feedbacks/${id}`);
  },
};

