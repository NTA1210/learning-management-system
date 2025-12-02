import { CREATED } from '@/constants/http';
import { createQuizHandler } from '@/controller/quiz.controller';
import { createQuiz } from '@/services/quiz.service';
import { createQuizSchema } from '@/validators/quiz.schemas';

jest.mock('@/services/quiz.service.ts', () => {
  return {
    createQuiz: jest.fn(),
    deleteQuiz: jest.fn(),
    getQuizAttemptsByQuizId: jest.fn(),
    getQuizById: jest.fn(),
    getStatisticByQuizId: jest.fn(),
    updateQuiz: jest.fn(),
  };
});

jest.mock('@/validators/quiz.schemas.ts', () => {
  return {
    createQuizSchema: { parse: jest.fn() },
    updateQuizSchema: { parse: jest.fn() },
  };
});

jest.mock('@/utils/asyncHandler.ts', () => {
  return {
    catchErrors: jest.fn(),
  };
});

jest.mock('@/utils/cookies', () => {
  return {
    getAccessTokenCookieOptions: jest.fn().mockReturnValue({
      sameSite: 'strict',
      secure: true,
      httpOnly: true,
      expires: '2025-11-07T03:31:13.441Z',
    }),
  };
});

describe('Quiz Controller Unit Tests', () => {
  const mockReq = {
    body: {},
    headers: {
      'user-agent': 'jest-test-agent',
    } as Record<string, string>,
    cookies: {},
    params: {},
  };

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    success: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  afterEach(() => jest.clearAllMocks());

  const mockNext = jest.fn();

  describe('Create quiz controller', () => {
    const mockQuiz = {
      title: 'Test Quiz',
      courseId: '12345678901234567890abcd',
      description: 'This is a test quiz',
      startTime: new Date(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      shuffleQuestions: false,
      isPublished: true,
      snapshotQuestions: [
        {
          question: 'What is the capital of France?',
          options: ['Paris', 'London', 'Berlin', 'Rome'],
          answer: [1, 0, 0, 0],
        },
        {
          question: 'What is the largest planet in our solar system?',
          options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
          answer: [0, 0, 1, 0],
        },
      ],
    };

    it('should validate request, call createAccount, and return success', async () => {
      // Mock Zod schema parse
      (createQuizSchema.parse as jest.Mock).mockReturnValue(mockQuiz);

      // Mock service
      (createQuiz as jest.Mock).mockResolvedValue(mockQuiz);

      await createQuizHandler(mockReq as any, mockRes as any, mockNext);

      // ✅ validate gọi schema.parse đúng
      expect(createQuizSchema.parse).toHaveBeenCalledWith({
        ...mockReq.body,
        useAgent: mockReq.headers['user-agent'],
      });

      // ✅ validate service được gọi đúng
      expect(createQuiz).toHaveBeenCalledWith(mockQuiz);

      // ✅ validate res.success được gọi
      expect(mockRes.success).toHaveBeenCalledWith(CREATED, mockQuiz);
    });
  });
});
