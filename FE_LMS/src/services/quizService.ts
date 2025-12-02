import http from "../utils/http";

export interface SnapshotQuestionPayload {
  id?: string;
  _id?: string;
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
  _id?: string;
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
  hashPassword?: string;
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
    // Backend endpoint /courses/:courseId/quizzes expects ALL params as strings
    // So we convert all number/boolean values to strings, but preserve strings as-is
    const queryParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Skip boolean false values (backend will use default behavior)
          // Only include boolean true values or non-boolean values
          if (typeof value === 'boolean' && value === false) {
            // Don't send false boolean values
            return;
          }
          // Convert values to string for this endpoint
          // If already a string, use it as-is (may contain quotes like "5" for JSON string format)
          // If number or boolean, convert to string
          if (typeof value === 'string') {
            queryParams[key] = value;
          } else if (typeof value === 'number') {
            queryParams[key] = String(value);
          } else if (typeof value === 'boolean') {
            queryParams[key] = String(value);
          } else {
            // Fallback: convert anything else to string
            queryParams[key] = String(value);
          }
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
    const updatedQuestions = (quiz.snapshotQuestions || []).map((q) => {
      const currentId = String(q.id || q._id || "");
      return currentId === String(questionId)
        ? { ...q, id: currentId, isDeleted: true, isDirty: true, isNewQuestion: false }
        : q;
    });

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
    const updatedQuestions = (quiz.snapshotQuestions || []).map((q) => {
      const currentId = String(q.id || q._id || "");
      return currentId === String(questionId)
        ? {
          ...q,
          ...questionData,
          id: currentId, // MUST keep ID for backend mapping (line 177 in backend)
          isDirty: true, // Mark as dirty so backend processes it as updated
          isNewQuestion: false, // Ensure it's not treated as a new question
          isDeleted: false,
          // Set isExternal to false - this is now a modified local copy
          isExternal: false
        }
        : {
          ...q,
          // CRITICAL: Reset ALL flags for unchanged questions to prevent backend errors
          // Backend may have stale flags (isNewQuestion: true) from previous operations
          isDirty: false,
          isNewQuestion: false,
          isDeleted: false,
        };
    });

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

  /**
   * Get quiz statistics
   * @param quizId - Quiz ID
   * @returns Quiz statistics
   */
  getQuizStatistics: async (quizId: string): Promise<{
    totalStudents: number;
    submittedCount: number;
    averageScore: number;
    medianScore: number;
    minMax: {
      min: number;
      max: number;
    };
    standardDeviationScore: number;
    scoreDistribution: Array<{
      min: number;
      max: number;
      range: string;
      count: number;
      percentage: string;
    }>;
    students: Array<{
      fullname: string;
      email: string;
      score: number;
      durationSeconds: number;
      rank: number;
    }>;
  }> => {
    const response = await http.get<{
      success: boolean;
      data: {
        totalStudents: number;
        submittedCount: number;
        averageScore: number;
        medianScore: number;
        minMax: {
          min: number;
          max: number;
        };
        standardDeviationScore: number;
        scoreDistribution: Array<{
          min: number;
          max: number;
          range: string;
          count: number;
          percentage: string;
        }>;
        students: Array<{
          fullname: string;
          email: string;
          score: number;
          durationSeconds: number;
          rank: number;
        }>;
      };
    }>(`/quizzes/${quizId}/statistics`);
    return response.data;
  },

  /**
   * Upload images for quiz question
   * POST /quiz-questions/images
   */
  uploadQuestionImages: async (quizId: string, images: File[]): Promise<{ url: string; fromDB: boolean }[]> => {
    const formData = new FormData();
    formData.append('quizId', quizId);
    images.forEach((file) => {
      formData.append('files', file); // Backend expects 'files' field name
    });

    const response = await http.post<{ data: { url: string; fromDB: boolean }[] }>('/quiz-questions/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};


