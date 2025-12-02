// Forum Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";
import { Role } from "@/types";
import { ForumType } from "@/types/forum.type";

// Set longer timeout for setup
jest.setTimeout(60000);

// Mock all services before importing controller
jest.mock("@/services/forum.service", () => ({
  listForumsOfACourse: jest.fn(),
  getForumById: jest.fn(),
  createForum: jest.fn(),
  updateForumById: jest.fn(),
  deleteForumById: jest.fn(),
  listPostsInForum: jest.fn(),
  getForumPostById: jest.fn(),
  createForumPost: jest.fn(),
  updateForumPostById: jest.fn(),
  deleteForumPostById: jest.fn(),
  listRepliesInPost: jest.fn(),
  getForumReplyById: jest.fn(),
  createForumReply: jest.fn(),
  updateForumReplyById: jest.fn(),
  deleteForumReplyById: jest.fn(),
}));

// Mock Zod schemas
jest.mock("@/validators/forum.schemas", () => ({
  listForumsSchema: {
    parse: jest.fn(),
  },
  forumIdSchema: {
    parse: jest.fn(),
  },
  createForumSchema: {
    parse: jest.fn(),
  },
  updateForumSchema: {
    parse: jest.fn(),
  },
  listForumPostsSchema: {
    parse: jest.fn(),
  },
  postIdSchema: {
    parse: jest.fn(),
  },
  createForumPostSchema: {
    parse: jest.fn(),
  },
  updateForumPostSchema: {
    parse: jest.fn(),
  },
  listForumRepliesSchema: {
    parse: jest.fn(),
  },
  replyIdSchema: {
    parse: jest.fn(),
  },
  createForumReplySchema: {
    parse: jest.fn(),
  },
  updateForumReplySchema: {
    parse: jest.fn(),
  },
}));

// Mock parseFormData utility
jest.mock("@/utils/parseFormData", () => ({
  parseFormData: jest.fn((data) => data),
}));

// Import controller and services
import {
  listForumsHandler,
  getForumByIdHandler,
  createForumHandler,
  updateForumByIdHandler,
  deleteForumByIdHandler,
  listForumPostsHandler,
  getForumPostByIdHandler,
  createForumPostHandler,
  updateForumPostByIdHandler,
  deleteForumPostByIdHandler,
  listForumRepliesHandler,
  getForumReplyByIdHandler,
  createForumReplyHandler,
  updateForumReplyByIdHandler,
  deleteForumReplyByIdHandler,
} from "@/controller/forum.controller";
import * as forumService from "@/services/forum.service";
import * as forumSchemas from "@/validators/forum.schemas";

