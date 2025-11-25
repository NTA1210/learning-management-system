import {ForumModel, ForumPostModel, ForumReplyModel} from "../models";
import appAssert from "../utils/appAssert";
import {CONFLICT, FORBIDDEN, NOT_FOUND} from "../constants/http";
import {ListParams} from "@/types/dto";
import {ForumType} from "@/types/forum.type";
import {IForum, IForumPost, IForumReply, ISpecialist} from "@/types";
import mongoose, {Types} from "mongoose";
import {CourseModel} from "@/models";

// ============= FORUM INTERFACES =============
export interface ListForumParams extends ListParams {
    courseId: string;
    title?: string;
    description?: string;
    forumType?: ForumType;
    isActive?: boolean;
    isArchived?: boolean;
    /** User ID here */
    createdBy?: string;
}

// ============= FORUM POST INTERFACES =============
export interface ListForumPostParams extends ListParams {
    forumId: string;
    authorId?: string;
    title?: string;
    content?: string;
    pinned?: boolean;
}

// ============= FORUM REPLY INTERFACES =============
export interface ListForumReplyParams extends ListParams {
    postId: string;
    authorId?: string;
    parentReplyId?: string;
}

// ============= FORUM SERVICES =============

export const listForumsOfACourse = async ({
    page = 1,
    limit = 10,
    search,
    courseId,
    title,
    description,
    forumType,
    isActive = true,
    isArchived,
    createdBy,
    createdAt,
    updatedAt,
    sortBy = "createdAt",
    sortOrder = "desc",
}: ListForumParams) => {
    // Build filter query
    const filter: any = {};

    // Course ID is required
    appAssert(courseId, NOT_FOUND, "Course ID is required");
    filter.courseId = courseId;

    // Search by title or description (text search)
    if (search) {
        filter.$or = [
            {title: {$regex: search, $options: "i"}},
            {description: {$regex: search, $options: "i"}},
        ];
    }

    if (title) {
        filter.title = {$regex: title, $options: "i"};
    }

    if (description) {
        filter.description = {$regex: description, $options: "i"};
    }

    if (forumType) {
        filter.forumType = forumType;
    }

    if (isActive !== undefined) {
        filter.isActive = isActive;
    }

    if (isArchived !== undefined) {
        filter.isArchived = isArchived;
    }

    if (createdBy) {
        filter.createdBy = createdBy;
    }

    if (createdAt) {
        filter.createdAt = createdAt;
    }

    if (updatedAt) {
        filter.updatedAt = updatedAt;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    console.log("Forum filter:", filter);

    // Execute query with pagination
    const [forums, total] = await Promise.all([
        ForumModel.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate("createdBy", "fullname email avatar_url")
            .lean(),
        ForumModel.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        forums,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage,
            hasPrevPage,
        },
    };
};

export const getForumById = async (forumId: string) => {
    const forum = await ForumModel.findById(forumId)
        .populate("createdBy", "fullname email avatar_url")
        .lean();

    appAssert(forum, NOT_FOUND, "Forum not found");

    return forum;
};

export const createForum = async (data: Omit<IForum, keyof mongoose.Document<mongoose.Types.ObjectId>>) => {
    // Validate courseId exists
    appAssert(data.courseId, NOT_FOUND, "Course ID is required");
    const courseId = await CourseModel.findById(data.courseId);
    appAssert(courseId, NOT_FOUND, "Course ID not found");
    appAssert(data.title, NOT_FOUND, "Forum title is required");

    return await ForumModel.create({
        ...data,
        forumType: data.forumType || ForumType.DISCUSSION,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isArchived: false,
    });
};

export const updateForumById = async (
    forumId: string,
    data: Partial<IForum>
) => {
    const forum = await ForumModel.findById(forumId);
    appAssert(forum, NOT_FOUND, "Forum not found");

    Object.assign(forum, data);
    await forum.save();
    return forum;
};

export const deleteForumById = async (forumId: string) => {
    const forum = await ForumModel.findById(forumId);
    appAssert(forum, NOT_FOUND, "Forum not found");

    // Check if any posts exist in this forum
    const postsCount = await ForumPostModel.countDocuments({forumId});
    appAssert(
        postsCount === 0,
        CONFLICT,
        `Cannot delete forum. ${postsCount} post${postsCount > 1 ? "s" : ""} exist${postsCount === 1 ? "s" : ""} in this forum.`
    );

    return ForumModel.deleteOne({_id: forumId});
};

// ============= FORUM POST SERVICES =============

export const listPostsInForum = async ({
    page = 1,
    limit = 10,
    search,
    forumId,
    authorId,
    title,
    content,
    pinned,
    createdAt,
    updatedAt,
    sortBy = "createdAt",
    sortOrder = "desc",
}: ListForumPostParams) => {
    // Build filter query
    const filter: any = {};

    // Forum ID is required
    appAssert(forumId, NOT_FOUND, "Forum ID is required");
    filter.forumId = forumId;

    // Verify forum exists
    const forum = await ForumModel.findById(forumId);
    appAssert(forum, NOT_FOUND, "Forum not found");

    // Search by title or content
    if (search) {
        filter.$or = [
            {title: {$regex: search, $options: "i"}},
            {content: {$regex: search, $options: "i"}},
        ];
    }

    if (authorId) {
        filter.authorId = authorId;
    }

    if (title) {
        filter.title = {$regex: title, $options: "i"};
    }

    if (content) {
        filter.content = {$regex: content, $options: "i"};
    }

    if (pinned !== undefined) {
        filter.pinned = pinned;
    }

    if (createdAt) {
        filter.createdAt = createdAt;
    }

    if (updatedAt) {
        filter.updatedAt = updatedAt;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object - pinned posts first, then by sortBy
    const sort: any = {pinned: -1};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const [posts, total] = await Promise.all([
        ForumPostModel.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate("authorId", "fullname email avatar_url")
            .lean(),
        ForumPostModel.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        posts,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage,
            hasPrevPage,
        },
    };
};

export const getForumPostById = async (forumId: string, postId: string) => {
    // Verify forum exists
    const forum = await ForumModel.findById(forumId);
    appAssert(forum, NOT_FOUND, "Forum not found");

    const post = await ForumPostModel.findOne({_id: postId, forumId})
        .populate("authorId", "fullname email avatar_url")
        .lean();

    appAssert(post, NOT_FOUND, "Post not found");

    return post;
};

export const createForumPost = async (data: Omit<IForumPost, keyof mongoose.Document<mongoose.Types.ObjectId>>) => {
    // Verify forum exists
    const forum = await ForumModel.findById(data.forumId);
    appAssert(forum, NOT_FOUND, "Forum not found");

    // Check if forum is active
    appAssert(forum.isActive, FORBIDDEN, "Cannot post in an inactive forum");
    appAssert(!forum.isArchived, FORBIDDEN, "Cannot post in an archived forum");

    // If forum is ANNOUNCEMENT type, only allow certain users (teachers/admins) to post
    // This check should be done in the controller based on user role
    appAssert(forum.forumType === ForumType.DISCUSSION, FORBIDDEN, "You don't have permission to post in this forum");

    appAssert(data.content, NOT_FOUND, "Post content is required");

    return await ForumPostModel.create({
        ...data,
        pinned: data.pinned || false,
        replyCount: 0,
    });
};

export const updateForumPostById = async (
    forumId: string,
    postId: string,
    authorId: string,
    data: Partial<IForumPost>
) => {
    // Verify forum exists
    const forum = await ForumModel.findById(forumId);
    appAssert(forum, NOT_FOUND, "Forum not found");

    const post = await ForumPostModel.findOne({_id: postId, forumId});
    appAssert(post, NOT_FOUND, "Post not found");

    // Check if user is the author (authorization check - might be done in controller/middleware)
    appAssert(
        post.authorId.toString() === authorId,
        FORBIDDEN,
        "You can only edit your own posts"
    );

    Object.assign(post, data);
    await post.save();
    return post;
};

export const deleteForumPostById = async (
    forumId: string,
    postId: string,
    authorId: string,
) => {
    // Verify forum exists
    const forum = await ForumModel.findById(forumId);
    appAssert(forum, NOT_FOUND, "Forum not found");

    const post = await ForumPostModel.findOne({_id: postId, forumId});
    appAssert(post, NOT_FOUND, "Post not found");

    // Check if user is the author (authorization check - might be done in controller/middleware)
    appAssert(
        post.authorId.toString() === authorId,
        FORBIDDEN,
        "You can only delete your own posts"
    );

    // Delete all replies associated with this post
    await ForumReplyModel.deleteMany({postId});

    return ForumPostModel.deleteOne({_id: postId});
};

// ============= FORUM REPLY SERVICES =============

export const listRepliesInPost = async ({
    page = 1,
    limit = 20,
    search,
    postId,
    authorId,
    parentReplyId,
    createdAt,
    updatedAt,
    sortBy = "createdAt",
    sortOrder = "asc",
}: ListForumReplyParams) => {
    // Build filter query
    const filter: any = {};

    // Post ID is required
    appAssert(postId, NOT_FOUND, "Post ID is required");
    filter.postId = postId;

    // Verify post exists
    const post = await ForumPostModel.findById(postId);
    appAssert(post, NOT_FOUND, "Post not found");

    // Search by content
    if (search) {
        filter.content = {$regex: search, $options: "i"};
    }

    if (authorId) {
        filter.authorId = authorId;
    }

    // Filter by parent reply (for nested replies)
    if (parentReplyId !== undefined) {
        filter.parentReplyId = parentReplyId || null;
    }

    if (createdAt) {
        filter.createdAt = createdAt;
    }

    if (updatedAt) {
        filter.updatedAt = updatedAt;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const [replies, total] = await Promise.all([
        ForumReplyModel.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate("authorId", "fullname email avatar_url")
            .lean(),
        ForumReplyModel.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        replies,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage,
            hasPrevPage,
        },
    };
};

export const getForumReplyById = async (postId: string, replyId: string) => {
    // Verify post exists
    const post = await ForumPostModel.findById(postId);
    appAssert(post, NOT_FOUND, "Post not found");

    const reply = await ForumReplyModel.findOne({_id: replyId, postId})
        .populate("authorId", "fullname email avatar_url")
        .lean();

    appAssert(reply, NOT_FOUND, "Reply not found");

    return reply;
};

export const createForumReply = async (data: Omit<IForumReply, keyof mongoose.Document<mongoose.Types.ObjectId>>) => {
    // Verify post exists
    const post = await ForumPostModel.findById(data.postId);
    appAssert(post, NOT_FOUND, "Post not found");

    // Verify forum is active
    const forum = await ForumModel.findById(post.forumId);
    appAssert(forum, NOT_FOUND, "Forum not found");
    appAssert(forum.isActive, FORBIDDEN, "Cannot reply in an inactive forum");
    appAssert(!forum.isArchived, FORBIDDEN, "Cannot reply in an archived forum");

    // If parentReplyId is provided, verify it exists
    if (data.parentReplyId) {
        const parentReply = await ForumReplyModel.findOne({
            _id: data.parentReplyId,
            postId: data.postId,
        });
        appAssert(parentReply, NOT_FOUND, "Parent reply not found");
    }

    appAssert(data.content, NOT_FOUND, "Reply content is required");

    const reply = await ForumReplyModel.create(data);

    // Increment reply count in post
    await ForumPostModel.findByIdAndUpdate(data.postId, {
        $inc: {replyCount: 1},
    });

    return reply;
};

export const updateForumReplyById = async (
    postId: string,
    replyId: string,
    authorId: string,
    data: Partial<IForumReply>
) => {
    // Verify post exists
    const post = await ForumPostModel.findById(postId);
    appAssert(post, NOT_FOUND, "Post not found");

    const reply = await ForumReplyModel.findOne({_id: replyId, postId});
    appAssert(reply, NOT_FOUND, "Reply not found");

    // Check if user is the author
    appAssert(
        reply.authorId.toString() === authorId,
        FORBIDDEN,
        "You can only edit your own replies"
    );

    Object.assign(reply, data);
    await reply.save();
    return reply;
};

export const deleteForumReplyById = async (
    postId: string,
    replyId: string,
    authorId: string
) => {
    // Verify post exists
    const post = await ForumPostModel.findById(postId);
    appAssert(post, NOT_FOUND, "Post not found");

    const reply = await ForumReplyModel.findOne({_id: replyId, postId});
    appAssert(reply, NOT_FOUND, "Reply not found");

    // Check if user is the author
    appAssert(
        reply.authorId.toString() === authorId,
        FORBIDDEN,
        "You can only delete your own replies"
    );

    // Delete nested replies
    await ForumReplyModel.deleteMany({parentReplyId: replyId});

    // Decrement reply count in post
    await ForumPostModel.findByIdAndUpdate(postId, {
        $inc: {replyCount: -1},
    });

    return ForumReplyModel.deleteOne({_id: replyId});
};