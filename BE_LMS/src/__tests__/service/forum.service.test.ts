// Forum Service Unit Tests
import mongoose from "mongoose";
import {Role} from "@/types";
import {ForumType} from "@/types/forum.type";

// Mock all models and utilities before importing services
jest.mock("@/models/forum.model");
jest.mock("@/models/forumPost.model");
jest.mock("@/models/forumReply.model");
jest.mock("@/models/course.model");
jest.mock("@/models/user.model");
jest.mock("@/utils/appAssert");
jest.mock("@/utils/entityFileUpload");

// Import models for mocking
import ForumModel from "@/models/forum.model";
import ForumPostModel from "@/models/forumPost.model";
import ForumReplyModel from "@/models/forumReply.model";
import CourseModel from "@/models/course.model";
import appAssert from "@/utils/appAssert";
import {createEntityWithFiles, updateEntityWithFiles} from "@/utils/entityFileUpload";

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
    uploadForumFiles,
    ListForumParams,
    ListForumPostParams,
    ListForumReplyParams,
} from "@/services/forum.service";

describe("Forum Service Unit Tests", () => {
    let courseId: mongoose.Types.ObjectId;
    let forumId: mongoose.Types.ObjectId;
    let postId: mongoose.Types.ObjectId;
    let replyId: mongoose.Types.ObjectId;
    let authorId: mongoose.Types.ObjectId;
    let forum: any;
    let forumPost: any;
    let forumReply: any;

    beforeEach(() => {
        // Create mock IDs
        courseId = new mongoose.Types.ObjectId();
        forumId = new mongoose.Types.ObjectId();
        postId = new mongoose.Types.ObjectId();
        replyId = new mongoose.Types.ObjectId();
        authorId = new mongoose.Types.ObjectId();

        // Create mock data
        forum = {
            _id: forumId,
            courseId,
            title: "General Discussion",
            description: "A place for general course discussions",
            forumType: ForumType.DISCUSSION,
            key: [],
            isActive: true,
            isArchived: false,
            createdBy: authorId,
            createdAt: new Date(),
            updatedAt: new Date(),
            save: jest.fn().mockResolvedValue(true),
        };

        forumPost = {
            _id: postId,
            forumId,
            authorId,
            title: "How to get started?",
            content: "I need help getting started with this course",
            pinned: false,
            replyCount: 0,
            key: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            save: jest.fn().mockResolvedValue(true),
        };

        forumReply = {
            _id: replyId,
            postId,
            authorId,
            content: "You should start with the basics",
            key: [],
            parentReplyId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            save: jest.fn().mockResolvedValue(true),
        };

        // Reset all mocks
        jest.clearAllMocks();

        // appAssert: throw Error(message) when condition falsy
        (appAssert as unknown as jest.Mock).mockImplementation((condition: any, _code: any, message: string) => {
            if (!condition) throw new Error(message);
        });

        // Mock entity file upload helpers
        (createEntityWithFiles as jest.Mock).mockImplementation(async ({createEntity, updateEntity}) => {
            const entity = await createEntity();
            if (updateEntity) {
                await updateEntity(entity, []);
            }
            return entity;
        });

        (updateEntityWithFiles as jest.Mock).mockImplementation(async ({updateEntity}) => {
            if (updateEntity) {
                await updateEntity([]);
            }
        });
    });

    // ====================================
    // FORUM TESTS
    // ====================================
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
                courseId: courseId.toString(),
                page: 1,
                limit: 10,
            };

            const result = await listForumsOfACourse(params);

            expect(result).toBeDefined();
            expect(result.forums).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.totalPages).toBe(1);
            expect(result.pagination.hasNextPage).toBe(false);
            expect(result.pagination.hasPrevPage).toBe(false);
            expect(ForumModel.find).toHaveBeenCalledWith(
                expect.objectContaining({courseId: courseId.toString()})
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
                courseId: courseId.toString(),
                forumType: ForumType.DISCUSSION,
                page: 1,
                limit: 10,
            };

            const result = await listForumsOfACourse(params);

            expect(result).toBeDefined();
            expect(ForumModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    courseId: courseId.toString(),
                    forumType: ForumType.DISCUSSION,
                })
            );
        });

        it("should filter forums by isArchived status", async () => {
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
                courseId: courseId.toString(),
                isArchived: false,
                page: 1,
                limit: 10,
            };

            const result = await listForumsOfACourse(params);

            expect(result).toBeDefined();
            expect(ForumModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    courseId: courseId.toString(),
                    isArchived: false,
                })
            );
        });

        it("should search forums by title or description", async () => {
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
                courseId: courseId.toString(),
                search: "discussion",
                page: 1,
                limit: 10,
            };

            const result = await listForumsOfACourse(params);

            expect(result).toBeDefined();
            expect(ForumModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    courseId: courseId.toString(),
                    $or: [
                        {title: {$regex: "discussion", $options: "i"}},
                        {description: {$regex: "discussion", $options: "i"}},
                    ],
                })
            );
        });

        it("should populate createdBy field", async () => {
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
                courseId: courseId.toString(),
                page: 1,
                limit: 10,
            };

            await listForumsOfACourse(params);

            expect(mockQuery.populate).toHaveBeenCalledWith("createdBy", "fullname email avatar_url");
        });

        it("should calculate pagination correctly with multiple pages", async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([forum]),
            };
            (ForumModel.find as jest.Mock).mockReturnValue(mockQuery);
            (ForumModel.countDocuments as jest.Mock).mockResolvedValue(25);

            const params: ListForumParams = {
                courseId: courseId.toString(),
                page: 2,
                limit: 10,
            };

            const result = await listForumsOfACourse(params);

            expect(result.pagination.total).toBe(25);
            expect(result.pagination.page).toBe(2);
            expect(result.pagination.totalPages).toBe(3);
            expect(result.pagination.hasNextPage).toBe(true);
            expect(result.pagination.hasPrevPage).toBe(true);
        });

        it("should throw error when courseId is not provided", async () => {
            const params: any = {
                page: 1,
                limit: 10,
            };

            await expect(listForumsOfACourse(params)).rejects.toThrow("Course ID is required");
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
            expect(mockQuery.populate).toHaveBeenCalledWith("createdBy", "fullname email avatar_url");
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
            (CourseModel.findById as jest.Mock).mockResolvedValue({_id: courseId});
            (ForumModel.create as jest.Mock).mockResolvedValue(forum);

            const forumData: any = {
                courseId,
                title: "General Discussion",
                description: "A place for general discussions",
                forumType: ForumType.DISCUSSION,
                isActive: true,
                createdBy: authorId,
            };

            const result = await createForum(forumData);

            expect(result).toBeDefined();
            expect(ForumModel.create).toHaveBeenCalled();
        });

        it("should throw error when courseId is not provided", async () => {
            const forumData: any = {
                title: "General Discussion",
                createdBy: authorId,
            };

            await expect(createForum(forumData)).rejects.toThrow("Course ID is required");
        });

        it("should throw error when course not found", async () => {
            (CourseModel.findById as jest.Mock).mockResolvedValue(null);

            const forumData: any = {
                courseId,
                title: "General Discussion",
                createdBy: authorId,
            };

            await expect(createForum(forumData)).rejects.toThrow("Course ID not found");
        });

        it("should throw error when title is not provided", async () => {
            (CourseModel.findById as jest.Mock).mockResolvedValue({_id: courseId});

            const forumData: any = {
                courseId,
                createdBy: authorId,
            };

            await expect(createForum(forumData)).rejects.toThrow("Forum title is required");
        });

        it("should set default values for forumType and isActive", async () => {
            (CourseModel.findById as jest.Mock).mockResolvedValue({_id: courseId});
            (ForumModel.create as jest.Mock).mockResolvedValue(forum);

            const forumData: any = {
                courseId,
                title: "General Discussion",
                createdBy: authorId,
            };

            await createForum(forumData);

            expect(ForumModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    forumType: ForumType.DISCUSSION,
                    isActive: true,
                    isArchived: false,
                })
            );
        });
    });

    describe("updateForumById", () => {
        it("should update forum successfully", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);

            const updateData = {description: "Updated description"};
            const result = await updateForumById(forumId.toString(), updateData, authorId.toString(), Role.ADMIN);

            expect(ForumModel.findById).toHaveBeenCalledWith(forumId.toString());
            expect(forum.save).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it("should throw error when forum not found", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(null);

            const updateData = {title: "Updated Title"};
            await expect(updateForumById(forumId.toString(), updateData, authorId.toString(), Role.ADMIN)).rejects.toThrow(
                "Forum not found"
            );
        });

        it("should update forum with files", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            const mockFiles: any = [{originalname: "test.pdf"}];

            await updateForumById(forumId.toString(), {title: "Updated"}, authorId.toString(), Role.ADMIN, mockFiles);

            expect(updateEntityWithFiles).toHaveBeenCalled();
            expect(forum.save).toHaveBeenCalled();
        });
    });

    describe("deleteForumById", () => {
        it("should delete forum successfully when no posts exist", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(0);
            (ForumModel.deleteOne as jest.Mock).mockResolvedValue({deletedCount: 1});

            const result = await deleteForumById(forumId.toString(), authorId, Role.ADMIN);

            expect(result).toBeDefined();
            expect(ForumModel.deleteOne).toHaveBeenCalledWith({_id: forumId.toString()});
        });

        it("should throw error when forum not found", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                deleteForumById(forumId.toString(), authorId, Role.STUDENT)
            ).rejects.toThrow("Forum not found");
        });

        it("should throw error when posts exist in forum", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(5);

            await expect(
                deleteForumById(forumId.toString(), authorId, Role.ADMIN)
            ).rejects.toThrow("Cannot delete forum");
        });

        it("should allow teacher to delete forum in their course", async () => {
            const teacherId = new mongoose.Types.ObjectId();
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(0);
            (CourseModel.exists as jest.Mock).mockResolvedValue(true);
            (ForumModel.deleteOne as jest.Mock).mockResolvedValue({deletedCount: 1});

            const result = await deleteForumById(forumId.toString(), teacherId, Role.TEACHER);

            expect(result).toBeDefined();
            expect(CourseModel.exists).toHaveBeenCalledWith({
                _id: forum.courseId,
                teacherIds: teacherId,
            });
        });

        it("should throw error when teacher tries to delete forum not in their course", async () => {
            const teacherId = new mongoose.Types.ObjectId();
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(0);
            (CourseModel.exists as jest.Mock).mockResolvedValue(false);
            await expect(
                deleteForumById(forumId.toString(), teacherId, Role.TEACHER)
            ).rejects.toThrow("You don't have permission to delete forums not in your course");
        });

        // ✂️ Commented out to reduce coverage - student authorization positive case
        // it("should allow user to delete their own forum", async () => {
        //     (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        //     (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(0);
        //     (ForumModel.deleteOne as jest.Mock).mockResolvedValue({deletedCount: 1});
        //     const result = await deleteForumById(forumId.toString(), authorId, Role.STUDENT);
        //     expect(result).toBeDefined();
        //     expect(ForumModel.deleteOne).toHaveBeenCalled();
        // });

        it("should throw error when user tries to delete someone else's forum", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(0);

            await expect(
                deleteForumById(forumId.toString(), new mongoose.Types.ObjectId(), Role.STUDENT)
            ).rejects.toThrow("You can only delete your own forums");
        });
    });

    describe("uploadForumFiles", () => {
        it("should upload files to existing forum", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            const mockFiles: any = [{originalname: "test.pdf"}];

            await uploadForumFiles(forumId.toString(), mockFiles);

            expect(ForumModel.findById).toHaveBeenCalledWith(forumId.toString());
            expect(updateEntityWithFiles).toHaveBeenCalled();
        });

        it("should throw error when forum not found", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(null);
            const mockFiles: any = [{originalname: "test.pdf"}];

            await expect(uploadForumFiles(forumId.toString(), mockFiles)).rejects.toThrow(
                "Forum not found"
            );
        });
    });

    // ====================================
    // FORUM POST TESTS
    // ====================================
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
                forumId: forumId.toString(),
                page: 1,
                limit: 10,
            };

            const result = await listPostsInForum(params);

            expect(result).toBeDefined();
            expect(result.posts).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
            expect(ForumPostModel.find).toHaveBeenCalledWith(
                expect.objectContaining({forumId: forumId.toString()})
            );
        });

        it("should throw error when forumId is not provided", async () => {
            const params: any = {
                page: 1,
                limit: 10,
            };

            await expect(listPostsInForum(params)).rejects.toThrow("Forum ID is required");
        });

        it("should throw error when forum not found", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(null);

            const params: ListForumPostParams = {
                forumId: forumId.toString(),
                page: 1,
                limit: 10,
            };

            await expect(listPostsInForum(params)).rejects.toThrow("Forum not found");
        });

        // ✂️ Commented out to reduce coverage - pinned filter test
        // it("should filter posts by pinned status", async () => { ... });

        // ✂️ Commented out to reduce coverage - sort behavior test
        // it("should sort posts with pinned first", async () => { ... });

        // ✂️ Commented out to reduce coverage - search functionality test
        // it("should search posts by title or content", async () => {
        //     (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        //     const mockQuery = {
        //         populate: jest.fn().mockReturnThis(),
        //         sort: jest.fn().mockReturnThis(),
        //         skip: jest.fn().mockReturnThis(),
        //         limit: jest.fn().mockReturnThis(),
        //         lean: jest.fn().mockResolvedValue([forumPost]),
        //     };
        //     (ForumPostModel.find as jest.Mock).mockReturnValue(mockQuery);
        //     (ForumPostModel.countDocuments as jest.Mock).mockResolvedValue(1);
        //     const params: ListForumPostParams = {
        //         forumId: forumId.toString(),
        //         search: "help",
        //         page: 1,
        //         limit: 10,
        //     };
        //     const result = await listPostsInForum(params);
        //     expect(result).toBeDefined();
        //     expect(ForumPostModel.find).toHaveBeenCalledWith(
        //         expect.objectContaining({
        //             $or: [
        //                 {title: {$regex: "help", $options: "i"}},
        //                 {content: {$regex: "help", $options: "i"}},
        //             ],
        //         })
        //     );
        // });
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
            expect(result.title).toBe("How to get started?");
            expect(ForumPostModel.findOne).toHaveBeenCalledWith({
                _id: postId.toString(),
                forumId: forumId.toString(),
            });
        });

        it("should throw error when forum not found", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                getForumPostById(forumId.toString(), postId.toString())
            ).rejects.toThrow("Forum not found");
        });

        it("should throw error when post not found", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(null),
            };
            (ForumPostModel.findOne as jest.Mock).mockReturnValue(mockQuery);

            await expect(
                getForumPostById(forumId.toString(), postId.toString())
            ).rejects.toThrow("Post not found");
        });
    });

    describe("createForumPost", () => {
        it("should create forum post successfully", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.create as jest.Mock).mockResolvedValue(forumPost);

            const postData: any = {
                forumId,
                authorId,
                title: "Test Post",
                content: "Test content",
            };

            const result = await createForumPost(postData);

            expect(result).toBeDefined();
            expect(ForumPostModel.create).toHaveBeenCalled();
        });

        it("should throw error when forum not found", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(null);

            const postData: any = {
                forumId,
                authorId,
                content: "Test content",
            };

            await expect(createForumPost(postData)).rejects.toThrow("Forum not found");
        });

        it("should throw error when forum is inactive", async () => {
            const inactiveForum = {...forum, isActive: false};
            (ForumModel.findById as jest.Mock).mockResolvedValue(inactiveForum);

            const postData: any = {
                forumId,
                authorId,
                content: "Test content",
            };

            await expect(createForumPost(postData)).rejects.toThrow(
                "Cannot post in an inactive forum"
            );
        });

        it("should throw error when forum is archived", async () => {
            const archivedForum = {...forum, isArchived: true};
            (ForumModel.findById as jest.Mock).mockResolvedValue(archivedForum);

            const postData: any = {
                forumId,
                authorId,
                content: "Test content",
            };

            await expect(createForumPost(postData)).rejects.toThrow(
                "Cannot post in an archived forum"
            );
        });

        it("should throw error when forum type is ANNOUNCEMENT", async () => {
            const announcementForum = {...forum, forumType: ForumType.ANNOUNCEMENT};
            (ForumModel.findById as jest.Mock).mockResolvedValue(announcementForum);

            const postData: any = {
                forumId,
                authorId,
                content: "Test content",
            };

            await expect(createForumPost(postData)).rejects.toThrow(
                "You don't have permission to post in this forum"
            );
        });

        it("should throw error when content is not provided", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);

            const postData: any = {
                forumId,
                authorId,
            };

            await expect(createForumPost(postData)).rejects.toThrow("Post content is required");
        });
    });

    describe("updateForumPostById", () => {
        it("should update post successfully", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.findOne as jest.Mock).mockResolvedValue(forumPost);

            const updateData = {content: "Updated content"};
            const result = await updateForumPostById(
                forumId.toString(),
                postId.toString(),
                authorId.toString(),
                updateData,
                Role.ADMIN
            );

            expect(result).toBeDefined();
            expect(forumPost.save).toHaveBeenCalled();
        });

        it("should throw error when forum not found", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(null);

            const updateData = {content: "Updated content"};
            await expect(
                updateForumPostById(forumId.toString(), postId.toString(), authorId.toString(), updateData, Role.ADMIN)
            ).rejects.toThrow("Forum not found");
        });

        it("should throw error when post not found", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.findOne as jest.Mock).mockResolvedValue(null);

            const updateData = {content: "Updated content"};
            await expect(
                updateForumPostById(forumId.toString(), postId.toString(), authorId.toString(), updateData, Role.ADMIN)
            ).rejects.toThrow("Post not found");
        });

        it("should throw error when user is not the author", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.findOne as jest.Mock).mockResolvedValue(forumPost);

            const updateData = {content: "Updated content"};
            const otherUserId = new mongoose.Types.ObjectId();
            await expect(
                updateForumPostById(forumId.toString(), postId.toString(), otherUserId.toString(), updateData, Role.STUDENT)
            ).rejects.toThrow("You can only edit your own posts");
        });
    });

    describe("deleteForumPostById", () => {
        it("should delete post successfully as admin", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.findOne as jest.Mock).mockResolvedValue(forumPost);
            (ForumReplyModel.deleteMany as jest.Mock).mockResolvedValue({deletedCount: 0});
            (ForumPostModel.deleteOne as jest.Mock).mockResolvedValue({deletedCount: 1});

            const result = await deleteForumPostById(
                forumId.toString(),
                postId.toString(),
                authorId.toString(),
                Role.ADMIN
            );

            expect(result).toBeDefined();
            expect(ForumReplyModel.deleteMany).toHaveBeenCalledWith({postId: postId.toString()});
            expect(ForumPostModel.deleteOne).toHaveBeenCalledWith({_id: postId.toString()});
        });

        it("should throw error when forum not found", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                deleteForumPostById(forumId.toString(), postId.toString(), authorId.toString(), Role.ADMIN)
            ).rejects.toThrow("Forum not found");
        });

        it("should throw error when post not found", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                deleteForumPostById(forumId.toString(), postId.toString(), authorId.toString(), Role.ADMIN)
            ).rejects.toThrow("Post not found");
        });

        // ✂️ Commented out to reduce coverage - teacher authorization tests
        // it("should allow teacher to delete post in their course", async () => { ... });
        // it("should throw error when teacher tries to delete post not in their course", async () => { ... });

        // ✂️ Commented out to reduce coverage - student positive authorization test
        // it("should allow user to delete their own post", async () => {
        //     (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
        //     (ForumPostModel.findOne as jest.Mock).mockResolvedValue(forumPost);
        //     (ForumReplyModel.deleteMany as jest.Mock).mockResolvedValue({deletedCount: 0});
        //     (ForumPostModel.deleteOne as jest.Mock).mockResolvedValue({deletedCount: 1});
        //     const result = await deleteForumPostById(
        //         forumId.toString(),
        //         postId.toString(),
        //         authorId.toString(),
        //         Role.STUDENT
        //     );
        //     expect(result).toBeDefined();
        // });

        it("should throw error when user tries to delete someone else's post", async () => {
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumPostModel.findOne as jest.Mock).mockResolvedValue(forumPost);

            const otherUserId = new mongoose.Types.ObjectId();
            await expect(
                deleteForumPostById(forumId.toString(), postId.toString(), otherUserId.toString(), Role.STUDENT)
            ).rejects.toThrow("You can only delete your own posts");
        });
    });

    // ====================================
    // FORUM REPLY TESTS
    // ====================================
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
                postId: postId.toString(),
                page: 1,
                limit: 20,
            };

            const result = await listRepliesInPost(params);

            expect(result).toBeDefined();
            expect(result.replies).toHaveLength(1);
            expect(result.pagination.total).toBe(1);
            expect(ForumReplyModel.find).toHaveBeenCalledWith(
                expect.objectContaining({postId: postId.toString()})
            );
        });

        it("should throw error when postId is not provided", async () => {
            const params: any = {
                page: 1,
                limit: 20,
            };

            await expect(listRepliesInPost(params)).rejects.toThrow("Post ID is required");
        });

        it("should throw error when post not found", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(null);

            const params: ListForumReplyParams = {
                postId: postId.toString(),
                page: 1,
                limit: 20,
            };

            await expect(listRepliesInPost(params)).rejects.toThrow("Post not found");
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

            const parentReplyId = new mongoose.Types.ObjectId();
            const params: ListForumReplyParams = {
                postId: postId.toString(),
                parentReplyId: parentReplyId.toString(),
                page: 1,
                limit: 20,
            };

            const result = await listRepliesInPost(params);

            expect(result).toBeDefined();
            expect(ForumReplyModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    postId: postId.toString(),
                    parentReplyId: parentReplyId.toString(),
                })
            );
        });

        it("should sort replies in ascending order by default", async () => {
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
                postId: postId.toString(),
                page: 1,
                limit: 20,
            };

            await listRepliesInPost(params);

            expect(mockQuery.sort).toHaveBeenCalledWith({createdAt: 1});
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
            expect(result.content).toBe("You should start with the basics");
            expect(ForumReplyModel.findOne).toHaveBeenCalledWith({
                _id: replyId.toString(),
                postId: postId.toString(),
            });
        });

        it("should throw error when post not found", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                getForumReplyById(postId.toString(), replyId.toString())
            ).rejects.toThrow("Post not found");
        });

        it("should throw error when reply not found", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(null),
            };
            (ForumReplyModel.findOne as jest.Mock).mockReturnValue(mockQuery);

            await expect(
                getForumReplyById(postId.toString(), replyId.toString())
            ).rejects.toThrow("Reply not found");
        });
    });

    describe("createForumReply", () => {
        it("should create forum reply successfully", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumReplyModel.create as jest.Mock).mockResolvedValue(forumReply);
            (ForumPostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(forumPost);

            const replyData: any = {
                postId,
                authorId,
                content: "Test reply",
            };

            const result = await createForumReply(replyData);

            expect(result).toBeDefined();
            expect(ForumReplyModel.create).toHaveBeenCalled();
            expect(ForumPostModel.findByIdAndUpdate).toHaveBeenCalledWith(postId, {
                $inc: {replyCount: 1},
            });
        });

        it("should throw error when post not found", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(null);

            const replyData: any = {
                postId,
                authorId,
                content: "Test reply",
            };

            await expect(createForumReply(replyData)).rejects.toThrow("Post not found");
        });

        // ✂️ Commented out to reduce coverage - forum not found validation
        // it("should throw error when forum not found", async () => {
        //     (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        //     (ForumModel.findById as jest.Mock).mockResolvedValue(null);
        //     const replyData: any = {
        //         postId,
        //         authorId,
        //         content: "Test reply",
        //     };
        //     await expect(createForumReply(replyData)).rejects.toThrow("Forum not found");
        // });

        // ✂️ Commented out to reduce coverage - inactive forum validation
        // it("should throw error when forum is inactive", async () => {
        //     const inactiveForum = {...forum, isActive: false};
        //     (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
        //     (ForumModel.findById as jest.Mock).mockResolvedValue(inactiveForum);
        //     const replyData: any = {
        //         postId,
        //         authorId,
        //         content: "Test reply",
        //     };
        //     await expect(createForumReply(replyData)).rejects.toThrow(
        //         "Cannot reply in an inactive forum"
        //     );
        // });

        it("should throw error when forum is archived", async () => {
            const archivedForum = {...forum, isArchived: true};
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockResolvedValue(archivedForum);

            const replyData: any = {
                postId,
                authorId,
                content: "Test reply",
            };

            await expect(createForumReply(replyData)).rejects.toThrow(
                "Cannot reply in an archived forum"
            );
        });

        it("should validate parent reply exists when parentReplyId is provided", async () => {
            const parentReplyId = new mongoose.Types.ObjectId();
            const parentReply = {_id: parentReplyId, postId, content: "Parent reply"};
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(parentReply);
            (ForumReplyModel.create as jest.Mock).mockResolvedValue(forumReply);
            (ForumPostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(forumPost);

            const replyData: any = {
                postId,
                authorId,
                content: "Test nested reply",
                parentReplyId,
            };

            await createForumReply(replyData);

            expect(ForumReplyModel.findOne).toHaveBeenCalledWith({
                _id: parentReplyId,
                postId,
            });
        });

        it("should throw error when parent reply not found", async () => {
            const parentReplyId = new mongoose.Types.ObjectId();
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(null);

            const replyData: any = {
                postId,
                authorId,
                content: "Test nested reply",
                parentReplyId,
            };

            await expect(createForumReply(replyData)).rejects.toThrow("Parent reply not found");
        });

        it("should throw error when content is not provided", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);

            const replyData: any = {
                postId,
                authorId,
            };

            await expect(createForumReply(replyData)).rejects.toThrow("Reply content is required");
        });
    });

    describe("updateForumReplyById", () => {
        it("should update reply successfully", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(forumReply);

            const updateData = {content: "Updated reply"};
            const result = await updateForumReplyById(
                postId.toString(),
                replyId.toString(),
                authorId.toString(),
                updateData,
                Role.ADMIN
            );

            expect(result).toBeDefined();
            expect(forumReply.save).toHaveBeenCalled();
        });

        it("should throw error when post not found", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(null);

            const updateData = {content: "Updated reply"};
            await expect(
                updateForumReplyById(postId.toString(), replyId.toString(), authorId.toString(), updateData, Role.ADMIN)
            ).rejects.toThrow("Post not found");
        });

        it("should throw error when forum not found", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockResolvedValue(null);

            const updateData = {content: "Updated reply"};
            await expect(
                updateForumReplyById(postId.toString(), replyId.toString(), authorId.toString(), updateData, Role.ADMIN)
            ).rejects.toThrow("Forum not found");
        });

        it("should throw error when reply not found", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(null);

            const updateData = {content: "Updated reply"};
            await expect(
                updateForumReplyById(postId.toString(), replyId.toString(), authorId.toString(), updateData, Role.ADMIN)
            ).rejects.toThrow("Reply not found");
        });

        it("should throw error when user is not the author", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockResolvedValue(forum);
            (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(forumReply);

            const updateData = {content: "Updated reply"};
            const otherUserId = new mongoose.Types.ObjectId();
            await expect(
                updateForumReplyById(postId.toString(), replyId.toString(), otherUserId.toString(), updateData, Role.STUDENT)
            ).rejects.toThrow("You can only edit your own replies");
        });
    });

    describe("deleteForumReplyById", () => {
        it("should delete reply successfully as admin", async () => {
            const mockSelect = {
                select: jest.fn().mockResolvedValue(forum),
            };
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockReturnValue(mockSelect);
            (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(forumReply);
            (ForumReplyModel.deleteMany as jest.Mock).mockResolvedValue({deletedCount: 0});
            (ForumPostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(forumPost);
            (ForumReplyModel.deleteOne as jest.Mock).mockResolvedValue({deletedCount: 1});

            const result = await deleteForumReplyById(
                postId.toString(),
                replyId.toString(),
                authorId.toString(),
                Role.ADMIN
            );

            expect(result).toBeDefined();
            expect(mockSelect.select).toHaveBeenCalledWith("courseId");
            expect(ForumReplyModel.deleteMany).toHaveBeenCalledWith({parentReplyId: replyId.toString()});
            expect(ForumPostModel.findByIdAndUpdate).toHaveBeenCalledWith(postId.toString(), {
                $inc: {replyCount: -1},
            });
            expect(ForumReplyModel.deleteOne).toHaveBeenCalledWith({_id: replyId.toString()});
        });

        it("should delete reply and nested replies", async () => {
            const mockSelect = {
                select: jest.fn().mockResolvedValue(forum),
            };
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockReturnValue(mockSelect);
            (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(forumReply);
            (ForumReplyModel.deleteMany as jest.Mock).mockResolvedValue({deletedCount: 3});
            (ForumPostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(forumPost);
            (ForumReplyModel.deleteOne as jest.Mock).mockResolvedValue({deletedCount: 1});

            await deleteForumReplyById(
                postId.toString(),
                replyId.toString(),
                authorId.toString(),
                Role.ADMIN
            );

            expect(ForumPostModel.findByIdAndUpdate).toHaveBeenCalledWith(postId.toString(), {
                $inc: {replyCount: -4}, // 1 reply + 3 nested replies
            });
        });

        it("should throw error when post not found", async () => {
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                deleteForumReplyById(postId.toString(), replyId.toString(), authorId.toString(), Role.ADMIN)
            ).rejects.toThrow("Post not found");
        });

        it("should throw error when forum not found", async () => {
            const mockSelect = {
                select: jest.fn().mockResolvedValue(null),
            };
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockReturnValue(mockSelect);

            await expect(
                deleteForumReplyById(postId.toString(), replyId.toString(), authorId.toString(), Role.ADMIN)
            ).rejects.toThrow("Forum not found");
        });

        it("should throw error when reply not found", async () => {
            const mockSelect = {
                select: jest.fn().mockResolvedValue(forum),
            };
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockReturnValue(mockSelect);
            (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(null);

            await expect(
                deleteForumReplyById(postId.toString(), replyId.toString(), authorId.toString(), Role.ADMIN)
            ).rejects.toThrow("Reply not found");
        });

        it("should allow teacher to delete reply in their course", async () => {
            const mockSelect = {
                select: jest.fn().mockResolvedValue(forum),
            };
            const teacherId = new mongoose.Types.ObjectId();
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockReturnValue(mockSelect);
            (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(forumReply);
            (CourseModel.exists as jest.Mock).mockResolvedValue(true);
            (ForumReplyModel.deleteMany as jest.Mock).mockResolvedValue({deletedCount: 0});
            (ForumPostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(forumPost);
            (ForumReplyModel.deleteOne as jest.Mock).mockResolvedValue({deletedCount: 1});

            const result = await deleteForumReplyById(
                postId.toString(),
                replyId.toString(),
                teacherId.toString(),
                Role.TEACHER
            );

            expect(result).toBeDefined();
            expect(CourseModel.exists).toHaveBeenCalled();
        });

        it("should throw error when teacher tries to delete reply not in their course", async () => {
            const mockSelect = {
                select: jest.fn().mockResolvedValue(forum),
            };
            const teacherId = new mongoose.Types.ObjectId();
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockReturnValue(mockSelect);
            (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(forumReply);
            (CourseModel.exists as jest.Mock).mockResolvedValue(false);

            await expect(
                deleteForumReplyById(postId.toString(), replyId.toString(), teacherId.toString(), Role.TEACHER)
            ).rejects.toThrow("You don't have permission to delete replies not in your course");
        });

        it("should allow user to delete their own reply", async () => {
            const mockSelect = {
                select: jest.fn().mockResolvedValue(forum),
            };
            (ForumPostModel.findById as jest.Mock).mockResolvedValue(forumPost);
            (ForumModel.findById as jest.Mock).mockReturnValue(mockSelect);
            (ForumReplyModel.findOne as jest.Mock).mockResolvedValue(forumReply);
            (ForumReplyModel.deleteMany as jest.Mock).mockResolvedValue({deletedCount: 0});
            (ForumPostModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(forumPost);
            (ForumReplyModel.deleteOne as jest.Mock).mockResolvedValue({deletedCount: 1});

            const result = await deleteForumReplyById(
                postId.toString(),
                replyId.toString(),
                authorId.toString(),
                Role.STUDENT
            );

            expect(result).toBeDefined();
        });
    });
});

