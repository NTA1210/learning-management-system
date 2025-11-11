// Forum Service Unit Tests
import mongoose from "mongoose";
import { ForumType } from "@/types/forum.type";

// Mock all models before importing services
jest.mock("@/models/forum.model");
jest.mock("@/models/forumPost.model");
jest.mock("@/models/forumReply.model");
jest.mock("@/utils/appAssert");

// Import models for mocking
import ForumModel from "@/models/forum.model";
import ForumPostModel from "@/models/forumPost.model";
import ForumReplyModel from "@/models/forumReply.model";
import appAssert from "@/utils/appAssert";

// Import services
import {
  listForumsOfACourse,
  getForumById,
  createForum,
  updateForumById,
  deleteForumById,
  listPostsInForum,
  getForumPostById,
  createForumPost,
  updateForumPostById,
  deleteForumPostById,
  listRepliesInPost,
  getForumReplyById,
  createForumReply,
  updateForumReplyById,
  deleteForumReplyById,
  ListForumParams,
  ListForumPostParams,
  ListForumReplyParams,
} from "@/services/forum.service";

describe("📝 Forum Service Unit Tests", () => {
  let courseId: mongoose.Types.ObjectId;
  let userId: mongoose.Types.ObjectId;
  let forumId: mongoose.Types.ObjectId;
  let postId: mongoose.Types.ObjectId;
  let replyId: mongoose.Types.ObjectId;
  let forum: any;
  let forumPost: any;
  let forumReply: any;

  beforeEach(() => {
    // Create mock IDs
    courseId = new mongoose.Types.ObjectId();
    userId = new mongoose.Types.ObjectId();
    forumId = new mongoose.Types.ObjectId();
    postId = new mongoose.Types.ObjectId();
    replyId = new mongoose.Types.ObjectId();

    // Create mock data
    forum = {
      _id: forumId,
      courseId,
      title: "General Discussion",
      description: "Discuss anything related to the course",
      forumType: ForumType.DISCUSSION,
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
      title: "First Post",
      content: "This is my first post in the forum",
      pinned: false,
      replyCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    forumReply = {
      _id: replyId,
      postId,
      authorId: userId,
      content: "This is a reply to the post",
      parentReplyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Reset all mocks
    jest.clearAllMocks();

    // appAssert: throw Error(message) when condition falsy
    (appAssert as unknown as jest.Mock).mockImplementation((condition: any, _code: any, message: string) => {
      if (!condition) throw new Error(message);
    });
  });

  // ====================================
  // FORUM TESTS
  // ====================================
  describe("Forum Operations", () => {
    describe("listForumsOfACourse", () => {
      it("should list forums with pagination", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([forum]),
        };
        (ForumModel.find as jest.Mock).mockReturnValue(mockQuery);
        (ForumModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params: ListForumParams = {
          page: 1,
          limit: 10,
          courseId: courseId.toString(),
        };

        const result = await listForumsOfACourse(params);

        expect(result).toBeDefined();
        expect(result.forums).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
        expect(result.pagination.page).toBe(1);
        expect(ForumModel.find).toHaveBeenCalled();
      });

      it("should throw error when courseId is missing", async () => {
        const params: ListForumParams = {
          page: 1,
          limit: 10,
          courseId: "",
        };

        await expect(listForumsOfACourse(params)).rejects.toThrow("Course ID is required");
      });

      it("should filter forums by search term", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([forum]),
        };
        (ForumModel.find as jest.Mock).mockReturnValue(mockQuery);
        (ForumModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params: ListForumParams = {
          page: 1,
          limit: 10,
          courseId: courseId.toString(),
          search: "Discussion",
        };

        const result = await listForumsOfACourse(params);

        expect(result).toBeDefined();
        expect(ForumModel.find).toHaveBeenCalledWith(
          expect.objectContaining({
            courseId: courseId.toString(),
            $or: [
              { title: { $regex: "Discussion", $options: "i" } },
              { description: { $regex: "Discussion", $options: "i" } },
            ],
          })
        );
      });

      it("should filter forums by forumType", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([forum]),
        };
        (ForumModel.find as jest.Mock).mockReturnValue(mockQuery);
        (ForumModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params: ListForumParams = {
          page: 1,
          limit: 10,
          courseId: courseId.toString(),
          forumType: ForumType.DISCUSSION,
        };

        const result = await listForumsOfACourse(params);

        expect(result).toBeDefined();
        expect(ForumModel.find).toHaveBeenCalledWith(
          expect.objectContaining({
            forumType: ForumType.DISCUSSION,
          })
        );
      });

      it("should filter forums by isActive status", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([forum]),
        };
        (ForumModel.find as jest.Mock).mockReturnValue(mockQuery);
        (ForumModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params: ListForumParams = {
          page: 1,
          limit: 10,
          courseId: courseId.toString(),
          isActive: true,
        };

        const result = await listForumsOfACourse(params);

        expect(result).toBeDefined();
        expect(ForumModel.find).toHaveBeenCalledWith(
          expect.objectContaining({
            isActive: true,
          })
        );
      });
    });

    describe("getForumById", () => {
      it("should get forum by ID successfully", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(forum),
        };
        (ForumModel.findById as jest.Mock).mockReturnValue(mockQuery);

        const result = await getForumById(forumId.toString());

        expect(result).toBeDefined();
        expect(result.title).toBe("General Discussion");
        expect(ForumModel.findById).toHaveBeenCalledWith(forumId.toString());
      });

      it("should throw error when forum not found", async () => {
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        };
        (ForumModel.findById as jest.Mock).mockReturnValue(mockQuery);

        await expect(getForumById(forumId.toString())).rejects.toThrow("Forum not found");
      });
    });

    describe("createForum", () => {
      it("should create forum successfully", async () => {
        (ForumModel.create as jest.Mock).mockResolvedValue(forum);

        const forumData = {
          courseId,
          title: "New Forum",
          description: "Test forum",
          forumType: ForumType.DISCUSSION,
          createdBy: userId,
        };

        const result = await createForum(forumData);

        expect(result).toBeDefined();
        expect(ForumModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            courseId,
            title: "New Forum",
            forumType: ForumType.DISCUSSION,
            isActive: true,
            isArchived: false,
          })
        );
      });

      it("should throw error when courseId is missing", async () => {
        const forumData = {
          courseId: null as any,
          title: "New Forum",
          forumType: ForumType.DISCUSSION,
        };

        await expect(createForum(forumData)).rejects.toThrow("Course ID is required");
      });

      it("should throw error when title is missing", async () => {
        const forumData = {
          courseId,
          title: "",
          forumType: ForumType.DISCUSSION,
        };

        await expect(createForum(forumData)).rejects.toThrow("Forum title is required");
      });
    });

    describe("updateForumById", () => {
      it("should update forum successfully", async () => {
        const updatedForum = { ...forum, title: "Updated Forum" };
        (ForumModel.findById as jest.Mock).mockResolvedValue({
          ...forum,
          save: jest.fn().mockResolvedValue(updatedForum),
        });

        const updateData = { title: "Updated Forum" };
        const result = await updateForumById(forumId.toString(), updateData);

        expect(result).toBeDefined();
        expect(ForumModel.findById).toHaveBeenCalledWith(forumId.toString());
      });

      it("should throw error when forum not found", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(null);

        const updateData = { title: "Updated Forum" };
        await expect(updateForumById(forumId.toString(), updateData)).rejects.toThrow("Forum not found");
      });
    });

    describe("deleteForumById", () => {
      it("should delete forum successfully when no posts exist", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(0);
        (ForumModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

        const result = await deleteForumById(forumId.toString());

        expect(result).toBeDefined();
        expect(ForumModel.deleteOne).toHaveBeenCalledWith({ _id: forumId.toString() });
      });

      it("should throw error when forum not found", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(deleteForumById(forumId.toString())).rejects.toThrow("Forum not found");
      });

      it("should throw error when posts exist in forum", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(5);

        await expect(deleteForumById(forumId.toString())).rejects.toThrow(
          "Cannot delete forum. 5 posts exist in this forum."
        );
      });
    });
  });

  // ====================================
  // FORUM POST TESTS
  // ====================================
  describe("Forum Post Operations", () => {
    describe("listPostsInForum", () => {
      it("should list posts with pagination", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([forumPost]),
        };
        (ForumPostModel.find as jest.Mock).mockReturnValue(mockQuery);
        (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params: ListForumPostParams = {
          page: 1,
          limit: 10,
          forumId: forumId.toString(),
        };

        const result = await listPostsInForum(params);

        expect(result).toBeDefined();
        expect(result.posts).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
        expect(ForumPostModel.find).toHaveBeenCalled();
      });

      it("should throw error when forumId is missing", async () => {
        const params: ListForumPostParams = {
          page: 1,
          limit: 10,
          forumId: "",
        };

        await expect(listPostsInForum(params)).rejects.toThrow("Forum ID is required");
      });

      it("should throw error when forum not found", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(null);

        const params: ListForumPostParams = {
          page: 1,
          limit: 10,
          forumId: forumId.toString(),
        };

        await expect(listPostsInForum(params)).rejects.toThrow("Forum not found");
      });

      it("should filter posts by search term", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([forumPost]),
        };
        (ForumPostModel.find as jest.Mock).mockReturnValue(mockQuery);
        (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params: ListForumPostParams = {
          page: 1,
          limit: 10,
          forumId: forumId.toString(),
          search: "First",
        };

        const result = await listPostsInForum(params);

        expect(result).toBeDefined();
        expect(ForumPostModel.find).toHaveBeenCalledWith(
          expect.objectContaining({
            forumId: forumId.toString(),
            $or: [
              { title: { $regex: "First", $options: "i" } },
              { content: { $regex: "First", $options: "i" } },
            ],
          })
        );
      });

      it("should filter posts by pinned status", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([forumPost]),
        };
        (ForumPostModel.find as jest.Mock).mockReturnValue(mockQuery);
        (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params: ListForumPostParams = {
          page: 1,
          limit: 10,
          forumId: forumId.toString(),
          pinned: true,
        };

        const result = await listPostsInForum(params);

        expect(result).toBeDefined();
        expect(ForumPostModel.find).toHaveBeenCalledWith(
          expect.objectContaining({
            pinned: true,
          })
        );
      });
    });

    describe("getForumPostById", () => {
      it("should get post by ID successfully", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(forumPost),
        };
        (ForumPostModel.findOne as jest.Mock).mockReturnValue(mockQuery);

        const result = await getForumPostById(forumId.toString(), postId.toString());

        expect(result).toBeDefined();
        expect(result.title).toBe("First Post");
        expect(ForumPostModel.findOne).toHaveBeenCalledWith({
          _id: postId.toString(),
          forumId: forumId.toString(),
        });
      });

      it("should throw error when forum not found", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(getForumPostById(forumId.toString(), postId.toString())).rejects.toThrow("Forum not found");
      });

      it("should throw error when post not found", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        };
        (ForumPostModel.findOne as jest.Mock).mockReturnValue(mockQuery);

        await expect(getForumPostById(forumId.toString(), postId.toString())).rejects.toThrow("Post not found");
      });
    });

    describe("createForumPost", () => {
      it("should create post successfully in discussion forum", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumPostModel.create as jest.Mock).mockResolvedValue(forumPost);

        const postData = {
          forumId,
          authorId: userId,
          title: "New Post",
          content: "This is a new post",
        };

        const result = await createForumPost(postData);

        expect(result).toBeDefined();
        expect(ForumPostModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            forumId,
            content: "This is a new post",
            pinned: false,
            replyCount: 0,
          })
        );
      });

      it("should throw error when forum not found", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(null);

        const postData = {
          forumId,
          authorId: userId,
          content: "New post content",
        };

        await expect(createForumPost(postData)).rejects.toThrow("Forum not found");
      });

      it("should throw error when forum is inactive", async () => {
        const inactiveForum = { ...forum, isActive: false };
        (ForumModel.findById as jest.Mock).mockResolvedValue(inactiveForum);

        const postData = {
          forumId,
          authorId: userId,
          content: "New post content",
        };

        await expect(createForumPost(postData)).rejects.toThrow("Cannot post in an inactive forum");
      });

      it("should throw error when forum is archived", async () => {
        const archivedForum = { ...forum, isArchived: true };
        (ForumModel.findById as jest.Mock).mockResolvedValue(archivedForum);

        const postData = {
          forumId,
          authorId: userId,
          content: "New post content",
        };

        await expect(createForumPost(postData)).rejects.toThrow("Cannot post in an archived forum");
      });

      it("should throw error when posting in announcement forum", async () => {
        const announcementForum = { ...forum, forumType: ForumType.ANNOUNCEMENT };
        (ForumModel.findById as jest.Mock).mockResolvedValue(announcementForum);

        const postData = {
          forumId,
          authorId: userId,
          content: "New post content",
        };

        await expect(createForumPost(postData)).rejects.toThrow("You don't have permission to post in this forum");
      });

      it("should throw error when content is missing", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);

        const postData = {
          forumId,
          authorId: userId,
          content: "",
        };

        await expect(createForumPost(postData)).rejects.toThrow("Post content is required");
      });
    });

    describe("updateForumPostById", () => {
      it("should update post successfully when user is author", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumPostModel.findOne as jest.Mock).mockResolvedValue({
          ...forumPost,
          save: jest.fn().mockResolvedValue({ ...forumPost, title: "Updated Post" }),
        });

        const updateData = { title: "Updated Post" };
        const result = await updateForumPostById(
          forumId.toString(),
          postId.toString(),
          userId.toString(),
          updateData
        );

        expect(result).toBeDefined();
        expect(ForumPostModel.findOne).toHaveBeenCalledWith({
          _id: postId.toString(),
          forumId: forumId.toString(),
        });
      });

      it("should throw error when forum not found", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(null);

        const updateData = { title: "Updated Post" };
        await expect(
          updateForumPostById(forumId.toString(), postId.toString(), userId.toString(), updateData)
        ).rejects.toThrow("Forum not found");
      });

      it("should throw error when post not found", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumPostModel.findOne as jest.Mock).mockResolvedValue(null);

        const updateData = { title: "Updated Post" };
        await expect(
          updateForumPostById(forumId.toString(), postId.toString(), userId.toString(), updateData)
        ).rejects.toThrow("Post not found");
      });

      it("should throw error when user is not the author", async () => {
        const differentUserId = new mongoose.Types.ObjectId();
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumPostModel.findOne as jest.Mock).mockResolvedValue(forumPost);

        const updateData = { title: "Updated Post" };
        await expect(
          updateForumPostById(forumId.toString(), postId.toString(), differentUserId.toString(), updateData)
        ).rejects.toThrow("You can only edit your own posts");
      });
    });

    describe("deleteForumPostById", () => {
      it("should delete post successfully when user is author", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumPostModel.findOne as jest.Mock).mockResolvedValue(forumPost);
        (ForumReplyModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
        (ForumPostModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

        const result = await deleteForumPostById(forumId.toString(), postId.toString(), userId.toString());

        expect(result).toBeDefined();
        expect(ForumReplyModel.deleteMany).toHaveBeenCalledWith({ postId: postId.toString() });
        expect(ForumPostModel.deleteOne).toHaveBeenCalledWith({ _id: postId.toString() });
      });

      it("should throw error when forum not found", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(
          deleteForumPostById(forumId.toString(), postId.toString(), userId.toString())
        ).rejects.toThrow("Forum not found");
      });

      it("should throw error when post not found", async () => {
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumPostModel.findOne as jest.Mock).mockResolvedValue(null);

        await expect(
          deleteForumPostById(forumId.toString(), postId.toString(), userId.toString())
        ).rejects.toThrow("Post not found");
      });

      it("should throw error when user is not the author", async () => {
        const differentUserId = new mongoose.Types.ObjectId();
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumPostModel.findOne as jest.Mock).mockResolvedValue(forumPost);

        await expect(
          deleteForumPostById(forumId.toString(), postId.toString(), differentUserId.toString())
        ).rejects.toThrow("You can only delete your own posts");
      });
    });
  });

  // ====================================
  // FORUM REPLY TESTS
  // ====================================
  describe("Forum Reply Operations", () => {
    describe("listRepliesInPost", () => {
      it("should list replies with pagination", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([forumReply]),
        };
        (ForumReplyModel.find as jest.Mock).mockReturnValue(mockQuery);
        (ForumReplyModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params: ListForumReplyParams = {
          page: 1,
          limit: 20,
          postId: postId.toString(),
        };

        const result = await listRepliesInPost(params);

        expect(result).toBeDefined();
        expect(result.replies).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
        expect(ForumReplyModel.find).toHaveBeenCalled();
      });

      it("should throw error when postId is missing", async () => {
        const params: ListForumReplyParams = {
          page: 1,
          limit: 20,
          postId: "",
        };

        await expect(listRepliesInPost(params)).rejects.toThrow("Post ID is required");
      });

      it("should throw error when post not found", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(null);

        const params: ListForumReplyParams = {
          page: 1,
          limit: 20,
          postId: postId.toString(),
        };

        await expect(listRepliesInPost(params)).rejects.toThrow("Post not found");
      });

      it("should filter replies by search term", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([forumReply]),
        };
        (ForumReplyModel.find as jest.Mock).mockReturnValue(mockQuery);
        (ForumReplyModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const params: ListForumReplyParams = {
          page: 1,
          limit: 20,
          postId: postId.toString(),
          search: "reply",
        };

        const result = await listRepliesInPost(params);

        expect(result).toBeDefined();
        expect(ForumReplyModel.find).toHaveBeenCalledWith(
          expect.objectContaining({
            postId: postId.toString(),
            content: { $regex: "reply", $options: "i" },
          })
        );
      });

      it("should filter replies by parentReplyId", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue([forumReply]),
        };
        (ForumReplyModel.find as jest.Mock).mockReturnValue(mockQuery);
        (ForumReplyModel.countDocuments as jest.Mock).mockResolvedValue(1);

        const parentId = new mongoose.Types.ObjectId().toString();
        const params: ListForumReplyParams = {
          page: 1,
          limit: 20,
          postId: postId.toString(),
          parentReplyId: parentId,
        };

        const result = await listRepliesInPost(params);

        expect(result).toBeDefined();
        expect(ForumReplyModel.find).toHaveBeenCalledWith(
          expect.objectContaining({
            parentReplyId: parentId,
          })
        );
      });
    });

    describe("getForumReplyById", () => {
      it("should get reply by ID successfully", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(forumReply),
        };
        (ForumReplyModel.findOne as jest.Mock).mockReturnValue(mockQuery);

        const result = await getForumReplyById(postId.toString(), replyId.toString());

        expect(result).toBeDefined();
        expect(result.content).toBe("This is a reply to the post");
        expect(ForumReplyModel.findOne).toHaveBeenCalledWith({
          _id: replyId.toString(),
          postId: postId.toString(),
        });
      });

      it("should throw error when post not found", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(getForumReplyById(postId.toString(), replyId.toString())).rejects.toThrow("Post not found");
      });

      it("should throw error when reply not found", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        const mockQuery = {
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        };
        (ForumReplyModel.findOne as jest.Mock).mockReturnValue(mockQuery);

        await expect(getForumReplyById(postId.toString(), replyId.toString())).rejects.toThrow("Reply not found");
      });
    });

    describe("createForumReply", () => {
      it("should create reply successfully", async () => {
        const postWithForumId = { ...forumPost, forumId };
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(postWithForumId);
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumReplyModel.create as jest.Mock).mockResolvedValue(forumReply);
        (ForumPostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(forumPost);

        const replyData = {
          postId,
          authorId: userId,
          content: "This is a reply",
        };

        const result = await createForumReply(replyData);

        expect(result).toBeDefined();
        expect(ForumReplyModel.create).toHaveBeenCalledWith(replyData);
        expect(ForumPostModel.findByIdAndUpdate).toHaveBeenCalledWith(postId, {
          $inc: { replyCount: 1 },
        });
      });

      it("should create nested reply successfully", async () => {
        const parentReplyId = new mongoose.Types.ObjectId();
        const parentReply = { ...forumReply, _id: parentReplyId };
        const postWithForumId = { ...forumPost, forumId };

        (ForumPostModel.findById as jest.Mock).mockResolvedValue(postWithForumId);
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(parentReply);
        (ForumReplyModel.create as jest.Mock).mockResolvedValue(forumReply);
        (ForumPostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(forumPost);

        const replyData = {
          postId,
          authorId: userId,
          content: "This is a nested reply",
          parentReplyId,
        };

        const result = await createForumReply(replyData);

        expect(result).toBeDefined();
        expect(ForumReplyModel.findOne).toHaveBeenCalledWith({
          _id: parentReplyId,
          postId,
        });
      });

      it("should throw error when post not found", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(null);

        const replyData = {
          postId,
          authorId: userId,
          content: "This is a reply",
        };

        await expect(createForumReply(replyData)).rejects.toThrow("Post not found");
      });

      it("should throw error when forum not found", async () => {
        const postWithForumId = { ...forumPost, forumId };
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(postWithForumId);
        (ForumModel.findById as jest.Mock).mockResolvedValue(null);

        const replyData = {
          postId,
          authorId: userId,
          content: "This is a reply",
        };

        await expect(createForumReply(replyData)).rejects.toThrow("Forum not found");
      });

      it("should throw error when forum is inactive", async () => {
        const postWithForumId = { ...forumPost, forumId };
        const inactiveForum = { ...forum, isActive: false };
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(postWithForumId);
        (ForumModel.findById as jest.Mock).mockResolvedValue(inactiveForum);

        const replyData = {
          postId,
          authorId: userId,
          content: "This is a reply",
        };

        await expect(createForumReply(replyData)).rejects.toThrow("Cannot reply in an inactive forum");
      });

      it("should throw error when forum is archived", async () => {
        const postWithForumId = { ...forumPost, forumId };
        const archivedForum = { ...forum, isArchived: true };
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(postWithForumId);
        (ForumModel.findById as jest.Mock).mockResolvedValue(archivedForum);

        const replyData = {
          postId,
          authorId: userId,
          content: "This is a reply",
        };

        await expect(createForumReply(replyData)).rejects.toThrow("Cannot reply in an archived forum");
      });

      it("should throw error when parent reply not found", async () => {
        const parentReplyId = new mongoose.Types.ObjectId();
        const postWithForumId = { ...forumPost, forumId };
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(postWithForumId);
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(null);

        const replyData = {
          postId,
          authorId: userId,
          content: "This is a nested reply",
          parentReplyId,
        };

        await expect(createForumReply(replyData)).rejects.toThrow("Parent reply not found");
      });

      it("should throw error when content is missing", async () => {
        const postWithForumId = { ...forumPost, forumId };
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(postWithForumId);
        (ForumModel.findById as jest.Mock).mockResolvedValue(forum);

        const replyData = {
          postId,
          authorId: userId,
          content: "",
        };

        await expect(createForumReply(replyData)).rejects.toThrow("Reply content is required");
      });
    });

    describe("updateForumReplyById", () => {
      it("should update reply successfully when user is author", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        (ForumReplyModel.findOne as jest.Mock).mockResolvedValue({
          ...forumReply,
          save: jest.fn().mockResolvedValue({ ...forumReply, content: "Updated reply" }),
        });

        const updateData = { content: "Updated reply" };
        const result = await updateForumReplyById(
          postId.toString(),
          replyId.toString(),
          userId.toString(),
          updateData
        );

        expect(result).toBeDefined();
        expect(ForumReplyModel.findOne).toHaveBeenCalledWith({
          _id: replyId.toString(),
          postId: postId.toString(),
        });
      });

      it("should throw error when post not found", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(null);

        const updateData = { content: "Updated reply" };
        await expect(
          updateForumReplyById(postId.toString(), replyId.toString(), userId.toString(), updateData)
        ).rejects.toThrow("Post not found");
      });

      it("should throw error when reply not found", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(null);

        const updateData = { content: "Updated reply" };
        await expect(
          updateForumReplyById(postId.toString(), replyId.toString(), userId.toString(), updateData)
        ).rejects.toThrow("Reply not found");
      });

      it("should throw error when user is not the author", async () => {
        const differentUserId = new mongoose.Types.ObjectId();
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(forumReply);

        const updateData = { content: "Updated reply" };
        await expect(
          updateForumReplyById(postId.toString(), replyId.toString(), differentUserId.toString(), updateData)
        ).rejects.toThrow("You can only edit your own replies");
      });
    });

    describe("deleteForumReplyById", () => {
      it("should delete reply successfully when user is author", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(forumReply);
        (ForumReplyModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 });
        (ForumPostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(forumPost);
        (ForumReplyModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

        const result = await deleteForumReplyById(postId.toString(), replyId.toString(), userId.toString());

        expect(result).toBeDefined();
        expect(ForumReplyModel.deleteMany).toHaveBeenCalledWith({ parentReplyId: replyId.toString() });
        expect(ForumPostModel.findByIdAndUpdate).toHaveBeenCalledWith(postId.toString(), {
          $inc: { replyCount: -1 },
        });
        expect(ForumReplyModel.deleteOne).toHaveBeenCalledWith({ _id: replyId.toString() });
      });

      it("should throw error when post not found", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(
          deleteForumReplyById(postId.toString(), replyId.toString(), userId.toString())
        ).rejects.toThrow("Post not found");
      });

      it("should throw error when reply not found", async () => {
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(null);

        await expect(
          deleteForumReplyById(postId.toString(), replyId.toString(), userId.toString())
        ).rejects.toThrow("Reply not found");
      });

      it("should throw error when user is not the author", async () => {
        const differentUserId = new mongoose.Types.ObjectId();
        (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(forumReply);

        await expect(
          deleteForumReplyById(postId.toString(), replyId.toString(), differentUserId.toString())
        ).rejects.toThrow("You can only delete your own replies");
      });
    });
  });
});

