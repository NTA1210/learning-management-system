import {catchErrors} from "../utils/asyncHandler";
import {OK, CREATED} from "../constants/http";
import {
    listForumsSchema,
    forumIdSchema,
    createForumSchema,
    updateForumSchema,
    listForumPostsSchema,
    postIdSchema,
    createForumPostSchema,
    updateForumPostSchema,
    listForumRepliesSchema,
    replyIdSchema,
    createForumReplySchema,
    updateForumReplySchema,
} from "../validators/forum.schemas";
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
} from "../services/forum.service";
import mongoose from "mongoose";
import {parseFormData} from "@/utils/parseFormData";

// ============= FORUM HANDLERS =============

export const listForumsHandler = catchErrors(async (req, res) => {
    const query = listForumsSchema.parse(req.query);

    const result = await listForumsOfACourse({
        page: query.page,
        limit: query.limit,
        search: query.search,
        courseId: query.courseId,
        title: query.title,
        description: query.description,
        forumType: query.forumType,
        isActive: query.isActive,
        isArchived: query.isArchived,
        createdBy: query.createdBy,
        createdAt: query.createdAt,
        updatedAt: query.updatedAt,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
    });

    return res.success(OK, {
        message: "Forums retrieved successfully",
        data: result.forums,
        pagination: result.pagination,
    });
});

export const getForumByIdHandler = catchErrors(async (req, res) => {
    const forumId = forumIdSchema.parse(req.params.id);

    const forum = await getForumById(forumId);

    return res.success(OK, {
        message: "Forum retrieved successfully",
        data: forum,
    });
});

export const createForumHandler = catchErrors(async (req, res) => {
    const data = createForumSchema.parse(parseFormData(req.body));
    // Get user ID from authenticated user
    const userId = req.userId;

    let file: Express.Multer.File | Express.Multer.File[] | undefined;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Multiple files or single file in array
        file = req.files.length === 1 ? req.files[0] : req.files;
    } else if (req.file) {
        // Single file (fallback for compatibility)
        file = req.file;
    }

    const forum = await createForum({
        ...data,
        courseId: data.courseId as unknown as mongoose.Types.ObjectId,
        createdBy: userId,
    }, file);

    return res.success(CREATED, {
        message: "Forum created successfully",
        data: forum,
    });
});

export const updateForumByIdHandler = catchErrors(async (req, res) => {
    const forumId = forumIdSchema.parse(req.params.id);
    const data = updateForumSchema.parse(parseFormData(req.body));

    const userId = req.userId;
    const role = req.role;

    let file: Express.Multer.File | Express.Multer.File[] | undefined;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Multiple files or single file in array
        file = req.files.length === 1 ? req.files[0] : req.files;
    } else if (req.file) {
        // Single file (fallback for compatibility)
        file = req.file;
    }

    const forum = await updateForumById(forumId, data, userId.toString(), role, file);

    return res.success(OK, {
        message: "Forum updated successfully",
        data: forum,
    });
});

export const deleteForumByIdHandler = catchErrors(async (req, res) => {
    const forumId = forumIdSchema.parse(req.params.id);

    const result = await deleteForumById(forumId);

    return res.success(OK, {
        message: "Forum deleted successfully",
        data: result,
    });
});

// ============= FORUM POST HANDLERS =============

export const listForumPostsHandler = catchErrors(async (req, res) => {
    const forumId = forumIdSchema.parse(req.params.forumId);
    const query = listForumPostsSchema.parse(req.query);

    const result = await listPostsInForum({
        page: query.page,
        limit: query.limit,
        search: query.search,
        forumId,
        authorId: query.authorId,
        title: query.title,
        content: query.content,
        pinned: query.pinned,
        createdAt: query.createdAt,
        updatedAt: query.updatedAt,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
    });

    return res.success(OK, {
        message: "Posts retrieved successfully",
        data: result.posts,
        pagination: result.pagination,
    });
});

export const getForumPostByIdHandler = catchErrors(async (req, res) => {
    const forumId = forumIdSchema.parse(req.params.forumId);
    const postId = postIdSchema.parse(req.params.id);

    const post = await getForumPostById(forumId, postId);

    return res.success(OK, {
        message: "Post retrieved successfully",
        data: post,
    });
});

export const createForumPostHandler = catchErrors(async (req, res) => {
    const forumId = forumIdSchema.parse(req.params.forumId);
    const data = createForumPostSchema.parse(parseFormData(req.body));

    // Get user ID from authenticated user
    const userId = req.userId;

    let file: Express.Multer.File | Express.Multer.File[] | undefined;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Multiple files or single file in array
        file = req.files.length === 1 ? req.files[0] : req.files;
    } else if (req.file) {
        // Single file (fallback for compatibility)
        file = req.file;
    }

    const post = await createForumPost({
        ...data,
        forumId: forumId as unknown as mongoose.Types.ObjectId,
        authorId: userId,
    }, file);

    return res.success(CREATED, {
        message: "Post created successfully",
        data: post,
    });
});