describe("📚 Forum Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: jest.Mock;
  let courseId: string;
  let forumId: string;
  let postId: string;
  let replyId: string;
  let userId: mongoose.Types.ObjectId;
  let forum: any;
  let forumPost: any;
  let forumReply: any;

  beforeEach(() => {
    courseId = new mongoose.Types.ObjectId().toString();
    forumId = new mongoose.Types.ObjectId().toString();
    postId = new mongoose.Types.ObjectId().toString();
    replyId = new mongoose.Types.ObjectId().toString();
    userId = new mongoose.Types.ObjectId();

    forum = {
      _id: forumId,
      courseId,
      title: "General Discussion",
      description: "A place for general course discussions",
      forumType: ForumType.DISCUSSION,
      key: [],
      isActive: true,
      isArchived: false,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    forumPost = {
      _id: postId,
      forumId,
      authorId: userId,
      title: "How to get started?",
      content: "I need help getting started with this course",
      pinned: false,
      replyCount: 0,
      key: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    forumReply = {
      _id: replyId,
      postId,
      authorId: userId,
      content: "You should start with the basics",
      key: [],
      parentReplyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReq = {
      query: {},
      params: {},
      body: {},
      userId,
      role: Role.STUDENT,
      file: undefined,
      files: undefined,
    } as any;

    mockRes = {
      success: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  // ====================================
  // FORUM HANDLER TESTS
  // ====================================
  describe("listForumsHandler", () => {
    it("should list forums with pagination", async () => {
      const mockForums = [forum];
      const mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false };

      mockReq.query = { courseId, page: "1", limit: "10" };
      (forumSchemas.listForumsSchema.parse as jest.Mock).mockReturnValue({
        courseId,
        page: 1,
        limit: 10,
      });
      (forumService.listForumsOfACourse as jest.Mock).mockResolvedValue({
        forums: mockForums,
        pagination: mockPagination,
      });

      await listForumsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.listForumsOfACourse).toHaveBeenCalledWith({
        courseId,
        page: 1,
        limit: 10,
        search: undefined,
        title: undefined,
        description: undefined,
        forumType: undefined,
        isActive: undefined,
        isArchived: undefined,
        createdBy: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Forums retrieved successfully",
        data: mockForums,
        pagination: mockPagination,
      });
    });

    it("should filter forums by title", async () => {
      mockReq.query = { courseId, title: "General" };
      (forumSchemas.listForumsSchema.parse as jest.Mock).mockReturnValue({
        courseId,
        page: 1,
        limit: 10,
        title: "General",
      });
      (forumService.listForumsOfACourse as jest.Mock).mockResolvedValue({
        forums: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listForumsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.listForumsOfACourse).toHaveBeenCalledWith(
        expect.objectContaining({ title: "General" })
      );
    });

    it("should filter forums by forumType", async () => {
      mockReq.query = { courseId, forumType: ForumType.DISCUSSION };
      (forumSchemas.listForumsSchema.parse as jest.Mock).mockReturnValue({
        courseId,
        page: 1,
        limit: 10,
        forumType: ForumType.DISCUSSION,
      });
      (forumService.listForumsOfACourse as jest.Mock).mockResolvedValue({
        forums: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listForumsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.listForumsOfACourse).toHaveBeenCalledWith(
        expect.objectContaining({ forumType: ForumType.DISCUSSION })
      );
    });

    it("should filter forums by isActive status", async () => {
      mockReq.query = { courseId, isActive: "true" };
      (forumSchemas.listForumsSchema.parse as jest.Mock).mockReturnValue({
        courseId,
        page: 1,
        limit: 10,
        isActive: true,
      });
      (forumService.listForumsOfACourse as jest.Mock).mockResolvedValue({
        forums: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listForumsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.listForumsOfACourse).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      );
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      (forumSchemas.listForumsSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await listForumsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      (forumSchemas.listForumsSchema.parse as jest.Mock).mockReturnValue({
        courseId,
        page: 1,
        limit: 10,
      });
      (forumService.listForumsOfACourse as jest.Mock).mockRejectedValue(error);

      await listForumsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getForumByIdHandler", () => {
    it("should get forum by ID successfully", async () => {
      mockReq.params = { id: forumId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumService.getForumById as jest.Mock).mockResolvedValue(forum);

      await getForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.getForumById).toHaveBeenCalledWith(forumId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Forum retrieved successfully",
        data: forum,
      });
    });

    it("should handle invalid forum ID", async () => {
      mockReq.params = { id: "invalid" };
      const error = new Error("Invalid forum ID");
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await getForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle forum not found", async () => {
      mockReq.params = { id: forumId };
      const error = new Error("Forum not found");
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumService.getForumById as jest.Mock).mockRejectedValue(error);

      await getForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("createForumHandler", () => {
    it("should create forum successfully", async () => {
      const forumData = {
        courseId,
        title: "General Discussion",
        description: "A place for discussions",
        forumType: ForumType.DISCUSSION,
      };
      const mockCreatedForum = { _id: forumId, ...forumData, createdBy: userId };

      mockReq.body = forumData;
      (forumSchemas.createForumSchema.parse as jest.Mock).mockReturnValue(forumData);
      (forumService.createForum as jest.Mock).mockResolvedValue(mockCreatedForum);

      await createForumHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.createForum).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: forumData.courseId,
          title: forumData.title,
          description: forumData.description,
          forumType: forumData.forumType,
          createdBy: userId,
        }),
        undefined
      );
      expect(mockRes.success).toHaveBeenCalledWith(201, {
        message: "Forum created successfully",
        data: mockCreatedForum,
      });
    });

    it("should create forum with single file", async () => {
      const forumData = {
        courseId,
        title: "General Discussion",
      };
      const mockFile = { originalname: "test.pdf" } as Express.Multer.File;
      mockReq.body = forumData;
      mockReq.file = mockFile;
      (forumSchemas.createForumSchema.parse as jest.Mock).mockReturnValue(forumData);
      (forumService.createForum as jest.Mock).mockResolvedValue(forum);

      await createForumHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.createForum).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: forumData.courseId,
          title: forumData.title,
          createdBy: userId,
        }),
        mockFile
      );
    });

    it("should create forum with multiple files", async () => {
      const forumData = {
        courseId,
        title: "General Discussion",
      };
      const mockFiles = [
        { originalname: "file1.pdf" } as Express.Multer.File,
        { originalname: "file2.pdf" } as Express.Multer.File,
      ];
      mockReq.body = forumData;
      mockReq.files = mockFiles;
      (forumSchemas.createForumSchema.parse as jest.Mock).mockReturnValue(forumData);
      (forumService.createForum as jest.Mock).mockResolvedValue(forum);

      await createForumHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.createForum).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: forumData.courseId,
          title: forumData.title,
          createdBy: userId,
        }),
        mockFiles
      );
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      (forumSchemas.createForumSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await createForumHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      mockReq.body = { courseId, title: "Test" };
      (forumSchemas.createForumSchema.parse as jest.Mock).mockReturnValue(mockReq.body);
      (forumService.createForum as jest.Mock).mockRejectedValue(error);

      await createForumHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateForumByIdHandler", () => {
    it("should update forum successfully", async () => {
      const updateData = {
        title: "Updated Title",
        description: "Updated description",
      };
      const mockUpdatedForum = { ...forum, ...updateData };

      mockReq.params = { id: forumId };
      mockReq.body = updateData;
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.updateForumSchema.parse as jest.Mock).mockReturnValue(updateData);
      (forumService.updateForumById as jest.Mock).mockResolvedValue(mockUpdatedForum);

      await updateForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.updateForumById).toHaveBeenCalledWith(forumId, updateData, undefined);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Forum updated successfully",
        data: mockUpdatedForum,
      });
    });

    it("should update forum with files", async () => {
      const updateData = { title: "Updated Title" };
      const mockFiles = [{ originalname: "file1.pdf" } as Express.Multer.File];

      mockReq.params = { id: forumId };
      mockReq.body = updateData;
      mockReq.files = mockFiles;
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.updateForumSchema.parse as jest.Mock).mockReturnValue(updateData);
      (forumService.updateForumById as jest.Mock).mockResolvedValue(forum);

      await updateForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      // Controller extracts single file from array
      expect(forumService.updateForumById).toHaveBeenCalledWith(forumId, updateData, mockFiles[0]);
    });

    it("should handle forum not found", async () => {
      const error = new Error("Forum not found");
      mockReq.params = { id: forumId };
      mockReq.body = { title: "Updated" };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.updateForumSchema.parse as jest.Mock).mockReturnValue(mockReq.body);
      (forumService.updateForumById as jest.Mock).mockRejectedValue(error);

      await updateForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteForumByIdHandler", () => {
    it("should delete forum successfully", async () => {
      mockReq.params = { id: forumId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumService.deleteForumById as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await deleteForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.deleteForumById).toHaveBeenCalledWith(forumId, userId, Role.STUDENT);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Forum deleted successfully",
        data: { deletedCount: 1 },
      });
    });

    it("should handle forum not found", async () => {
      const error = new Error("Forum not found");
      mockReq.params = { id: forumId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumService.deleteForumById as jest.Mock).mockRejectedValue(error);

      await deleteForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle authorization errors", async () => {
      const error = new Error("You can only delete your own forums");
      mockReq.params = { id: forumId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumService.deleteForumById as jest.Mock).mockRejectedValue(error);

      await deleteForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // FORUM POST HANDLER TESTS
  // ====================================
  describe("listForumPostsHandler", () => {
    it("should list posts with pagination", async () => {
      const mockPosts = [forumPost];
      const mockPagination = { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false };

      mockReq.params = { forumId };
      mockReq.query = { page: "1", limit: "10" };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.listForumPostsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (forumService.listPostsInForum as jest.Mock).mockResolvedValue({
        posts: mockPosts,
        pagination: mockPagination,
      });

      await listForumPostsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.listPostsInForum).toHaveBeenCalledWith({
        forumId,
        page: 1,
        limit: 10,
        search: undefined,
        authorId: undefined,
        title: undefined,
        content: undefined,
        pinned: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Posts retrieved successfully",
        data: mockPosts,
        pagination: mockPagination,
      });
    });

    it("should filter posts by pinned status", async () => {
      mockReq.params = { forumId };
      mockReq.query = { pinned: "true" };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.listForumPostsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
        pinned: true,
      });
      (forumService.listPostsInForum as jest.Mock).mockResolvedValue({
        posts: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      await listForumPostsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.listPostsInForum).toHaveBeenCalledWith(
        expect.objectContaining({ pinned: true })
      );
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      mockReq.params = { forumId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.listForumPostsSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 10,
      });
      (forumService.listPostsInForum as jest.Mock).mockRejectedValue(error);

      await listForumPostsHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getForumPostByIdHandler", () => {
    it("should get post by ID successfully", async () => {
      mockReq.params = { forumId, id: postId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumService.getForumPostById as jest.Mock).mockResolvedValue(forumPost);

      await getForumPostByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.getForumPostById).toHaveBeenCalledWith(forumId, postId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Post retrieved successfully",
        data: forumPost,
      });
    });

    it("should handle post not found", async () => {
      const error = new Error("Post not found");
      mockReq.params = { forumId, id: postId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumService.getForumPostById as jest.Mock).mockRejectedValue(error);

      await getForumPostByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("createForumPostHandler", () => {
    it("should create post successfully", async () => {
      const postData = {
        title: "Test Post",
        content: "Test content",
      };
      const mockCreatedPost = { _id: postId, ...postData, forumId, authorId: userId };

      mockReq.params = { forumId };
      mockReq.body = postData;
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.createForumPostSchema.parse as jest.Mock).mockReturnValue(postData);
      (forumService.createForumPost as jest.Mock).mockResolvedValue(mockCreatedPost);

      await createForumPostHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.createForumPost).toHaveBeenCalledWith(
        expect.objectContaining({
          title: postData.title,
          content: postData.content,
          forumId,
          authorId: userId,
        }),
        undefined
      );
      expect(mockRes.success).toHaveBeenCalledWith(201, {
        message: "Post created successfully",
        data: mockCreatedPost,
      });
    });

    it("should create post with files", async () => {
      const postData = {
        content: "Test content",
      };
      const mockFiles = [{ originalname: "file1.pdf" } as Express.Multer.File];

      mockReq.params = { forumId };
      mockReq.body = postData;
      mockReq.files = mockFiles;
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.createForumPostSchema.parse as jest.Mock).mockReturnValue(postData);
      (forumService.createForumPost as jest.Mock).mockResolvedValue(forumPost);

      await createForumPostHandler(mockReq as Request, mockRes as Response, mockNext);

      // Controller extracts single file from array
      expect(forumService.createForumPost).toHaveBeenCalledWith(
        expect.objectContaining({
          content: postData.content,
          forumId,
          authorId: userId,
        }),
        mockFiles[0]
      );
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      mockReq.params = { forumId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.createForumPostSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await createForumPostHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe("updateForumPostByIdHandler", () => {
    it("should update post successfully", async () => {
      const updateData = {
        title: "Updated Title",
        content: "Updated content",
      };
      const mockUpdatedPost = { ...forumPost, ...updateData };

      mockReq.params = { forumId, id: postId };
      mockReq.body = updateData;
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.updateForumPostSchema.parse as jest.Mock).mockReturnValue(updateData);
      (forumService.updateForumPostById as jest.Mock).mockResolvedValue(mockUpdatedPost);

      await updateForumPostByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.updateForumPostById).toHaveBeenCalledWith(
        forumId,
        postId,
        userId.toString(),
        updateData,
        undefined
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Post updated successfully",
        data: mockUpdatedPost,
      });
    });

    it("should handle authorization errors", async () => {
      const error = new Error("You can only edit your own posts");
      mockReq.params = { forumId, id: postId };
      mockReq.body = { content: "Updated" };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.updateForumPostSchema.parse as jest.Mock).mockReturnValue(mockReq.body);
      (forumService.updateForumPostById as jest.Mock).mockRejectedValue(error);

      await updateForumPostByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteForumPostByIdHandler", () => {
    it("should delete post successfully", async () => {
      mockReq.params = { forumId, id: postId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumService.deleteForumPostById as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await deleteForumPostByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.deleteForumPostById).toHaveBeenCalledWith(
        forumId,
        postId,
        userId.toString(),
        Role.STUDENT
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Post deleted successfully",
        data: { deletedCount: 1 },
      });
    });

    it("should handle post not found", async () => {
      const error = new Error("Post not found");
      mockReq.params = { forumId, id: postId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumService.deleteForumPostById as jest.Mock).mockRejectedValue(error);

      await deleteForumPostByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ====================================
  // FORUM REPLY HANDLER TESTS
  // ====================================
  describe("listForumRepliesHandler", () => {
    it("should list replies with pagination", async () => {
      const mockReplies = [forumReply];
      const mockPagination = { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false };

      mockReq.params = { forumId, postId };
      mockReq.query = { page: "1", limit: "20" };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.listForumRepliesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 20,
      });
      (forumService.listRepliesInPost as jest.Mock).mockResolvedValue({
        replies: mockReplies,
        pagination: mockPagination,
      });

      await listForumRepliesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.listRepliesInPost).toHaveBeenCalledWith({
        postId,
        page: 1,
        limit: 20,
        search: undefined,
        authorId: undefined,
        parentReplyId: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Replies retrieved successfully",
        data: mockReplies,
        pagination: mockPagination,
      });
    });

    it("should filter replies by parentReplyId", async () => {
      const parentReplyId = new mongoose.Types.ObjectId().toString();
      mockReq.params = { forumId, postId };
      mockReq.query = { parentReplyId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.listForumRepliesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 20,
        parentReplyId,
      });
      (forumService.listRepliesInPost as jest.Mock).mockResolvedValue({
        replies: [],
        pagination: { page: 1, limit: 20, total: 0 },
      });

      await listForumRepliesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.listRepliesInPost).toHaveBeenCalledWith(
        expect.objectContaining({ parentReplyId })
      );
    });

    it("should handle service errors", async () => {
      const error = new Error("Service error");
      mockReq.params = { forumId, postId };
      (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.listForumRepliesSchema.parse as jest.Mock).mockReturnValue({
        page: 1,
        limit: 20,
      });
      (forumService.listRepliesInPost as jest.Mock).mockRejectedValue(error);

      await listForumRepliesHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getForumReplyByIdHandler", () => {
    it("should get reply by ID successfully", async () => {
      mockReq.params = { postId, id: replyId };
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.replyIdSchema.parse as jest.Mock).mockReturnValue(replyId);
      (forumService.getForumReplyById as jest.Mock).mockResolvedValue(forumReply);

      await getForumReplyByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.getForumReplyById).toHaveBeenCalledWith(postId, replyId);
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Reply retrieved successfully",
        data: forumReply,
      });
    });

    it("should handle reply not found", async () => {
      const error = new Error("Reply not found");
      mockReq.params = { postId, id: replyId };
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.replyIdSchema.parse as jest.Mock).mockReturnValue(replyId);
      (forumService.getForumReplyById as jest.Mock).mockRejectedValue(error);

      await getForumReplyByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("createForumReplyHandler", () => {
    it("should create reply successfully", async () => {
      const replyData = {
        content: "Test reply",
      };
      const mockCreatedReply = { _id: replyId, ...replyData, postId, authorId: userId };

      mockReq.params = { postId };
      mockReq.body = replyData;
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.createForumReplySchema.parse as jest.Mock).mockReturnValue(replyData);
      (forumService.createForumReply as jest.Mock).mockResolvedValue(mockCreatedReply);

      await createForumReplyHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.createForumReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: replyData.content,
          postId,
          authorId: userId,
        }),
        undefined
      );
      expect(mockRes.success).toHaveBeenCalledWith(201, {
        message: "Reply created successfully",
        data: mockCreatedReply,
      });
    });

    it("should create nested reply with parentReplyId", async () => {
      const parentReplyId = new mongoose.Types.ObjectId();
      const replyData = {
        content: "Nested reply",
        parentReplyId: parentReplyId.toString(),
      };

      mockReq.params = { postId };
      mockReq.body = replyData;
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.createForumReplySchema.parse as jest.Mock).mockReturnValue(replyData);
      (forumService.createForumReply as jest.Mock).mockResolvedValue(forumReply);

      await createForumReplyHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.createForumReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: replyData.content,
          postId,
          authorId: userId,
          parentReplyId: replyData.parentReplyId,
        }),
        undefined
      );
    });

    it("should create reply with files", async () => {
      const replyData = {
        content: "Reply with files",
      };
      const mockFile = { originalname: "file1.pdf" } as Express.Multer.File;

      mockReq.params = { postId };
      mockReq.body = replyData;
      mockReq.file = mockFile;
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.createForumReplySchema.parse as jest.Mock).mockReturnValue(replyData);
      (forumService.createForumReply as jest.Mock).mockResolvedValue(forumReply);

      await createForumReplyHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.createForumReply).toHaveBeenCalledWith(
        expect.objectContaining({
          content: replyData.content,
          postId,
          authorId: userId,
        }),
        mockFile
      );
    });

    it("should handle validation errors", async () => {
      const validationError = new Error("Validation failed");
      mockReq.params = { postId };
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.createForumReplySchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await createForumReplyHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe("updateForumReplyByIdHandler", () => {
    it("should update reply successfully", async () => {
      const updateData = {
        content: "Updated content",
      };
      const mockUpdatedReply = { ...forumReply, ...updateData };

      mockReq.params = { postId, id: replyId };
      mockReq.body = updateData;
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.replyIdSchema.parse as jest.Mock).mockReturnValue(replyId);
      (forumSchemas.updateForumReplySchema.parse as jest.Mock).mockReturnValue(updateData);
      (forumService.updateForumReplyById as jest.Mock).mockResolvedValue(mockUpdatedReply);

      await updateForumReplyByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.updateForumReplyById).toHaveBeenCalledWith(
        postId,
        replyId,
        userId.toString(),
        updateData,
        undefined
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Reply updated successfully",
        data: mockUpdatedReply,
      });
    });

    it("should update reply with files", async () => {
      const updateData = {
        content: "Updated content",
      };
      const mockFiles = [{ originalname: "file1.pdf" } as Express.Multer.File];

      mockReq.params = { postId, id: replyId };
      mockReq.body = updateData;
      mockReq.files = mockFiles;
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.replyIdSchema.parse as jest.Mock).mockReturnValue(replyId);
      (forumSchemas.updateForumReplySchema.parse as jest.Mock).mockReturnValue(updateData);
      (forumService.updateForumReplyById as jest.Mock).mockResolvedValue(forumReply);

      await updateForumReplyByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      // Controller extracts single file from array
      expect(forumService.updateForumReplyById).toHaveBeenCalledWith(
        postId,
        replyId,
        userId.toString(),
        updateData,
        mockFiles[0]
      );
    });

    it("should handle authorization errors", async () => {
      const error = new Error("You can only edit your own replies");
      mockReq.params = { postId, id: replyId };
      mockReq.body = { content: "Updated" };
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.replyIdSchema.parse as jest.Mock).mockReturnValue(replyId);
      (forumSchemas.updateForumReplySchema.parse as jest.Mock).mockReturnValue(mockReq.body);
      (forumService.updateForumReplyById as jest.Mock).mockRejectedValue(error);

      await updateForumReplyByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteForumReplyByIdHandler", () => {
    it("should delete reply successfully", async () => {
      mockReq.params = { postId, id: replyId };
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.replyIdSchema.parse as jest.Mock).mockReturnValue(replyId);
      (forumService.deleteForumReplyById as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await deleteForumReplyByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(forumService.deleteForumReplyById).toHaveBeenCalledWith(
        postId,
        replyId,
        userId.toString(),
        Role.STUDENT
      );
      expect(mockRes.success).toHaveBeenCalledWith(200, {
        message: "Reply deleted successfully",
        data: { deletedCount: 1 },
      });
    });

    it("should handle reply not found", async () => {
      const error = new Error("Reply not found");
      mockReq.params = { postId, id: replyId };
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.replyIdSchema.parse as jest.Mock).mockReturnValue(replyId);
      (forumService.deleteForumReplyById as jest.Mock).mockRejectedValue(error);

      await deleteForumReplyByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle authorization errors", async () => {
      const error = new Error("You can only delete your own replies");
      mockReq.params = { postId, id: replyId };
      (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
      (forumSchemas.replyIdSchema.parse as jest.Mock).mockReturnValue(replyId);
      (forumService.deleteForumReplyById as jest.Mock).mockRejectedValue(error);

      await deleteForumReplyByIdHandler(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

