// Types for Quiz Attempt Grading and Re-grading

export interface UserInfo {
    _id: string;
    fullname: string;
    email: string;
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

// Params for fetching quiz attempts
export interface GetQuizAttemptsParams {
    page?: number;
    limit?: number;
    status?: 'submitted' | 'graded' | 'regraded' | 'in_progress';
    userId?: string;
    minScore?: number;
    maxScore?: number;
    sortBy?: 'createdAt' | 'title' | 'updatedAt' | 'score';
    order?: 'asc' | 'desc';
}

// Summary info for quiz attempt (for list view)
export interface QuizAttemptSummary {
    _id: string;
    quizId: string;
    student: {
        _id: string;
        username: string;
        email: string;
        fullname: string;
    };
    score: number;
    status: string;
    createdAt: string;
    totalQuestions: number;
    completedQuestions: number;
    // Optional fields
    gradedBy?: UserInfo;
    regradedBy?: UserInfo;
    regradedAt?: string;
    totalQuizScore?: number; // Might be needed for UI calculation
    scorePercentage?: number; // Might be needed for UI calculation
}

// Response for list of attempts
export interface QuizAttemptsResponse {
    success: boolean;
    message: string;
    data: QuizAttemptSummary[];
    meta?: {
        timestamp: string;
        timezone: string;
    };
    pagination?: PaginationInfo;
}

// Detailed answer for a single question
export interface AnswerDetail {
    questionId: string;
    text: string;
    options: string[];
    type: string;
    images?: { url: string; fromDB?: boolean }[];
    answer: number[];
    correctOptions?: number[];
    correct: boolean;
    pointsEarned: number;
    points?: number; // points possible
    feedback?: string;
    explanation?: string;
}

// Regrade history item
export interface RegradeHistoryItem {
    regradedBy: UserInfo;
    regradedAt: string;
    oldScore: number;
    newScore: number;
    feedback?: string;
}

// Quiz info in attempt details
export interface QuizInfo {
    _id: string;
    courseId: string;
    title: string;
    startTime: string;
    endTime: string;
    shuffleQuestions: boolean;
    snapshotQuestions: any[];
    isPublished: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    hashPassword?: string;
}

// Detailed view of an attempt (for grading) - inner data
export interface AttemptDetails {
    _id: string;
    quizId: QuizInfo | string;
    studentId: string;
    answers: AnswerDetail[];
    score: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    submittedAt?: string;
    startedAt?: string;
    durationSeconds?: number;
    ipAddress?: string;
    userAgent?: string;
    regradedHistory?: RegradeHistoryItem[];
}

// Response wrapper for attempt details
export interface AttemptDetailsResponse {
    success: boolean;
    message: string;
    data: AttemptDetails;
    meta?: {
        timestamp: string;
        timezone: string;
    };
}

// Payload for submitting a regrade
export interface RegradePayload {
    answers: {
        questionId: string;
        pointsEarned: number;
        feedback?: string;
    }[];
    totalScore: number;
    feedback?: string;
}

// Response after regrade
export interface RegradeResponse {
    success: boolean;
    message: string;
    data: AttemptDetailsResponse;
}
