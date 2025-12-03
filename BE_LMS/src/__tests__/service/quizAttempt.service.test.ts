// src/__tests__/service/quizAttempt.service.test.ts

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

// ObjectId hợp lệ
const USER_ID = new mongoose.Types.ObjectId();
const TEACHER_ID = new mongoose.Types.ObjectId();
const QUIZ_ID = new mongoose.Types.ObjectId();
const ATTEMPT_ID = new mongoose.Types.ObjectId();
const COURSE_ID = new mongoose.Types.ObjectId();

// Mock model + helper
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

// Mock appAssert để throw đúng
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

  // Thời gian cố định để kiểm soát logic
  const NOW = Date.now();
  const START_TIME = NOW - 5 * 60 * 1000; // 5 phút trước
  const END_TIME = NOW + 3600 * 1000; // 1 giờ sau

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
      expect(QuizAttemptModel.findOneAndUpdate).not.toHaveBeenCalled(); // không tạo mới
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
      // Quiz bắt đầu 20 phút trước → đã quá 15 phút
      const oldStartTime = Date.now() - 20 * 60 * 1000;
      const oldQuiz = {
        ...mockQuiz,
        startTime: new Date(oldStartTime),
      };

      (QuizModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(oldQuiz),
      });

      // Quan trọng: học sinh này ĐÃ enroll rồi (hoặc không cần check) → để service đi đến bước check 15 phút
      (EnrollmentModel.findOne as jest.Mock).mockResolvedValue({ _id: 'e1' });

      // Nếu không có attempt cũ → service sẽ cố tạo mới → và throw ở dòng:
      // appAssert(new Date().getTime() <= quiz.startTime.getTime() + 15 * 60 * 1000, ...)
      (QuizAttemptModel.findOne as jest.Mock).mockResolvedValue(null);

      // Đảm bảo appAssert sẽ throw Error(message) như trong code thật
      (appAssert as jest.Mock).mockImplementation((condition, _, message) => {
        if (!condition) throw new Error(message);
      });

      await expect(
        enrollQuiz({
          quizId: QUIZ_ID.toHexString(),
          hashPassword: '123',
          user: {
            role: Role.STUDENT,
            userId: USER_ID, // phải là string
            userAgent: '',
            ip: '',
          },
        })
      ).rejects.toThrow('You can only enroll within 15 minutes after the quiz starts');
    });
  });

  describe('gradeQuizAttempt - banned check', () => {
    it('should throw if student was banned', async () => {
      // Dùng mock trực tiếp
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

  describe('autoSaveQuizAttempt', () => {
    it('should auto-save answer correctly', async () => {
      // Mock document sau khi populate (có quizId đầy đủ)
      const populatedAttempt = {
        _id: ATTEMPT_ID,
        quizId: mockQuiz, // quan trọng: có endTime, snapshotQuestions...
        studentId: USER_ID,
        status: AttemptStatus.IN_PROGRESS,
        answers: [
          { questionId: 'q1', answer: [0] }, // trước khi save: chưa chọn
          { questionId: 'q2', answer: [0] },
        ],
        // save() phải trả về một "document" có method toObject()
        save: jest.fn().mockResolvedValue({
          toObject: jest.fn().mockReturnValue({
            _id: ATTEMPT_ID.toHexString(),
            quizId: QUIZ_ID.toHexString(),
            answers: [
              { questionId: 'q1', answer: [1] }, // sau khi save: đã chọn đáp án 1
              { questionId: 'q2', answer: [0] },
            ],
          }),
        }),
      };

      // findById → chain populate → trả về populatedAttempt
      (QuizAttemptModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(populatedAttempt),
      });

      const result = await autoSaveQuizAttempt(
        {
          quizAttemptId: ATTEMPT_ID.toHexString(),
          answer: { questionId: 'q1', answer: [1] }, // chọn đáp án đầu tiên
        },
        USER_ID
      );

      // Kiểm tra kết quả
      expect(populatedAttempt.save).toHaveBeenCalled(); // đã lưu
      expect(result.total).toBe(2); // tổng câu hỏi
      expect(result.answeredTotal).toBe(1); // đã trả lời 1 câu (có giá trị 1)
      expect(result.data.answers[0].answer).toEqual([1]); // câu q1 đã được cập nhật
    });
  });

  describe('deleteQuizAttempt', () => {
    it('should delete successfully by teacher (quiz ended)', async () => {
      const endedQuiz = {
        ...mockQuiz,
        startTime: new Date(NOW - 7200000),
        endTime: new Date(NOW - 3600000), // đã kết thúc
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
  });

  // Các test khác giữ nguyên (đã pass)
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
          quizId: { ...mockQuiz, snapshotQuestions: [{}, {}, {}] }, // 3 câu
          answers: [{}, {}], // chỉ có 2
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
      // DÙNG MOCK TRỰC TIẾP, KHÔNG DÙNG SPY!
      const mockAttempt = {
        ...mockQuizAttempt,
        score: 50,
        save: jest.fn().mockResolvedValue({ ...mockQuizAttempt, score: 99 }),
        populate: jest.fn().mockResolvedValue({
          quizId: { courseId: { _id: COURSE_ID } },
        }),
      };

      // Mock getQuizAttemptById trả về mockAttempt
      jest
        .spyOn(require('@/services/quizAttempt.service'), 'getQuizAttemptById')
        .mockResolvedValue(mockAttempt as any);

      // Mock isTeacherOfCourse
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
