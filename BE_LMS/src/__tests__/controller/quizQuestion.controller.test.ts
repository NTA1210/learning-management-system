import {
  importXMLFileHandler,
  exportXMLFileHandler,
  getAllQuizQuestionsHandler,
  createQuizQuestionHandler,
  updateQuizQuestionByIdHandler,
  deleteQuizQuestionByIdHandler,
  deleteMultiQuizQuestionByIdHandler,
  getRandomQuestionsHandler,
  uploadImagesHandler,
  deleteImageHandler,
} from '@/controller/quizQuestion.controller';

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
} from '@/services/quizQuestion.service';

import {
  importQuizQuestionParamsSchema,
  subjectIdSchema,
  listQuizQuestionSchema,
  createQuizQuestionSchema,
  updateQuizQuestionSchema,
  quizQuestionIdSchema,
  multiQuizQuestionIdSchema,
  randomQuizQuestionSchema,
  uploadImagesSchema,
  deleteImagesSchema,
} from '@/validators/quizQuestion.schemas';

import { OK, CREATED } from '@/constants/http';

jest.mock('@/services/quizQuestion.service', () => ({
  importXMLFile: jest.fn(),
  exportXMLFile: jest.fn(),
  getAllQuizQuestions: jest.fn(),
  createQuizQuestion: jest.fn(),
  updateQuizQuestion: jest.fn(),
  deleteQuizQuestion: jest.fn(),
  deleteMultipleQuizQuestions: jest.fn(),
  getRandomQuestions: jest.fn(),
  uploadImages: jest.fn(),
  deleteImage: jest.fn(),
}));

jest.mock('@/validators/quizQuestion.schemas', () => ({
  importQuizQuestionParamsSchema: { parse: jest.fn() },
  subjectIdSchema: { parse: jest.fn() },
  listQuizQuestionSchema: { parse: jest.fn() },
  createQuizQuestionSchema: { parse: jest.fn() },
  updateQuizQuestionSchema: { parse: jest.fn() },
  quizQuestionIdSchema: { parse: jest.fn() },
  multiQuizQuestionIdSchema: { parse: jest.fn() },
  randomQuizQuestionSchema: { parse: jest.fn() },
  uploadImagesSchema: { parse: jest.fn() },
  deleteImagesSchema: { parse: jest.fn() },
}));

