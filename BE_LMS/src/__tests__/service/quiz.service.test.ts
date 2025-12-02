import mongoose from 'mongoose';
import { Role } from '@/types';
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getStatisticByQuizId,
  getQuizById,
  getQuizAttemptsByQuizId,
} from '@/services/quiz.service';
import type { SnapshotQuestion } from '@/types/quiz.type';

jest.mock('@/models', () => ({
  CourseModel: { findById: jest.fn() },
  QuizModel: { create: jest.fn(), findById: jest.fn() },
  EnrollmentModel: { find: jest.fn() },
  QuizAttemptModel: { find: jest.fn(), aggregate: jest.fn() },
}));

jest.mock('@/services/helpers/quizHelpers', () => ({
  calculateMedian: jest.fn(),
  calculateRank: jest.fn(),
  findMinMax: jest.fn(),
  standardDeviation: jest.fn(),
  isTeacherOfCourse: jest.fn(),
}));

jest.mock('@/services/quizQuestion.service', () => ({
  checkProperQuestionType: jest.fn(),
}));

jest.mock('@/utils/uploadFile', () => ({
  getKeyFromPublicUrl: jest.fn(),
  removeFiles: jest.fn(),
}));

import { CourseModel, QuizModel, EnrollmentModel, QuizAttemptModel } from '@/models';
import {
  calculateMedian,
  calculateRank,
  findMinMax,
  standardDeviation,
  isTeacherOfCourse,
} from '@/services/helpers/quizHelpers';
import { checkProperQuestionType } from '@/services/quizQuestion.service';
import { getKeyFromPublicUrl, removeFiles } from '@/utils/uploadFile';

