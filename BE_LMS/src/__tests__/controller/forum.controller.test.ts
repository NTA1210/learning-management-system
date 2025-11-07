// Forum Controller Unit Tests
import { Request, Response } from "express";
import mongoose from "mongoose";
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

describe("📝 Forum Controller Unit Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: jest.Mock;
  let userId: string;
  let courseId: string;
  let forumId: string;
  let postId: string;
  let replyId: string;

  beforeEach(() => {
    userId = new mongoose.Types.ObjectId().toString();
    courseId = new mongoose.Types.ObjectId().toString();
    forumId = new mongoose.Types.ObjectId().toString();
    postId = new mongoose.Types.ObjectId().toString();
    replyId = new mongoose.Types.ObjectId().toString();

    mockReq = {
      userId: userId,
      query: {},
      params: {},
      body: {},
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
  describe("Forum Handlers", () => {
    describe("listForumsHandler", () => {
      it("should list forums with pagination", async () => {
        const mockForums = [
          { _id: forumId, title: "Forum 1", forumType: ForumType.DISCUSSION },
          { _id: forumId, title: "Forum 2", forumType: ForumType.ANNOUNCEMENT },
        ];
        const mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

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
          page: 1,
          limit: 10,
          search: undefined,
          courseId,
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

      it("should filter forums by search term", async () => {
        mockReq.query = { courseId, search: "Discussion" };
        (forumSchemas.listForumsSchema.parse as jest.Mock).mockReturnValue({
          courseId,
          page: 1,
          limit: 10,
          search: "Discussion",
        });
        (forumService.listForumsOfACourse as jest.Mock).mockResolvedValue({
          forums: [],
          pagination: { page: 1, limit: 10, total: 0 },
        });

        await listForumsHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.listForumsOfACourse).toHaveBeenCalledWith(
          expect.objectContaining({ search: "Discussion" })
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
        const mockForum = {
          _id: forumId,
          title: "Test Forum",
          forumType: ForumType.DISCUSSION,
        };

        mockReq.params = { id: forumId };
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumService.getForumById as jest.Mock).mockResolvedValue(mockForum);

        await getForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.getForumById).toHaveBeenCalledWith(forumId);
        expect(mockRes.success).toHaveBeenCalledWith(200, {
          message: "Forum retrieved successfully",
          data: mockForum,
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
          title: "New Forum",
          description: "Forum description",
          forumType: ForumType.DISCUSSION,
        };
        const mockCreatedForum = { _id: forumId, ...forumData, createdBy: userId };

        mockReq.body = forumData;
        (forumSchemas.createForumSchema.parse as jest.Mock).mockReturnValue(forumData);
        (forumService.createForum as jest.Mock).mockResolvedValue(mockCreatedForum);

        await createForumHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.createForum).toHaveBeenCalledWith({
          ...forumData,
          courseId: forumData.courseId,
          createdBy: userId,
        });
        expect(mockRes.success).toHaveBeenCalledWith(201, {
          message: "Forum created successfully",
          data: mockCreatedForum,
        });
      });

      it("should handle validation errors", async () => {
        mockReq.body = { title: "" };
        const validationError = new Error("Validation failed");
        (forumSchemas.createForumSchema.parse as jest.Mock).mockImplementation(() => {
          throw validationError;
        });

        await createForumHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(validationError);
      });

      it("should handle service errors", async () => {
        const forumData = { courseId, title: "New Forum" };
        const error = new Error("Service error");
        mockReq.body = forumData;
        (forumSchemas.createForumSchema.parse as jest.Mock).mockReturnValue(forumData);
        (forumService.createForum as jest.Mock).mockRejectedValue(error);

        await createForumHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });

    describe("updateForumByIdHandler", () => {
      it("should update forum successfully", async () => {
        const updateData = { title: "Updated Forum" };
        const mockUpdatedForum = {
          _id: forumId,
          title: "Updated Forum",
          forumType: ForumType.DISCUSSION,
        };

        mockReq.params = { id: forumId };
        mockReq.body = updateData;
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumSchemas.updateForumSchema.parse as jest.Mock).mockReturnValue(updateData);
        (forumService.updateForumById as jest.Mock).mockResolvedValue(mockUpdatedForum);

        await updateForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.updateForumById).toHaveBeenCalledWith(forumId, updateData);
        expect(mockRes.success).toHaveBeenCalledWith(200, {
          message: "Forum updated successfully",
          data: mockUpdatedForum,
        });
      });

      it("should handle forum not found", async () => {
        const updateData = { title: "Updated Forum" };
        const error = new Error("Forum not found");
        mockReq.params = { id: forumId };
        mockReq.body = updateData;
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumSchemas.updateForumSchema.parse as jest.Mock).mockReturnValue(updateData);
        (forumService.updateForumById as jest.Mock).mockRejectedValue(error);

        await updateForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });

    describe("deleteForumByIdHandler", () => {
      it("should delete forum successfully", async () => {
        const mockResult = { deletedCount: 1 };

        mockReq.params = { id: forumId };
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumService.deleteForumById as jest.Mock).mockResolvedValue(mockResult);

        await deleteForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.deleteForumById).toHaveBeenCalledWith(forumId);
        expect(mockRes.success).toHaveBeenCalledWith(200, {
          message: "Forum deleted successfully",
          data: mockResult,
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

      it("should handle cannot delete with existing posts", async () => {
        const error = new Error("Cannot delete forum. 5 posts exist in this forum.");
        mockReq.params = { id: forumId };
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumService.deleteForumById as jest.Mock).mockRejectedValue(error);

        await deleteForumByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });

  // ====================================
  // FORUM POST HANDLER TESTS
  // ====================================
  describe("Forum Post Handlers", () => {
    describe("listForumPostsHandler", () => {
      it("should list posts with pagination", async () => {
        const mockPosts = [
          { _id: postId, title: "Post 1", content: "Content 1" },
          { _id: postId, title: "Post 2", content: "Content 2" },
        ];
        const mockPagination = { page: 1, limit: 10, total: 2, totalPages: 1 };

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
          page: 1,
          limit: 10,
          search: undefined,
          forumId,
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

      it("should filter posts by search term", async () => {
        mockReq.params = { forumId };
        mockReq.query = { search: "test" };
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumSchemas.listForumPostsSchema.parse as jest.Mock).mockReturnValue({
          page: 1,
          limit: 10,
          search: "test",
        });
        (forumService.listPostsInForum as jest.Mock).mockResolvedValue({
          posts: [],
          pagination: { page: 1, limit: 10, total: 0 },
        });

        await listForumPostsHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.listPostsInForum).toHaveBeenCalledWith(
          expect.objectContaining({ search: "test" })
        );
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
        const error = new Error("Forum not found");
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
        const mockPost = {
          _id: postId,
          forumId,
          title: "Test Post",
          content: "Post content",
        };

        mockReq.params = { forumId, id: postId };
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumService.getForumPostById as jest.Mock).mockResolvedValue(mockPost);

        await getForumPostByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.getForumPostById).toHaveBeenCalledWith(forumId, postId);
        expect(mockRes.success).toHaveBeenCalledWith(200, {
          message: "Post retrieved successfully",
          data: mockPost,
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
          title: "New Post",
          content: "Post content",
        };
        const mockCreatedPost = {
          _id: postId,
          forumId,
          authorId: userId,
          ...postData,
        };

        mockReq.params = { forumId };
        mockReq.body = postData;
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumSchemas.createForumPostSchema.parse as jest.Mock).mockReturnValue(postData);
        (forumService.createForumPost as jest.Mock).mockResolvedValue(mockCreatedPost);

        await createForumPostHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.createForumPost).toHaveBeenCalledWith({
          ...postData,
          forumId,
          authorId: userId,
        });
        expect(mockRes.success).toHaveBeenCalledWith(201, {
          message: "Post created successfully",
          data: mockCreatedPost,
        });
      });

      it("should handle validation errors", async () => {
        const validationError = new Error("Content is required");
        mockReq.params = { forumId };
        mockReq.body = {};
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumSchemas.createForumPostSchema.parse as jest.Mock).mockImplementation(() => {
          throw validationError;
        });

        await createForumPostHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(validationError);
      });

      it("should handle inactive forum error", async () => {
        const postData = { content: "New post" };
        const error = new Error("Cannot post in an inactive forum");
        mockReq.params = { forumId };
        mockReq.body = postData;
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumSchemas.createForumPostSchema.parse as jest.Mock).mockReturnValue(postData);
        (forumService.createForumPost as jest.Mock).mockRejectedValue(error);

        await createForumPostHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });

    describe("updateForumPostByIdHandler", () => {
      it("should update post successfully", async () => {
        const updateData = { title: "Updated Post", content: "Updated content" };
        const mockUpdatedPost = {
          _id: postId,
          forumId,
          authorId: userId,
          ...updateData,
        };

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
          userId,
          updateData
        );
        expect(mockRes.success).toHaveBeenCalledWith(200, {
          message: "Post updated successfully",
          data: mockUpdatedPost,
        });
      });

      it("should handle unauthorized update", async () => {
        const updateData = { content: "Updated content" };
        const error = new Error("You can only edit your own posts");
        mockReq.params = { forumId, id: postId };
        mockReq.body = updateData;
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumSchemas.updateForumPostSchema.parse as jest.Mock).mockReturnValue(updateData);
        (forumService.updateForumPostById as jest.Mock).mockRejectedValue(error);

        await updateForumPostByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });

    describe("deleteForumPostByIdHandler", () => {
      it("should delete post successfully", async () => {
        const mockResult = { deletedCount: 1 };

        mockReq.params = { forumId, id: postId };
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumService.deleteForumPostById as jest.Mock).mockResolvedValue(mockResult);

        await deleteForumPostByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.deleteForumPostById).toHaveBeenCalledWith(forumId, postId, userId);
        expect(mockRes.success).toHaveBeenCalledWith(200, {
          message: "Post deleted successfully",
          data: mockResult,
        });
      });

      it("should handle unauthorized delete", async () => {
        const error = new Error("You can only delete your own posts");
        mockReq.params = { forumId, id: postId };
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumService.deleteForumPostById as jest.Mock).mockRejectedValue(error);

        await deleteForumPostByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });
  });

  // ====================================
  // FORUM REPLY HANDLER TESTS
  // ====================================
  describe("Forum Reply Handlers", () => {
    describe("listForumRepliesHandler", () => {
      it("should list replies with pagination", async () => {
        const mockReplies = [
          { _id: replyId, postId, content: "Reply 1" },
          { _id: replyId, postId, content: "Reply 2" },
        ];
        const mockPagination = { page: 1, limit: 20, total: 2, totalPages: 1 };

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
          page: 1,
          limit: 20,
          search: undefined,
          postId,
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

      it("should filter replies by search term", async () => {
        mockReq.params = { forumId, postId };
        mockReq.query = { search: "test" };
        (forumSchemas.forumIdSchema.parse as jest.Mock).mockReturnValue(forumId);
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumSchemas.listForumRepliesSchema.parse as jest.Mock).mockReturnValue({
          page: 1,
          limit: 20,
          search: "test",
        });
        (forumService.listRepliesInPost as jest.Mock).mockResolvedValue({
          replies: [],
          pagination: { page: 1, limit: 20, total: 0 },
        });

        await listForumRepliesHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.listRepliesInPost).toHaveBeenCalledWith(
          expect.objectContaining({ search: "test" })
        );
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
        const error = new Error("Post not found");
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
        const mockReply = {
          _id: replyId,
          postId,
          authorId: userId,
          content: "Test reply",
        };

        mockReq.params = { postId, id: replyId };
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumSchemas.replyIdSchema.parse as jest.Mock).mockReturnValue(replyId);
        (forumService.getForumReplyById as jest.Mock).mockResolvedValue(mockReply);

        await getForumReplyByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.getForumReplyById).toHaveBeenCalledWith(postId, replyId);
        expect(mockRes.success).toHaveBeenCalledWith(200, {
          message: "Reply retrieved successfully",
          data: mockReply,
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
          content: "New reply",
        };
        const mockCreatedReply = {
          _id: replyId,
          postId,
          authorId: userId,
          ...replyData,
        };

        mockReq.params = { postId };
        mockReq.body = replyData;
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumSchemas.createForumReplySchema.parse as jest.Mock).mockReturnValue(replyData);
        (forumService.createForumReply as jest.Mock).mockResolvedValue(mockCreatedReply);

        await createForumReplyHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.createForumReply).toHaveBeenCalledWith({
          ...replyData,
          postId,
          authorId: userId,
          parentReplyId: undefined,
        });
        expect(mockRes.success).toHaveBeenCalledWith(201, {
          message: "Reply created successfully",
          data: mockCreatedReply,
        });
      });

      it("should create nested reply successfully", async () => {
        const parentReplyId = new mongoose.Types.ObjectId().toString();
        const replyData = {
          content: "Nested reply",
          parentReplyId,
        };
        const mockCreatedReply = {
          _id: replyId,
          postId,
          authorId: userId,
          ...replyData,
        };

        mockReq.params = { postId };
        mockReq.body = replyData;
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumSchemas.createForumReplySchema.parse as jest.Mock).mockReturnValue(replyData);
        (forumService.createForumReply as jest.Mock).mockResolvedValue(mockCreatedReply);

        await createForumReplyHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.createForumReply).toHaveBeenCalledWith({
          ...replyData,
          postId,
          authorId: userId,
          parentReplyId,
        });
        expect(mockRes.success).toHaveBeenCalledWith(201, {
          message: "Reply created successfully",
          data: mockCreatedReply,
        });
      });

      it("should handle validation errors", async () => {
        const validationError = new Error("Content is required");
        mockReq.params = { postId };
        mockReq.body = {};
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumSchemas.createForumReplySchema.parse as jest.Mock).mockImplementation(() => {
          throw validationError;
        });

        await createForumReplyHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(validationError);
      });

      it("should handle archived forum error", async () => {
        const replyData = { content: "New reply" };
        const error = new Error("Cannot reply in an archived forum");
        mockReq.params = { postId };
        mockReq.body = replyData;
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumSchemas.createForumReplySchema.parse as jest.Mock).mockReturnValue(replyData);
        (forumService.createForumReply as jest.Mock).mockRejectedValue(error);

        await createForumReplyHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });

    describe("updateForumReplyByIdHandler", () => {
      it("should update reply successfully", async () => {
        const updateData = { content: "Updated reply" };
        const mockUpdatedReply = {
          _id: replyId,
          postId,
          authorId: userId,
          ...updateData,
        };

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
          userId,
          updateData
        );
        expect(mockRes.success).toHaveBeenCalledWith(200, {
          message: "Reply updated successfully",
          data: mockUpdatedReply,
        });
      });

      it("should handle unauthorized update", async () => {
        const updateData = { content: "Updated reply" };
        const error = new Error("You can only edit your own replies");
        mockReq.params = { postId, id: replyId };
        mockReq.body = updateData;
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumSchemas.replyIdSchema.parse as jest.Mock).mockReturnValue(replyId);
        (forumSchemas.updateForumReplySchema.parse as jest.Mock).mockReturnValue(updateData);
        (forumService.updateForumReplyById as jest.Mock).mockRejectedValue(error);

        await updateForumReplyByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(error);
      });
    });

    describe("deleteForumReplyByIdHandler", () => {
      it("should delete reply successfully", async () => {
        const mockResult = { deletedCount: 1 };

        mockReq.params = { postId, id: replyId };
        (forumSchemas.postIdSchema.parse as jest.Mock).mockReturnValue(postId);
        (forumSchemas.replyIdSchema.parse as jest.Mock).mockReturnValue(replyId);
        (forumService.deleteForumReplyById as jest.Mock).mockResolvedValue(mockResult);

        await deleteForumReplyByIdHandler(mockReq as Request, mockRes as Response, mockNext);

        expect(forumService.deleteForumReplyById).toHaveBeenCalledWith(postId, replyId, userId);
        expect(mockRes.success).toHaveBeenCalledWith(200, {
          message: "Reply deleted successfully",
          data: mockResult,
        });
      });

      it("should handle unauthorized delete", async () => {
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
});