export const updateForumPostByIdHandler = catchErrors(async (req, res) => {
    const forumId = forumIdSchema.parse(req.params.forumId);
    const postId = postIdSchema.parse(req.params.id);
    const data = updateForumPostSchema.parse(parseFormData(req.body));

    // Get user ID from authenticated user
    const userId = req.userId;

    let file: Express.Multer.File | Express.Multer.File[] | undefined;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Multiple files or single file in array
        file = req.files.length === 1 ? req.files[0] : req.files;
    } else if (req.file) {
        // Single file (fallback for compatibility)
        file = req.file;
    }

    const post = await updateForumPostById(forumId, postId, userId.toString(), data, role, file);

    return res.success(OK, {
        message: "Post updated successfully",
        data: post,
    });
});

export const deleteForumPostByIdHandler = catchErrors(async (req, res) => {
    const forumId = forumIdSchema.parse(req.params.forumId);
    const postId = postIdSchema.parse(req.params.id);

    // Get user ID from authenticated user
    const userId = req.userId;
    const role = req.role;

    const result = await deleteForumPostById(forumId, postId, userId.toString(), role);

    return res.success(OK, {
        message: "Post deleted successfully",
        data: result,
    });
});

// ============= FORUM REPLY HANDLERS =============

export const listForumRepliesHandler = catchErrors(async (req, res) => {
    const forumId = forumIdSchema.parse(req.params.forumId);
    const postId = postIdSchema.parse(req.params.postId);
    const query = listForumRepliesSchema.parse(req.query);

    const result = await listRepliesInPost({
        page: query.page,
        limit: query.limit,
        search: query.search,
        postId,
        authorId: query.authorId,
        parentReplyId: query.parentReplyId,
        createdAt: query.createdAt,
        updatedAt: query.updatedAt,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
    });

    return res.success(OK, {
        message: "Replies retrieved successfully",
        data: result.replies,
        pagination: result.pagination,
    });
});

export const getForumReplyByIdHandler = catchErrors(async (req, res) => {
    const postId = postIdSchema.parse(req.params.postId);
    const replyId = replyIdSchema.parse(req.params.id);

    const reply = await getForumReplyById(postId, replyId);

    return res.success(OK, {
        message: "Reply retrieved successfully",
        data: reply,
    });
});

export const createForumReplyHandler = catchErrors(async (req, res) => {
    const postId = postIdSchema.parse(req.params.postId);
    const data = createForumReplySchema.parse(parseFormData(req.body));

    // Get user ID from authenticated user
    const userId = req.userId;
    const role = req.role;

    let file: Express.Multer.File | Express.Multer.File[] | undefined;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Multiple files or single file in array
        file = req.files.length === 1 ? req.files[0] : req.files;
    } else if (req.file) {
        // Single file (fallback for compatibility)
        file = req.file;
    }

    const reply = await createForumReply({
        ...data,
        postId: postId as unknown as mongoose.Types.ObjectId,
        authorId: userId,
        parentReplyId: data.parentReplyId as unknown as mongoose.Types.ObjectId,
    }, file);

    return res.success(CREATED, {
        message: "Reply created successfully",
        data: reply,
    });
});

export const updateForumReplyByIdHandler = catchErrors(async (req, res) => {
    const postId = postIdSchema.parse(req.params.postId);
    const replyId = replyIdSchema.parse(req.params.id);
    const data = updateForumReplySchema.parse(parseFormData(req.body));

    // Get user ID from authenticated user
    const userId = req.userId;
    const role = req.role;

    let file: Express.Multer.File | Express.Multer.File[] | undefined;

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Multiple files or single file in array
        file = req.files.length === 1 ? req.files[0] : req.files;
    } else if (req.file) {
        // Single file (fallback for compatibility)
        file = req.file;
    }

    const reply = await updateForumReplyById(postId, replyId, userId.toString(), data, role, file);

    return res.success(OK, {
        message: "Reply updated successfully",
        data: reply,
    });
});

export const deleteForumReplyByIdHandler = catchErrors(async (req, res) => {
    const postId = postIdSchema.parse(req.params.postId);
    const replyId = replyIdSchema.parse(req.params.id);

    // Get user ID from authenticated user
    const userId = req.userId;

    const result = await deleteForumReplyById(postId, replyId, userId.toString());

    return res.success(OK, {
        message: "Reply deleted successfully",
        data: result,
    });
});
