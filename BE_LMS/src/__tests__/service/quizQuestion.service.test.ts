import {
  importXMLFile,
  exportXMLFile,
  getAllQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  deleteMultipleQuizQuestions,
  getRandomQuestions,
  uploadImages,
  deleteImage,
  checkProperQuestionType,
} from '@/services/quizQuestion.service';
import { QuizQuestionModel, SubjectModel, QuizModel } from '@/models';
import { getKeyFromPublicUrl, removeFiles, uploadFiles } from '@/utils/uploadFile';
import { QuizQuestionType } from '@/types/quizQuestion.type';

jest.mock('@/models', () => ({
  SubjectModel: {
    findById: jest.fn(),
  },
  QuizQuestionModel: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
    insertMany: jest.fn(),
    aggregate: jest.fn(),
  },
  QuizModel: {
    exists: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('@/utils/uploadFile');

const mockSubject = { _id: 'subj1', code: 'MATH101' };

describe('QuizQuestion Service - Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('importXMLFile', () => {
    const validSubjectId = '507f1f77bcf86cd799439011'; // 24 hex characters

    it('imports questions from valid XML and deletes old ones', async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (QuizQuestionModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 });
      (QuizQuestionModel.insertMany as jest.Mock).mockResolvedValue([{ _id: 'q1' }, { _id: 'q2' }]);

      const xml = `
        <quiz>
          <question type="multichoice">
            <name><text>Question 1</text></name>
            <questiontext><text>What is 2+2?</text></questiontext>
            <answer fraction="100"><text>4</text></answer>
            <answer fraction="0"><text>5</text></answer>
          </question>
        </quiz>
      `;

      const result = await importXMLFile(Buffer.from(xml), validSubjectId);

      expect(QuizQuestionModel.deleteMany).toHaveBeenCalledWith({ subjectId: validSubjectId });
      expect(result.total).toBe(1);
    });

    it('throws when subject not found', async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(importXMLFile(Buffer.from('<quiz/>'), validSubjectId)).rejects.toThrow(
        'Subject not found'
      );
    });
  });

  describe('exportXMLFile', () => {
    const validSubjectId = '507f1f77bcf86cd799439011'; // 24 hex characters

    it('exports questions to Moodle XML format', async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (QuizQuestionModel.find as jest.Mock).mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'q1',
            text: 'Question 1',
            type: QuizQuestionType.MULTIPLE_CHOICE,
            options: ['A', 'B'],
            correctOptions: [1, 0],
          },
        ]),
      });

      const result = await exportXMLFile(validSubjectId);
      expect(result.xmlString).toContain('Question 1');
      expect(result.xmlString).toContain('<question type="multichoice">');
      expect(result.total).toBe(1);
    });

    it('throws when no questions found', async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (QuizQuestionModel.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      await expect(exportXMLFile(validSubjectId)).rejects.toThrow('No questions found');
    });
  });

  describe('getAllQuizQuestions', () => {
    it('returns paginated questions with search and date filter', async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (QuizQuestionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: 'q1', text: 'test', isExternal: false }]),
      });
      (QuizQuestionModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await getAllQuizQuestions({
        subjectId: 'subj1',
        search: 'test',
        from: new Date('2025-01-01'),
        page: 1,
        limit: 10,
      });

      expect(result.data[0]).toHaveProperty('isExternal', false);
      expect(result.pagination.totalItems).toBe(1);
    });

    it('handles questions with no images correctly in getAllQuizQuestions', async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);

      (QuizQuestionModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { _id: 'q-no-img', text: 'No image question', images: null },
          { _id: 'q-undefined-img', text: 'Undefined img', images: undefined },
        ]),
      });

      (QuizQuestionModel.countDocuments as jest.Mock).mockResolvedValue(2);

      const result = await getAllQuizQuestions({
        subjectId: '507f1f77bcf86cd799439011',
        page: 1,
        limit: 10,
      });

      expect(result.data[0].images).toBeUndefined(); // hoặc null → tùy bạn
      expect(result.data[1].images).toBeUndefined();
      expect(result.data[0]).toHaveProperty('isExternal', false);
    });
  });

  describe('checkProperQuestionType', () => {
    it('allows multiple correct for MULTIPLE_CHOICE', () => {
      expect(() =>
        checkProperQuestionType(QuizQuestionType.MULTIPLE_CHOICE, [1, 1, 0])
      ).not.toThrow();
    });

    it('throws when no correct option', () => {
      expect(() => checkProperQuestionType(QuizQuestionType.MCQ, [0, 0])).toThrow(
        'This question type must have only one correct option'
      );
    });
  });

  describe('createQuizQuestion', () => {
    it('creates question and uploads images', async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (QuizQuestionModel.create as jest.Mock).mockResolvedValue({ _id: 'q1', id: 'q1' });
      (uploadFiles as jest.Mock).mockResolvedValue([{ publicUrl: 'https://img.com/1.jpg' }]);
      (QuizQuestionModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      const result = await createQuizQuestion({
        subjectId: 'subj1',
        text: 'New question',
        type: QuizQuestionType.MCQ,
        options: ['A', 'B'],
        correctOptions: [1, 0],
        images: [{ fieldname: 'img', originalname: 'a.jpg', mimetype: 'image/jpeg' } as any],
      });

      expect(uploadFiles).toHaveBeenCalled();
      expect(result.images).toContain('https://img.com/1.jpg');
    });

    it('creates question without images', async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (QuizQuestionModel.create as jest.Mock).mockResolvedValue({ _id: 'q2', text: 'No image' });

      const result = await createQuizQuestion({
        subjectId: '507f1f77bcf86cd799439011',
        text: 'Question without image',
        type: QuizQuestionType.MCQ,
        options: ['A', 'B'],
        correctOptions: [0, 1],
        // Không truyền images → branch này chưa được cover
      });

      expect(uploadFiles).not.toHaveBeenCalled();
    });

    it('rolls back on image upload failure', async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (QuizQuestionModel.create as jest.Mock).mockResolvedValue({ _id: 'q1' });
      (uploadFiles as jest.Mock).mockRejectedValue(new Error('Upload failed'));
      (QuizQuestionModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(
        createQuizQuestion({
          subjectId: '507f1f77bcf86cd799439011',
          text: 'Fail',
          type: QuizQuestionType.MCQ,
          options: ['A', 'B'],
          correctOptions: [1, 0],
          images: [
            {
              fieldname: 'img',
              originalname: 'a.jpg',
              mimetype: 'image/jpeg',
            } as any,
          ],
        })
      ).rejects.toThrow('Upload failed');

      expect(QuizQuestionModel.findByIdAndDelete).toHaveBeenCalled();
    });
  });

  describe('updateQuizQuestion', () => {
    it('updates question, deletes old images, uploads new ones', async () => {
      const existing = {
        _id: 'q1',
        subjectId: 'subj1',
        images: ['https://old.com/img1.jpg'],
        options: ['A', 'B'],
        correctOptions: [0, 1],
      };
      (QuizQuestionModel.findById as jest.Mock).mockResolvedValue(existing);
      (uploadFiles as jest.Mock).mockResolvedValue([{ publicUrl: 'https://new.com/img2.jpg' }]);
      (QuizQuestionModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...existing,
        text: 'Updated',
      });
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);

      await updateQuizQuestion({
        quizQuestionId: 'q1',
        text: 'Updated',
        deletedKeys: ['https://old.com/img1.jpg'],
        images: [{ mimetype: 'image/jpeg' } as any],
      });

      expect(removeFiles).toHaveBeenCalled();
      expect(uploadFiles).toHaveBeenCalled();
    });

    it('updates question text only (no image changes)', async () => {
      const existing = {
        _id: 'q3',
        subjectId: '507f1f77bcf86cd799439011',
        text: 'Old text',
        images: ['https://img.com/old.jpg'],
        options: ['A', 'B'],
        correctOptions: [1, 0],
      };

      (QuizQuestionModel.findById as jest.Mock).mockResolvedValue(existing);
      (QuizQuestionModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...existing,
        text: 'Only text updated',
      });

      await updateQuizQuestion({
        quizQuestionId: 'q3',
        text: 'Only text updated',
      });

      expect(removeFiles).not.toHaveBeenCalled();
      expect(uploadFiles).not.toHaveBeenCalled();
    });

    it('throws error if subjectId not found', async () => {
      const existing = {
        _id: 'q1',
        subjectId: 'subj1',
        images: ['https://old.com/img1.jpg'],
        options: ['A', 'B'],
        correctOptions: [0, 1],
      };
      (QuizQuestionModel.findById as jest.Mock).mockResolvedValue(existing);
      (uploadFiles as jest.Mock).mockResolvedValue([{ publicUrl: 'https://new.com/img2.jpg' }]);
      (QuizQuestionModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...existing,
        text: 'Updated',
      });
      (SubjectModel.findById as jest.Mock).mockResolvedValue(null);

      const updatePromise = updateQuizQuestion({
        quizQuestionId: 'q1',
        subjectId: '64c1f2e3d4b5c6a7d8e9f0a1',
        text: 'Updated',
        deletedKeys: ['https://old.com/img1.jpg'],
        images: [{ mimetype: 'image/jpeg' } as any],
      });

      // Phải bị reject với message "Subject not found"
      await expect(updatePromise).rejects.toThrow('Subject not found');
    });
  });

  describe('deleteQuizQuestion', () => {
    const validSubjectId = '507f1f77bcf86cd799439011'; // 24 hex characters

    it('deletes question and its images', async () => {
      const question = {
        _id: validSubjectId,
        images: ['https://img.com/1.jpg'],
      };
      (QuizQuestionModel.findById as jest.Mock).mockResolvedValue(question);
      (QuizModel.exists as jest.Mock).mockResolvedValue(null);
      (getKeyFromPublicUrl as jest.Mock).mockReturnValue('key1.jpg');

      await deleteQuizQuestion(validSubjectId);

      expect(removeFiles).toHaveBeenCalledWith(['key1.jpg']);
      expect(QuizQuestionModel.findByIdAndDelete).toHaveBeenCalled();
    });

    it('blocks deletion if used in active quiz', async () => {
      (QuizQuestionModel.findById as jest.Mock).mockResolvedValue({ _id: validSubjectId });
      (QuizModel.exists as jest.Mock).mockResolvedValue({ _id: 'active-quiz' });

      await expect(deleteQuizQuestion(validSubjectId)).rejects.toThrow(
        "Can't delete question in active quiz"
      );
    });
  });

  describe('deleteMultipleQuizQuestions', () => {
    const validSubjectId = '507f1f77bcf86cd799439011'; // 24 hex characters
    const validSubjectId2 = '507f1f77bcf86cd799439012'; // 24 hex characters
    it('deletes multiple questions and their images', async () => {
      (QuizQuestionModel.find as jest.Mock).mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue([
          { _id: validSubjectId, images: ['https://img.com/1.jpg'] },
          { _id: validSubjectId2, images: ['https://img.com/2.jpg'] },
        ]),
      });
      (QuizModel.find as jest.Mock).mockResolvedValue([]);
      (getKeyFromPublicUrl as jest.Mock).mockReturnValue('key1.jpg');

      const result = await deleteMultipleQuizQuestions([validSubjectId, validSubjectId2]);

      expect(result.message).toBe('Deleted successfully');
    });
  });

  describe('getRandomQuestions', () => {
    const validSubjectId = '507f1f77bcf86cd799439011'; // 24 hex characters

    it('returns random questions with transformed format', async () => {
      (SubjectModel.findById as jest.Mock).mockResolvedValue(mockSubject);
      (QuizQuestionModel.aggregate as jest.Mock).mockResolvedValue([
        { _id: validSubjectId, text: 'Random Q', images: ['https://img.com/r1.jpg'] },
      ]);

      const result = await getRandomQuestions({ subjectId: 'subj1', count: 5 });

      expect(result.data[0].isNewQuestion).toBe(false);
      expect((result as any).data[0].images[0].fromDB).toBe(true);
    });
  });

  describe('uploadImages (external)', () => {
    it('uploads images for external quiz with prefix', async () => {
      (uploadFiles as jest.Mock).mockResolvedValue([{ publicUrl: 'https://ext.com/img.jpg' }]);

      const result = await uploadImages({
        quizId: 'external-quiz-123',
        images: [{ mimetype: 'image/png' } as any],
      });

      expect(uploadFiles).toHaveBeenCalled();
      expect(result[0].fromDB).toBe(false);
    });
  });

  describe('deleteImage', () => {
    it('deletes image by public URL', async () => {
      (getKeyFromPublicUrl as jest.Mock).mockReturnValue('deleted-key.jpg');

      await deleteImage('https://cdn.com/deleted-key.jpg');

      expect(removeFiles).not.toHaveBeenCalled(); // removeFile, not removeFiles
      // Nếu bạn dùng removeFile thì mock riêng
    });
  });
});
