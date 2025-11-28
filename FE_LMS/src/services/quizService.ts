import http from "../utils/http";

export interface SnapshotQuestionPayload {
  id?: string;
  text: string;
  type: string;
  options: string[];
  correctOptions: number[];
  points?: number;
  explanation?: string;
  images?: { url: string; fromDB?: boolean }[];
  isExternal?: boolean;
  isNewQuestion?: boolean;
  isDeleted?: boolean;
  isDirty?: boolean;
}

export interface CreateQuizPayload {
  courseId: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  shuffleQuestions?: boolean;
  isPublished?: boolean;
  snapshotQuestions?: SnapshotQuestionPayload[];
}

export interface SnapshotQuestion {
  id?: string;
  text: string;
  type: string;
  options: string[];
  correctOptions: number[];
  points?: number;
  explanation?: string;
  images?: { url: string; fromDB?: boolean }[];
  isExternal?: boolean;
  isNewQuestion?: boolean;
  isDeleted?: boolean;
  isDirty?: boolean;
}

export interface QuizResponse {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  shuffleQuestions?: boolean;
  isPublished?: boolean;
  isCompleted?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  snapshotQuestions?: SnapshotQuestion[];
}

export interface GetQuizzesParams {
  courseId?: string;
  isDeleted?: boolean;
  isCompleted?: boolean;
  isPublished?: boolean;
}

export interface GetQuizzesByCourseParams {
  isDeleted?: boolean;
  isCompleted?: boolean;
  isPublished?: boolean;
  page?: number | string;
  limit?: number | string;
  search?: string;
}

export interface QuizzesResponse {
  data: QuizResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Helper function to ensure all text fields in snapshot questions are strings
const normalizeSnapshotForAPI = (snapshot: SnapshotQuestionPayload): SnapshotQuestionPayload => {
  return {
    ...snapshot,
    text: String(snapshot.text ?? ""),
    type: String(snapshot.type ?? "mcq"),
    options: Array.isArray(snapshot.options)
      ? snapshot.options.map((opt) => String(opt ?? ""))
      : [],
    correctOptions: Array.isArray(snapshot.correctOptions) ? snapshot.correctOptions : [],
    points: Number(snapshot.points) || 1,
    explanation: snapshot.explanation ? String(snapshot.explanation) : undefined,
    images: snapshot.images,
    id: snapshot.id ? String(snapshot.id) : undefined,
    isExternal: Boolean(snapshot.isExternal ?? true),
    isNewQuestion: Boolean(snapshot.isNewQuestion ?? false),
    isDeleted: Boolean(snapshot.isDeleted ?? false),
    isDirty: Boolean(snapshot.isDirty ?? false),
  };
};

export const quizService = {
  createQuiz: async (payload: CreateQuizPayload): Promise<QuizResponse> => {
    // MANDATORY: Normalize all snapshot questions to ensure text fields are strings
    const normalizedSnapshots = (payload.snapshotQuestions ?? []).map(normalizeSnapshotForAPI);
    
    const response = await http.post<QuizResponse>("/quizzes", {
      courseId: payload.courseId,
      title: payload.title,
      description: payload.description,
      startTime: payload.startTime,
      endTime: payload.endTime,
      shuffleQuestions: payload.shuffleQuestions ?? false,
      isPublished: payload.isPublished ?? false,
      snapshotQuestions: normalizedSnapshots,
    });
    return response.data as QuizResponse;
  },

  getQuizzes: async (params?: GetQuizzesParams): Promise<QuizResponse[]> => {
    const response = await http.get<{ data: QuizResponse[] }>("/quizzes", {
      params,
    });
    return response.data.data || [];
  },

  getQuizById: async (quizId: string): Promise<QuizResponse> => {
    const response = await http.get<QuizResponse>(`/quizzes/${quizId}`);
    return response.data;
  },

  /**
   * Get quizzes by courseId
   * @param courseId - Course ID (required)
   * @param params - Optional query parameters (isPublished, isCompleted, isDeleted, page, limit, search)
   * @returns Quizzes with pagination info
   */
  getQuizzesByCourseId: async (
    courseId: string,
    params?: GetQuizzesByCourseParams
  ): Promise<QuizzesResponse> => {
    // Filter out undefined/null values and boolean false values
    // Backend expects boolean, but query params are strings in HTTP GET
    // So we only send boolean params if they are true, or skip them entirely
    const queryParams: Record<string, string | number | boolean> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Skip boolean false values (backend will use default behavior)
          // Only include boolean true values or non-boolean values
          if (typeof value === 'boolean' && value === false) {
            // Don't send false boolean values
            return;
          }
          queryParams[key] = value;
        }
      });
    }
    
    const response = await http.get<{
      success: boolean;
      data: QuizResponse[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
      message?: string;
    }>(`/courses/${courseId}/quizzes`, {
      params: queryParams,
    });
    return {
      data: response.data || [],
      pagination: response.pagination,
    };
  },

  updateQuiz: async (quizId: string, payload: Partial<CreateQuizPayload> & { snapshotQuestions?: SnapshotQuestionPayload[] }): Promise<QuizResponse> => {
    // Normalize snapshot questions if provided
    const normalizedSnapshots = payload.snapshotQuestions
      ? payload.snapshotQuestions.map(normalizeSnapshotForAPI)
      : undefined;

    const response = await http.put<QuizResponse>(`/quizzes/${quizId}`, {
      ...payload,
      snapshotQuestions: normalizedSnapshots,
    });
    return response.data;
  },

  /**
   * Delete a question from quiz (mark as deleted in snapshotQuestions)
   * @param quizId - Quiz ID
   * @param questionId - Question ID to delete
   * @returns Updated quiz
   */
  deleteQuestionById: async (quizId: string, questionId: string): Promise<QuizResponse> => {
    // Get current quiz
    const quiz = await quizService.getQuizById(quizId);
    
    // Mark question as deleted - ensure isNewQuestion is false for existing questions
    const updatedQuestions = (quiz.snapshotQuestions || []).map((q) =>
      q.id === questionId 
        ? { ...q, isDeleted: true, isDirty: true, isNewQuestion: false } 
        : q
    );

    // Update quiz with deleted question
    return await quizService.updateQuiz(quizId, {
      snapshotQuestions: updatedQuestions,
    });
  },

  /**
   * Update a question in quiz
   * @param quizId - Quiz ID
   * @param questionId - Question ID to update
   * @param questionData - Updated question data
   * @returns Updated quiz
   */
  updateQuestionById: async (
    quizId: string, 
    questionId: string, 
    questionData: Partial<SnapshotQuestionPayload>
  ): Promise<QuizResponse> => {
    // Get current quiz
    const quiz = await quizService.getQuizById(quizId);
    
    // Update the question - mark as dirty and not new
    // Keep original isExternal value - this is a snapshot, not updating the original question in DB
    const updatedQuestions = (quiz.snapshotQuestions || []).map((q) =>
      q.id === questionId 
        ? { 
            ...q, 
            ...questionData,
            isDirty: true, 
            isNewQuestion: false, // Ensure it's not treated as a new question
            isDeleted: false,
            // Keep original isExternal - don't change it, this is just updating the snapshot
            isExternal: q.isExternal ?? true
          } 
        : q
    );

    // Update quiz with updated question
    return await quizService.updateQuiz(quizId, {
      snapshotQuestions: updatedQuestions,
    });
  },

  /**
   * Delete entire quiz
   * @param quizId - Quiz ID to delete
   * @returns Deleted quiz
   */
  deleteQuiz: async (quizId: string): Promise<void> => {
    await http.del(`/quizzes/${quizId}`);
  },
};


