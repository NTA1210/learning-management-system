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
  isNew?: boolean;
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
  snapshotQuestions?: SnapshotQuestionPayload[];
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
  createdAt?: string;
  updatedAt?: string;
}

export interface GetQuizzesParams {
  courseId?: string;
  isDeleted?: boolean;
  isCompleted?: boolean;
  isPublished?: boolean;
}

export const quizService = {
  createQuiz: async (payload: CreateQuizPayload): Promise<QuizResponse> => {
    const response = await http.post<QuizResponse>("/quizzes", {
      courseId: payload.courseId,
      title: payload.title,
      description: payload.description,
      startTime: payload.startTime,
      endTime: payload.endTime,
      shuffleQuestions: payload.shuffleQuestions ?? false,
      snapshotQuestions: payload.snapshotQuestions ?? [],
    });
    return response.data as QuizResponse;
  },

  getQuizzes: async (params?: GetQuizzesParams): Promise<QuizResponse[]> => {
    const response = await http.get<{ data: QuizResponse[] }>("/quizzes", {
      params,
    });
    return response.data.data || [];
  },
};


