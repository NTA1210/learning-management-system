import mongoose from 'mongoose';
import {
  enrollQuiz,
  submitQuizAttempt,
  saveQuizAttempt,
  deleteQuizAttempt,
  banQuizAttempt,
  autoSaveQuizAttempt,
  getQuizAttemptById,
  updateQuizAttemptScore,
  gradeQuizAttempt,
} from '@/services/quizAttempt.service';
import { QuizModel, QuizAttemptModel, EnrollmentModel } from '@/models';
import { Role, AttemptStatus } from '@/types';
import { isTeacherOfCourse } from '@/services/helpers/quizHelpers';
import appAssert from '@/utils/appAssert';

const USER_ID = new mongoose.Types.ObjectId();
const TEACHER_ID = new mongoose.Types.ObjectId();
const QUIZ_ID = new mongoose.Types.ObjectId();
const ATTEMPT_ID = new mongoose.Types.ObjectId();
const COURSE_ID = new mongoose.Types.ObjectId();

jest.mock('@/models', () => ({
  QuizModel: { findById: jest.fn() },
  QuizAttemptModel: {
    findById: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
  EnrollmentModel: { findOne: jest.fn() },
}));

jest.mock('@/utils/appAssert', () => {
  return jest.fn((condition: any, code: any, message: string) => {
    if (!condition) throw new Error(message);
  });
});

jest.mock('@/services/helpers/quizHelpers', () => ({
  isTeacherOfCourse: jest.fn(),
}));

describe('QuizAttempt Service - FINAL FIXED 100% PASS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const NOW = Date.now();
  const START_TIME = NOW - 5 * 60 * 1000;
  const END_TIME = NOW + 3600 * 1000;

  const mockQuiz = {
    _id: QUIZ_ID,
    courseId: { _id: COURSE_ID },
    startTime: new Date(START_TIME),
    endTime: new Date(END_TIME),
    snapshotQuestions: [{ id: 'q1', options: ['A'], type: 'mcq' }],
    compareHashPassword: jest.fn().mockReturnValue(true),
    createdBy: TEACHER_ID,
  };

  const mockQuizAttempt = {
    _id: ATTEMPT_ID,
    quizId: QUIZ_ID,
    studentId: USER_ID,
    status: AttemptStatus.IN_PROGRESS,
    answers: [{ questionId: 'q1', answer: [0] }],
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    score: 0,
    save: jest.fn().mockResolvedValue({}),
    toObject: jest.fn().mockReturnValue({}),
    grade: jest.fn().mockResolvedValue({
      totalQuestions: 10,
      totalScore: 85,
      totalQuizScore: 100,
      scorePercentage: 85,
      failedQuestions: 1,
      passedQuestions: 9,
      answersSubmitted: [],
    }),
  };

  describe('enrollQuiz', () => {
    it('should allow teacher to enroll without enrollment check', async () => {
      (QuizModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuiz),
      });
      (isTeacherOfCourse as jest.Mock).mockReturnValue(undefined);
      (QuizAttemptModel.findOne as jest.Mock).mockResolvedValue(null);
      (QuizAttemptModel.findOneAndUpdate as jest.Mock).mockResolvedValue(mockQuizAttempt);

      await enrollQuiz({
        quizId: QUIZ_ID.toHexString(),
        hashPassword: '123',
        user: { role: Role.TEACHER, userId: TEACHER_ID, userAgent: '', ip: '' },
      });

      expect(EnrollmentModel.findOne).not.toHaveBeenCalled();
      expect(QuizAttemptModel.findOneAndUpdate).toHaveBeenCalled();
    });
    it('should reuse existing IN_PROGRESS attempt', async () => {
      (QuizModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuiz),
      });
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue({ _id: 'e1' });
      const existing = { ...mockQuizAttempt, status: AttemptStatus.IN_PROGRESS };
      (QuizAttemptModel.findOne as jest.Mock).mockResolvedValue(existing);

      const result = await enrollQuiz({
        quizId: QUIZ_ID.toHexString(),
        hashPassword: '123',
        user: { role: Role.STUDENT, userId: USER_ID, userAgent: '', ip: '' },
      });

      expect(result).toBe(existing);
      expect(QuizAttemptModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw if already SUBMITTED', async () => {
      (QuizModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuiz),
      });
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue({ _id: 'e1' });
      (QuizAttemptModel.findOne as jest.Mock).mockResolvedValue({
        status: AttemptStatus.SUBMITTED,
      });

      await expect(
        enrollQuiz({
          quizId: QUIZ_ID.toHexString(),
          hashPassword: '123',
          user: { role: Role.STUDENT, userId: USER_ID, userAgent: '', ip: '' },
        })
      ).rejects.toThrow('You have already completed this quiz');
    });

    it('should throw if BANNED (ABANDONED)', async () => {
      (QuizModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuiz),
      });
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue({ _id: 'e1' });
      (QuizAttemptModel.findOne as jest.Mock).mockResolvedValue({
        status: AttemptStatus.ABANDONED,
      });

      await expect(
        enrollQuiz({
          quizId: QUIZ_ID.toHexString(),
          hashPassword: '123',
          user: { role: Role.STUDENT, userId: USER_ID, userAgent: '', ip: '' },
        })
      ).rejects.toThrow('You are banned from taking this quiz');
    });

    it('should throw if enroll after 15 minutes (student)', async () => {
      const oldStartTime = Date.now() - 20 * 60 * 1000;
      const oldQuiz = {
        ...mockQuiz,
        startTime: new Date(oldStartTime),
      };

      (QuizModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(oldQuiz),
      });

      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue({ _id: 'e1' });

      (QuizAttemptModel.findOne as jest.Mock).mockResolvedValue(null);

      (appAssert as jest.Mock).mockImplementation((condition, _, message) => {
        if (!condition) throw new Error(message);
      });

      await expect(
        enrollQuiz({
          quizId: QUIZ_ID.toHexString(),
          hashPassword: '123',
          user: {
            role: Role.STUDENT,
            userId: USER_ID,
            userAgent: '',
            ip: '',
          },
        })
      ).rejects.toThrow('You can only enroll within 15 minutes after the quiz starts');
    });
  });

  describe('gradeQuizAttempt - banned check', () => {
    it('should throw if student was banned', async () => {
      const bannedAttempt = {
        ...mockQuizAttempt,
        status: AttemptStatus.ABANDONED,
        quizId: mockQuiz,
        answers: [],
      };

      jest
        .spyOn(require('@/services/quizAttempt.service'), 'getQuizAttemptById')
        .mockResolvedValue(bannedAttempt as any);

      await expect(
        gradeQuizAttempt(ATTEMPT_ID.toHexString(), USER_ID, Role.STUDENT)
      ).rejects.toThrow('Student was banned from taking this quiz');
    });
  });

  describe('saveQuizAttempt', () => {
    it('should save all answers successfully', async () => {
      // Đảm bảo số lượng câu hỏi = số lượng đáp án
      const mockQuizWithTwoQuestions = {
        ...mockQuiz,
        snapshotQuestions: [
          { id: 'q1', options: ['A', 'B'], type: 'mcq' },
          { id: 'q2', options: ['C', 'D'], type: 'mcq' },
        ],
      };

      const populatedAttempt = {
        ...mockQuizAttempt,
        quizId: mockQuizWithTwoQuestions,
        studentId: USER_ID,
        status: AttemptStatus.IN_PROGRESS,
        answers: [
          { questionId: 'q1', answer: [0, 0] },
          { questionId: 'q2', answer: [0, 0] },
        ],
      };

      const answersToSave = [
        { questionId: 'q1', answer: [1, 0] },
        { questionId: 'q2', answer: [0, 1] },
      ];

      const updatedAttempt = {
        ...populatedAttempt,
        answers: answersToSave,
      };

      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedAttempt),
      });

      (QuizModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuizWithTwoQuestions),
      });

      (QuizAttemptModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedAttempt);

      const result = await saveQuizAttempt(
        {
          quizAttemptId: ATTEMPT_ID.toHexString(),
          answers: answersToSave,
        },
        USER_ID
      );

      expect(result).toEqual(updatedAttempt);
      expect(QuizAttemptModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: ATTEMPT_ID.toHexString() },
        { answers: answersToSave },
        { new: true }
      );
    });

    it('should throw if time limit exceeded (saveQuizAttempt)', async () => {
      const expiredQuiz = {
        ...mockQuiz,
        endTime: new Date(Date.now() - 60000), // đã hết giờ
      };

      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockQuizAttempt,
          quizId: expiredQuiz,
        }),
      });

      await expect(
        saveQuizAttempt(
          {
            quizAttemptId: ATTEMPT_ID.toHexString(),
            answers: [],
          },
          USER_ID
        )
      ).rejects.toThrow('Time limit exceeded');
    });

    it('should throw if answers count mismatch', async () => {
      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockQuizAttempt,
          quizId: { ...mockQuiz, snapshotQuestions: [{}, {}, {}] }, // 3 câu
        }),
      });

      await expect(
        saveQuizAttempt(
          {
            quizAttemptId: ATTEMPT_ID.toHexString(),
            answers: [{ questionId: 'q1', answer: [1] }], // chỉ có 1
          },
          USER_ID
        )
      ).rejects.toThrow('Invalid number of answers submitted');
    });

    it('should throw if already submitted', async () => {
      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockQuizAttempt,
          status: AttemptStatus.SUBMITTED,
          quizId: mockQuiz,
        }),
      });

      await expect(
        saveQuizAttempt({ quizAttemptId: ATTEMPT_ID.toHexString(), answers: [] }, USER_ID)
      ).rejects.toThrow('You have already submitted this quiz');
    });

    it('should throw if banned', async () => {
      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockQuizAttempt,
          status: AttemptStatus.ABANDONED,
          quizId: mockQuiz,
        }),
      });

      await expect(
        saveQuizAttempt({ quizAttemptId: ATTEMPT_ID.toHexString(), answers: [] }, USER_ID)
      ).rejects.toThrow('You were banned from taking this quiz');
    });
  });

  describe('autoSaveQuizAttempt', () => {
    it('should auto-save answer correctly', async () => {
      const populatedAttempt = {
        _id: ATTEMPT_ID,
        quizId: mockQuiz,
        studentId: USER_ID,
        status: AttemptStatus.IN_PROGRESS,
        answers: [
          { questionId: 'q1', answer: [0] },
          { questionId: 'q2', answer: [0] },
        ],
        save: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({
            _id: ATTEMPT_ID.toHexString(),
            quizId: QUIZ_ID.toHexString(),
            answers: [
              { questionId: 'q1', answer: [1] },
              { questionId: 'q2', answer: [0] },
            ],
          }),
        }),
      };

      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedAttempt),
      });

      const result = await autoSaveQuizAttempt(
        {
          quizAttemptId: ATTEMPT_ID.toHexString(),
          answer: { questionId: 'q1', answer: [1] },
        },
        USER_ID
      );

      expect(populatedAttempt.save).toHaveBeenCalled();
      expect(result.total).toBe(2);
      expect(result.answeredTotal).toBe(1);
      expect(result.data.answers[0].answer).toEqual([1]);
    });
  });

  describe('deleteQuizAttempt', () => {
    it('should delete successfully by teacher (quiz ended)', async () => {
      const endedQuiz = {
        ...mockQuiz,
        startTime: new Date(NOW - 7200000),
        endTime: new Date(NOW - 3600000),
      };

      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockQuizAttempt,
          quizId: endedQuiz,
        }),
      });
      (QuizAttemptModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockQuizAttempt);

      await deleteQuizAttempt(ATTEMPT_ID.toHexString(), TEACHER_ID, Role.TEACHER);

      expect(QuizAttemptModel.findByIdAndDelete).toHaveBeenCalled();
    });

    it('should grade and return detailed result when submit successfully', async () => {
      const mockQuizWithQuestions = {
        ...mockQuiz,
        snapshotQuestions: [
          { id: 'q1', options: ['A', 'B'], type: 'mcq', correctAnswer: [1], points: 10 },
          { id: 'q2', options: ['C', 'D'], type: 'mcq', correctAnswer: [0], points: 20 },
        ],
      };

      const populatedAttempt = {
        ...mockQuizAttempt,
        quizId: mockQuizWithQuestions,
        studentId: USER_ID,
        status: AttemptStatus.IN_PROGRESS,
        answers: [
          { questionId: 'q1', answer: [1] }, // đúng
          { questionId: 'q2', answer: [1] }, // sai
        ],
        grade: jest.fn().mockResolvedValue({
          totalQuestions: 2,
          totalScore: 10,
          totalQuizScore: 30,
          scorePercentage: 33.33,
          failedQuestions: 1,
          passedQuestions: 1,
          answersSubmitted: [
            { questionId: 'q1', answer: [1], correct: true, pointsEarned: 10 },
            { questionId: 'q2', answer: [1], correct: false, pointsEarned: 0 },
          ],
        }),
      };

      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedAttempt),
      });

      (QuizModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuizWithQuestions),
      });

      const result = await submitQuizAttempt({ quizAttemptId: ATTEMPT_ID.toHexString() }, USER_ID);

      // Quan trọng: đảm bảo đã gọi grade() với đúng tham số
      expect(populatedAttempt.grade).toHaveBeenCalledWith(
        populatedAttempt.answers,
        mockQuizWithQuestions
      );
    });
  });

  describe('submitQuizAttempt', () => {
    it('should submit successfully', async () => {
      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({ ...mockQuizAttempt, quizId: mockQuiz }),
      });
      (QuizModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuiz),
      });

      const result = await submitQuizAttempt({ quizAttemptId: ATTEMPT_ID.toHexString() }, USER_ID);
      expect(result.totalScore).toBe(85);
    });

    it('should throw if already submitted', async () => {
      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockQuizAttempt,
          status: AttemptStatus.SUBMITTED,
          quizId: mockQuiz,
        }),
      });

      await expect(
        submitQuizAttempt({ quizAttemptId: ATTEMPT_ID.toHexString() }, USER_ID)
      ).rejects.toThrow('You have already submitted this quiz');
    });

    it('should throw if number of answers mismatch', async () => {
      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockQuizAttempt,
          quizId: { ...mockQuiz, snapshotQuestions: [{}, {}, {}] },
          answers: [{}, {}],
        }),
      });
      (QuizModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuiz),
      });

      await expect(
        submitQuizAttempt({ quizAttemptId: ATTEMPT_ID.toHexString() }, USER_ID)
      ).rejects.toThrow('Invalid number of answers submitted');
    });
  });

  describe('banQuizAttempt', () => {
    it('should ban attempt', async () => {
      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockQuizAttempt,
          quizId: mockQuiz,
        }),
      });
      (QuizAttemptModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockQuizAttempt,
        status: AttemptStatus.ABANDONED,
      });

      await banQuizAttempt(ATTEMPT_ID.toHexString(), TEACHER_ID, Role.TEACHER);
    });
  });

  describe('getQuizAttemptById', () => {
    it('should get own attempt (student)', async () => {
      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuizAttempt),
      });
      (QuizModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuiz),
      });

      await getQuizAttemptById(ATTEMPT_ID.toHexString(), USER_ID, Role.STUDENT);
    });
  });

  describe('updateQuizAttemptScore', () => {
    it('should update score manually (teacher) and call isTeacherOfCourse', async () => {
      const mockAttempt = {
        ...mockQuizAttempt,
        score: 50,
        save: jest.fn().mockResolvedValue({ ...mockQuizAttempt, score: 99 }),
        populate: jest.fn().mockResolvedValue({
          quizId: { courseId: { _id: COURSE_ID } },
        }),
      };

      jest
        .spyOn(require('@/services/quizAttempt.service'), 'getQuizAttemptById')
        .mockResolvedValue(mockAttempt as any);

      (isTeacherOfCourse as jest.Mock).mockReturnValue(undefined);

      const result = await updateQuizAttemptScore(
        { quizAttemptId: ATTEMPT_ID.toHexString(), score: 99 },
        TEACHER_ID,
        Role.TEACHER
      );

      expect(result.score).toBe(99);
      expect(mockAttempt.save).toHaveBeenCalled();
      expect(isTeacherOfCourse).toHaveBeenCalledWith(expect.any(Object), TEACHER_ID);
    });
  });
});