describe('Quiz Service Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateQuiz ', () => {
    const baseData = {
      courseId: 'c1',
      title: 'Quiz Title',
      description: '',
      startTime: new Date(Date.now() + 1000),
      endTime: new Date(Date.now() + 2000),
      shuffleQuestions: false,
      isPublished: false,
      snapshotQuestions: [] as SnapshotQuestion[],
    };

    it('calls checkProperQuestionType when snapshotQuestions provided', async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValueOnce({ _id: 'c1' });
      (QuizModel.create as jest.Mock).mockResolvedValueOnce({ _id: 'q1' });

      const data = {
        ...baseData,
        snapshotQuestions: [
          {
            id: 'q1',
            text: 'Q text',
            type: 'mcq' as any,
            options: ['a', 'b'],
            correctOptions: [0],
            points: 1,
            isExternal: false,
            isNewQuestion: true,
            isDeleted: false,
            isDirty: false,
          },
        ],
      };

      await createQuiz(data as any, 'u1' as any, Role.ADMIN);
      expect(checkProperQuestionType).toHaveBeenCalled();
      expect(QuizModel.create).toHaveBeenCalled();
    });

    it('throws when startTime >= endTime', async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValueOnce({ _id: 'c1' });
      const now = Date.now();
      const base = {
        courseId: 'c1',
        title: 'Quiz Title',
        description: '',
        startTime: new Date(now + 2000),
        endTime: new Date(now + 1000), // end earlier than start
        shuffleQuestions: false,
        isPublished: false,
        snapshotQuestions: [],
      };

      await expect(createQuiz(base as any, 'u1' as any, Role.ADMIN)).rejects.toThrow(
        /Start time must be before end time/
      );
      expect(QuizModel.create).not.toHaveBeenCalled();
    });

    it('throws when course not found', async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValueOnce(null);

      await expect(createQuiz(baseData as any, 'u1' as any, Role.ADMIN)).rejects.toThrow(
        /Course not found/
      );
      expect(QuizModel.create).not.toHaveBeenCalled();
    });

    it('calls isTeacherOfCourse when role is TEACHER', async () => {
      (CourseModel.findById as jest.Mock).mockResolvedValueOnce({ _id: 'c1' });
      (QuizModel.create as jest.Mock).mockResolvedValueOnce({ _id: 'q1' });

      await createQuiz(baseData as any, 'u1' as any, Role.TEACHER);
      expect(isTeacherOfCourse).toHaveBeenCalledWith({ _id: 'c1' }, 'u1' as any);
    });
  });

  describe('UpdateQuiz', () => {
    it('throws when quiz not found', async () => {
      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(null),
      });

      await expect(
        updateQuiz(
          {
            quizId: 'missing',
            title: undefined,
            description: undefined,
            startTime: undefined,
            endTime: undefined,
            shuffleQuestions: undefined,
            isPublished: undefined,
            snapshotQuestions: [],
            isChangePassword: false,
          },
          'u1' as any,
          Role.TEACHER
        )
      ).rejects.toThrow(/Quiz not found/);
    });

    it('skips updating a question when id not present in snapshotQuestions map', async () => {
      const now = Date.now();
      const quizDoc: any = {
        _id: 'q1',
        courseId: { _id: 'c1' },
        startTime: new Date(now - 20000),
        endTime: new Date(now - 10000),
        snapshotQuestions: [],
        save: jest.fn().mockResolvedValue({}),
      };

      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(quizDoc),
      });

      const updatedQuestion = {
        id: 'non-existing',
        text: 'no-op',
        isDirty: true,
        isNewQuestion: false,
        isDeleted: false,
        images: [],
        type: 'mcq' as any,
        options: [],
        correctOptions: [0],
        points: 1,
        isExternal: false,
      };

      await updateQuiz(
        {
          quizId: 'q1',
          title: undefined,
          description: undefined,
          startTime: undefined,
          endTime: undefined,
          shuffleQuestions: undefined,
          isPublished: undefined,
          snapshotQuestions: [updatedQuestion],
          isChangePassword: false,
        },
        'u1' as any,
        Role.TEACHER
      );

      // since id not found, no snapshot question was updated/added
      expect(quizDoc.save).toHaveBeenCalled();
      expect(quizDoc.snapshotQuestions.length).toBe(0);
    });

    it('calls checkProperQuestionType for both updated and added questions', async () => {
      const now = Date.now();
      const quizDoc: any = {
        _id: 'q2',
        courseId: { _id: 'c1' },
        startTime: new Date(now - 200000),
        endTime: new Date(now - 100000),
        snapshotQuestions: [
          {
            id: 'existing-q',
            text: 'existing',
            images: [],
            isNewQuestion: false,
            isDeleted: false,
            isDirty: false,
          },
        ],
        save: jest.fn().mockResolvedValue({}),
      };

      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(quizDoc),
      });

      const updatedQuestion = {
        id: 'existing-q',
        text: 'existing-upd',
        isDirty: true,
        isNewQuestion: false,
        isDeleted: false,
        images: [],
        type: 'mcq' as any,
        options: [],
        correctOptions: [0],
        points: 1,
        isExternal: false,
      };

      const addQuestion = {
        id: 'new-q',
        text: 'New question',
        isDirty: false,
        isNewQuestion: true,
        isDeleted: false,
        type: 'mcq' as any,
        options: ['a'],
        correctOptions: [0],
        images: [],
        points: 1,
        isExternal: false,
      };

      (getKeyFromPublicUrl as jest.Mock).mockReturnValue('old-key-for-safety');

      await updateQuiz(
        {
          quizId: 'q2',
          title: undefined,
          description: undefined,
          startTime: undefined,
          endTime: undefined,
          shuffleQuestions: undefined,
          isPublished: undefined,
          snapshotQuestions: [updatedQuestion, addQuestion],
          isChangePassword: false,
        },
        'u1' as any,
        Role.TEACHER
      );

      // It should call checkProperQuestionType twice (for updatedQuestion and addQuestion)
      expect(checkProperQuestionType).toHaveBeenCalledTimes(2);
      expect(quizDoc.save).toHaveBeenCalled();
      // new question added
      expect(quizDoc.snapshotQuestions.some((q: any) => q.id === 'new-q')).toBeTruthy();
    });

    it('does NOT call getKeyFromPublicUrl/removeFiles when deleted images are fromDB', async () => {
      const now = Date.now();
      const quizDoc: any = {
        _id: 'q3',
        courseId: { _id: 'c1' },
        startTime: new Date(now - 200000),
        endTime: new Date(now - 100000),
        snapshotQuestions: [
          {
            id: 'q-old-db',
            text: 'old-db',
            images: [{ url: 'https://host/old-db.png', fromDB: true }],
            isNewQuestion: false,
            isDeleted: false,
            isDirty: false,
          },
        ],
        generateHashPassword: jest.fn().mockReturnValue('hash'),
        save: jest.fn().mockResolvedValue({}),
      };

      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(quizDoc),
      });

      const updatedQuestion = {
        id: 'q-old-db',
        text: 'old-upd',
        isDirty: true,
        isNewQuestion: false,
        isDeleted: false,
        type: 'mcq' as any,
        options: [] as string[],
        correctOptions: [0],
        images: [], // removed old image, but fromDB => should not remove
        points: 1,
        isExternal: false,
      };

      await updateQuiz(
        {
          quizId: 'q3',
          title: undefined,
          description: undefined,
          startTime: undefined,
          endTime: undefined,
          shuffleQuestions: undefined,
          isPublished: undefined,
          snapshotQuestions: [updatedQuestion],
          isChangePassword: false,
        },
        'u1' as any,
        Role.TEACHER
      );

      expect(getKeyFromPublicUrl).not.toHaveBeenCalled();
      expect(removeFiles).not.toHaveBeenCalled();
      expect(quizDoc.save).toHaveBeenCalled();
    });

    it('throws when quiz is ongoing and disallowed changes are attempted', async () => {
      const now = Date.now();
      const quizDoc: any = {
        _id: 'ongoing-q',
        courseId: { _id: 'c1' },
        startTime: new Date(now - 1000),
        endTime: new Date(now + 10000),
        snapshotQuestions: [],
        save: jest.fn().mockResolvedValue({}),
      };

      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(quizDoc),
      });

      await expect(
        updateQuiz(
          {
            quizId: 'ongoing-q',
            title: undefined,
            description: undefined,
            startTime: new Date(now + 1000), // trying to change startTime
            endTime: undefined,
            shuffleQuestions: true, // trying to change shuffle
            isPublished: undefined,
            snapshotQuestions: [
              {
                id: 'x',
                isNewQuestion: true,
                isDeleted: false,
                isDirty: false,
                text: 'new',
                type: 'mcq' as any,
                options: ['a'],
                correctOptions: [0],
                points: 1,
                isExternal: false,
                images: [],
              },
            ],
            isChangePassword: false,
          },
          'u1' as any,
          Role.TEACHER
        )
      ).rejects.toThrow(/You can just update title, description, endTime while quiz is on going/);
    });

    it('throws when updating endTime of an ongoing quiz to a time < now', async () => {
      const now = Date.now();
      const quizDoc: any = {
        _id: 'ongoing-endfail',
        courseId: { _id: 'c1' },
        startTime: new Date(now - 1000),
        endTime: new Date(now + 100000),
        snapshotQuestions: [],
        save: jest.fn().mockResolvedValue({}),
      };

      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(quizDoc),
      });

      await expect(
        updateQuiz(
          {
            quizId: 'ongoing-endfail',
            title: undefined,
            description: undefined,
            startTime: undefined,
            endTime: new Date(now - 1000), // set end < now
            shuffleQuestions: undefined,
            isPublished: undefined,
            snapshotQuestions: [],
            isChangePassword: false,
          },
          'u1' as any,
          Role.TEACHER
        )
      ).rejects.toThrow(/You can not update endTime less than current time/);
    });
  });

  describe('DeleteQuiz', () => {
    it('deletes quiz successfully when not ongoing', async () => {
      const now = Date.now();
      const quizDoc: any = {
        _id: 'q1',
        courseId: { _id: 'c1' },
        startTime: new Date(now - 200000),
        endTime: new Date(now - 100000),
        save: jest.fn().mockResolvedValue({ deletedAt: new Date(), deletedBy: 'u1' }),
      };
      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(quizDoc),
      });

      const res = await deleteQuiz({ quizId: 'q1', userId: 'u1' as any, role: Role.TEACHER });

      expect(quizDoc.save).toHaveBeenCalled();
      expect(res).toHaveProperty('deletedAt');
      expect(res).toHaveProperty('deletedBy');
    });

    it('throws when quiz is on going', async () => {
      const now = Date.now();
      const quizDoc: any = {
        _id: 'q-ongoing-delete',
        courseId: { _id: 'c1' },
        startTime: new Date(now - 1000),
        endTime: new Date(now + 100000),
        save: jest.fn().mockResolvedValue({}),
      };

      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockResolvedValueOnce(quizDoc),
      });

      await expect(
        deleteQuiz({ quizId: 'q-ongoing-delete', userId: 'u1' as any, role: Role.TEACHER })
      ).rejects.toThrow(/Cannot delete a quiz that is on going/);
    });
  });

  describe('getStatisticByQuizId', () => {
    it('calls helper functions and returns computed fields', async () => {
      const quizDoc: any = {
        _id: 'q1',
        courseId: { _id: 'c1' },
        snapshotQuestions: [{ id: 'a' }],
      };

      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(quizDoc),
      } as any);

      (EnrollmentModel.find as jest.Mock).mockReturnValueOnce({
        countDocuments: jest.fn().mockResolvedValue(5),
      } as any);

      const attempts = [
        {
          _id: 'a1',
          score: 8,
        },
      ];

      (QuizAttemptModel.find as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(attempts),
      } as any);

      (calculateMedian as jest.Mock).mockReturnValueOnce(8);
      (findMinMax as jest.Mock).mockReturnValueOnce({ min: 8, max: 8 });
      (standardDeviation as jest.Mock).mockReturnValueOnce(0);
      (calculateRank as jest.Mock).mockReturnValueOnce([{ id: 's1', score: 8 }]);

      const res = await getStatisticByQuizId('q1', 'u1' as any, Role.TEACHER);

      expect(res.submittedCount).toBe(1);
      expect(res.averageScore).toBe(8);
      expect(res.medianScore).toBe(8);
      expect(res.students.length).toBe(1);
    });

    it('calls isTeacherOfCourse when role is TEACHER', async () => {
      const quizDoc: any = {
        _id: 'q-stat',
        courseId: { _id: 'c1' },
        snapshotQuestions: [{ id: 'a' }],
      };

      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(quizDoc),
      } as any);
      (EnrollmentModel.find as jest.Mock).mockReturnValueOnce({
        countDocuments: jest.fn().mockResolvedValue(0),
      } as any);
      (QuizAttemptModel.find as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce([]),
      } as any);

      (calculateMedian as jest.Mock).mockReturnValueOnce(0);
      (findMinMax as jest.Mock).mockReturnValueOnce({ min: 0, max: 0 });
      (standardDeviation as jest.Mock).mockReturnValueOnce(0);
      (calculateRank as jest.Mock).mockReturnValueOnce([]);

      await getStatisticByQuizId('q-stat', 'u1' as any, Role.TEACHER);
      expect(isTeacherOfCourse).toHaveBeenCalledWith(quizDoc.courseId, 'u1' as any);
    });

    it('does NOT call isTeacherOfCourse when role is STUDENT', async () => {
      const quizDoc: any = {
        _id: 'q-stat-2',
        courseId: { _id: 'c1' },
        snapshotQuestions: [{ id: 'a' }],
      };

      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(quizDoc),
      } as any);
      (EnrollmentModel.find as jest.Mock).mockReturnValueOnce({
        countDocuments: jest.fn().mockResolvedValue(0),
      } as any);
      (QuizAttemptModel.find as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce([]),
      } as any);

      (calculateMedian as jest.Mock).mockReturnValueOnce(0);
      (findMinMax as jest.Mock).mockReturnValueOnce({ min: 0, max: 0 });
      (standardDeviation as jest.Mock).mockReturnValueOnce(0);
      (calculateRank as jest.Mock).mockReturnValueOnce([]);

      await getStatisticByQuizId('q-stat-2', 'u1' as any, Role.STUDENT);
      expect(isTeacherOfCourse).not.toHaveBeenCalled();
    });
  });

  describe('getQuizById ', () => {
    it('does NOT call isTeacherOfCourse when role is not TEACHER', async () => {
      const quizDoc = { _id: 'q1', courseId: { _id: 'c1' } };
      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(quizDoc),
      } as any);

      const res = await getQuizById('q1', 'u1' as any, Role.STUDENT);
      expect(res).toEqual(quizDoc);
      expect(isTeacherOfCourse).not.toHaveBeenCalled();
    });

    it('throws when quiz not found', async () => {
      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(null),
      } as any);

      await expect(getQuizById('missing', 'u1' as any, Role.TEACHER)).rejects.toThrow(
        /Quiz not found/
      );
    });
  });

  describe('getQuizAttemptsByQuizId', () => {
    it('respects attemptStatus in pipeline and counts string "1" answers as completed', async () => {
      const quizDoc = {
        _id: '507f1f77bcf86cd799439011',
        courseId: { _id: 'c1' },
        snapshotQuestions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }],
      };
      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(quizDoc),
      } as any);

      const aggReturned = [
        {
          _id: 'a1',
          quizId: '507f1f77bcf86cd799439011',
          status: 'graded',
          score: 7,
          createdAt: new Date(),
          student: { _id: 's1', username: 'u1', email: '', fullname: '' },
          answers: [{ answer: ['1'] }, { answer: [0] }, { answer: [1] }],
        },
      ];
      (QuizAttemptModel.aggregate as jest.Mock).mockResolvedValueOnce(aggReturned);

      const res = await getQuizAttemptsByQuizId({
        quizId: '507f1f77bcf86cd799439011',
        attemptStatus: 'graded' as any,
        page: 1,
        limit: 10,
        sortOrder: 'desc',
        search: undefined,
      });

      expect(res.length).toBe(1);
      expect(res[0].totalQuestions).toBe(3);
      expect(res[0].completedQuestions).toBe(2);

      const calls = (QuizAttemptModel.aggregate as jest.Mock).mock.calls;
      const pipeline = calls[0][0] as any[];
      expect(pipeline[0].$match.status).toBe('graded');
    });

    it('throws when quiz not found for attempts', async () => {
      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(null),
      } as any);

      await expect(
        getQuizAttemptsByQuizId({
          quizId: 'noquiz',
          attemptStatus: undefined,
          page: 1,
          limit: 10,
          sortOrder: 'desc',
          search: undefined,
        })
      ).rejects.toThrow(/Quiz not found/);
    });

    it('adds a regex search stage into pipeline when search provided', async () => {
      const quizDoc = {
        _id: '507f1f77bcf86cd799439012',
        courseId: { _id: 'c1' },
        snapshotQuestions: [{ id: 'q1' }],
      };
      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(quizDoc),
      } as any);

      (QuizAttemptModel.aggregate as jest.Mock).mockResolvedValueOnce([]);

      await getQuizAttemptsByQuizId({
        quizId: '507f1f77bcf86cd799439012',
        attemptStatus: undefined,
        page: 1,
        limit: 10,
        sortOrder: 'desc',
        search: 'search-me',
      });

      const calls = (QuizAttemptModel.aggregate as jest.Mock).mock.calls;
      const pipeline = calls[0][0] as any[];
      // The search stage should exist somewhere in pipeline
      const searchStage = pipeline.find((p) => p.$match && p.$match.$or);
      expect(searchStage).toBeTruthy();
      // It should have regex for the search string
      const orConditions = searchStage.$match.$or;
      expect(Array.isArray(orConditions)).toBeTruthy();
    });

    it('does not add status to $match when attemptStatus is undefined', async () => {
      const quizDoc = {
        _id: '507f1f77bcf86cd799439013',
        courseId: { _id: 'c1' },
        snapshotQuestions: [{ id: 'q1' }],
      };
      (QuizModel.findById as jest.Mock).mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValueOnce(quizDoc),
      } as any);
      (QuizAttemptModel.aggregate as jest.Mock).mockResolvedValueOnce([]);

      await getQuizAttemptsByQuizId({
        quizId: '507f1f77bcf86cd799439013',
        attemptStatus: undefined,
        page: 1,
        limit: 10,
        sortOrder: 'desc',
        search: undefined,
      });

      const calls = (QuizAttemptModel.aggregate as jest.Mock).mock.calls;
      const pipeline = calls[0][0] as any[];
      expect(pipeline[0].$match.status).toBeUndefined();
    });
  });
});