describe('Quiz Question Controller - Unit Tests', () => {
  const mockRes: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    success: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };

  const mockNext = jest.fn();

  afterEach(() => jest.clearAllMocks());

  // ------------------ IMPORT XML ------------------
  describe('importXMLFileHandler', () => {
    it('should import XML and return OK', async () => {
      const xmlBuffer = Buffer.from('<xml></xml>');
      const req: any = {
        file: { mimetype: 'application/xml', buffer: xmlBuffer },
        body: { subjectId: 's1' },
      };

      (importQuizQuestionParamsSchema.parse as jest.Mock).mockReturnValueOnce(true);
      (importXMLFile as jest.Mock).mockResolvedValueOnce({
        data: [],
        total: 10,
        importedTypes: { choice: 5 },
      });

      await importXMLFileHandler(req, mockRes, mockNext);

      expect(importQuizQuestionParamsSchema.parse).toHaveBeenCalledWith({
        xmlFile: req.file,
        subjectId: req.body.subjectId,
      });
      expect(importXMLFile).toHaveBeenCalledWith(xmlBuffer, 's1');
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: [],
        total: 10,
        importedTypes: { choice: 5 },
        message: 'Questions imported successfully',
      });
    });
  });

  // ------------------ EXPORT XML ------------------
  describe('exportXMLFileHandler', () => {
    it('should export XML and return OK', async () => {
      const req: any = { params: { subjectId: 's1' } };

      (subjectIdSchema.parse as jest.Mock).mockReturnValueOnce('s1');
      (exportXMLFile as jest.Mock).mockResolvedValueOnce({
        xmlString: '<xml></xml>',
        total: 10,
        exportedTypes: { choice: 10 },
      });

      await exportXMLFileHandler(req, mockRes, mockNext);

      expect(subjectIdSchema.parse).toHaveBeenCalledWith('s1');
      expect(exportXMLFile).toHaveBeenCalledWith('s1');
      expect(mockRes.setHeader).toHaveBeenCalledTimes(2);
      expect(mockRes.send).toHaveBeenCalledWith('<xml></xml>');
    });
  });

  // ------------------ GET ALL ------------------
  describe('getAllQuizQuestionsHandler', () => {
    it('should return all questions', async () => {
      const filters = { page: 1 };
      const req: any = { query: filters };

      (listQuizQuestionSchema.parse as jest.Mock).mockReturnValueOnce(filters);
      (getAllQuizQuestions as jest.Mock).mockResolvedValueOnce({
        data: [],
        pagination: {},
      });

      await getAllQuizQuestionsHandler(req, mockRes, mockNext);

      expect(listQuizQuestionSchema.parse).toHaveBeenCalledWith(filters);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: [],
        pagination: {},
        message: 'Questions retrieved successfully',
      });
    });
  });

  // ------------------ CREATE ------------------
  describe('createQuizQuestionHandler', () => {
    it('should create question', async () => {
      const files = [{ filename: '1.png' }];
      const req: any = { body: { title: 'Hello' }, files };

      const parsed = { title: 'Hello', images: files };
      (createQuizQuestionSchema.parse as jest.Mock).mockReturnValueOnce(parsed);

      (createQuizQuestion as jest.Mock).mockResolvedValueOnce({ _id: 'q1' });

      await createQuizQuestionHandler(req, mockRes, mockNext);

      expect(createQuizQuestionSchema.parse).toHaveBeenCalled();
      expect(createQuizQuestion).toHaveBeenCalledWith(parsed);
      expect(mockRes.success).toHaveBeenCalledWith(CREATED, {
        data: { _id: 'q1' },
        message: 'Question created successfully',
      });
    });
  });

  // ------------------ UPDATE ------------------
  describe('updateQuizQuestionByIdHandler', () => {
    it('should update question', async () => {
      const files: Express.Multer.File[] = [];
      const req: any = {
        params: { quizQuestionId: 'q1' },
        body: { title: 'Updated' },
        files,
      };

      const parsed = { title: 'Updated', quizQuestionId: 'q1', images: [] };
      (updateQuizQuestionSchema.parse as jest.Mock).mockReturnValueOnce(parsed);

      (updateQuizQuestion as jest.Mock).mockResolvedValueOnce({ _id: 'q1', title: 'Updated' });

      await updateQuizQuestionByIdHandler(req, mockRes, mockNext);

      expect(updateQuizQuestion).toHaveBeenCalledWith(parsed);
      expect(mockRes.success).toHaveBeenCalledWith(CREATED, {
        data: { _id: 'q1', title: 'Updated' },
        message: 'Question updated successfully',
      });
    });
  });

  // ------------------ DELETE One ------------------
  describe('deleteQuizQuestionByIdHandler', () => {
    it('should delete question by id', async () => {
      (quizQuestionIdSchema.parse as jest.Mock).mockReturnValueOnce('q1');
      (deleteQuizQuestion as jest.Mock).mockResolvedValueOnce(true);

      const req: any = { params: { quizQuestionId: 'q1' } };
      await deleteQuizQuestionByIdHandler(req, mockRes, mockNext);

      expect(deleteQuizQuestion).toHaveBeenCalledWith('q1');
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: true,
        message: 'Question deleted successfully',
      });
    });
  });

  // ------------------ DELETE Multi ------------------
  describe('deleteMultiQuizQuestionByIdHandler', () => {
    it('should delete multiple questions', async () => {
      const req: any = { body: { ids: ['1', '2'] } };

      (multiQuizQuestionIdSchema.parse as jest.Mock).mockReturnValueOnce(['1', '2']);
      (deleteMultipleQuizQuestions as jest.Mock).mockResolvedValueOnce(true);

      await deleteMultiQuizQuestionByIdHandler(req, mockRes, mockNext);

      expect(deleteMultipleQuizQuestions).toHaveBeenCalledWith(['1', '2']);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: true,
        message: 'Question deleted successfully',
      });
    });
  });

  // ------------------ RANDOM ------------------
  describe('getRandomQuestionsHandler', () => {
    it('should return random questions', async () => {
      const req: any = { query: { limit: 5 } };

      const parsed = { limit: 5 };
      (randomQuizQuestionSchema.parse as jest.Mock).mockReturnValueOnce(parsed);
      (getRandomQuestions as jest.Mock).mockResolvedValueOnce({
        data: [1, 2],
        total: 2,
        questionTypes: {},
      });

      await getRandomQuestionsHandler(req, mockRes, mockNext);

      expect(getRandomQuestions).toHaveBeenCalledWith(parsed);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: [1, 2],
        total: 2,
        questionTypes: {},
        message: 'Questions retrieved successfully',
      });
    });
  });

  // ------------------ UPLOAD IMAGES ------------------
  describe('uploadImagesHandler', () => {
    it('should upload images successfully', async () => {
      const files = [{ name: 'a.png' }];
      const req: any = { body: {}, files };

      const parsed = { images: files };
      (uploadImagesSchema.parse as jest.Mock).mockReturnValueOnce(parsed);
      (uploadImages as jest.Mock).mockResolvedValueOnce(['url1']);

      await uploadImagesHandler(req, mockRes, mockNext);

      expect(uploadImages).toHaveBeenCalledWith(parsed);
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        data: ['url1'],
        message: 'Images uploaded successfully',
      });
    });
  });

  // ------------------ DELETE IMAGE ------------------
  describe('deleteImageHandler', () => {
    it('should delete image successfully', async () => {
      const req: any = { query: { url: 'img1' } };

      (deleteImagesSchema.parse as jest.Mock).mockReturnValueOnce('img1');
      (deleteImage as jest.Mock).mockResolvedValueOnce(true);

      await deleteImageHandler(req, mockRes, mockNext);

      expect(deleteImage).toHaveBeenCalledWith('img1');
      expect(mockRes.success).toHaveBeenCalledWith(OK, {
        message: 'Image deleted successfully',
      });
    });
  });
});
