import z from 'zod';
import {ForumType} from '@/types/forum.type';
import {listParamsSchema} from '@/validators/helpers/listParams.schema';
import mongoose from 'mongoose';

// ============= FORUM SCHEMAS =============

export const listForumsSchema = listParamsSchema.extend({
    courseId: z
        .string()
        .min(1, 'courseId is required')
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: 'Valid courseId is required',
        }),
    title: z.string().optional(),
    description: z.string().optional(),
    forumType: z.enum(ForumType).optional(),
    isActive: z
        .string()
        .optional()
        .transform((val) => val === 'true'),
    isArchived: z
        .string()
        .optional()
        .transform((val) => val === 'true'),
    createdBy: z.string().optional(),
});

export type ListForumsQuery = z.infer<typeof listForumsSchema>;

export const createForumSchema = z.object({
    courseId: z
        .string()
        .min(1, 'courseId is required')
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: 'Valid courseId is required',
        }),
    title: z.string().min(1, 'Title is required').max(500),
    description: z.string().optional(),
    forumType: z.enum(ForumType).default(ForumType.DISCUSSION),
    isActive: z.boolean().optional(),
});

export type CreateForumInput = z.infer<typeof createForumSchema>;

export const updateForumSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().optional(),
    forumType: z.enum(ForumType).optional(),
    isActive: z.boolean().optional(),
    isArchived: z.boolean().optional(),
});

export type UpdateForumInput = z.infer<typeof updateForumSchema>;

export const forumIdSchema = z
    .string()
    .min(1, 'forumId is required')
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Valid forumId is required',
    });

// ============= FORUM POST SCHEMAS =============

export const listForumPostsSchema = listParamsSchema.extend({
    authorId: z
        .string()
        .min(1, 'authorId (userId) is required')
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: 'Valid authorId (userId) is required',
        }).optional(),
    title: z.string().optional(),
    content: z.string().optional(),
    pinned: z
        .string()
        .optional()
        .transform((val) => val === 'true'),
    replyCount: z.number().optional(),
});

export type ListForumPostsQuery = z.infer<typeof listForumPostsSchema>;

export const createForumPostSchema = z.object({
    title: z.string().max(500).optional(),
    content: z.string().min(1, 'Content is required'),
    pinned: z.boolean().optional(),
});

export type CreateForumPostInput = z.infer<typeof createForumPostSchema>;

export const updateForumPostSchema = z.object({
    title: z.string().max(500).optional(),
    content: z.string().min(1).optional(),
    pinned: z.boolean().optional(),
});

export type UpdateForumPostInput = z.infer<typeof updateForumPostSchema>;

export const postIdSchema = z
    .string()
    .min(1, 'forumPostId is required')
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Valid forumPostId is required',
    });
// ============= FORUM REPLY SCHEMAS =============

export const listForumRepliesSchema = listParamsSchema.extend({
    authorId: z
        .string()
        .min(1, 'authorId (userId) is required')
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: 'Valid authorId (userId) is required',
        }).optional(),
    parentReplyId: z
        .string()
        .min(1, 'forumReplyId from parent is required')
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: 'Valid forumReplyId from parent is required',
        }).optional(),
});

export type ListForumRepliesQuery = z.infer<typeof listForumRepliesSchema>;

export const createForumReplySchema = z.object({
    content: z.string().min(1, 'Content is required'),
    parentReplyId: z
        .string()
        .min(1, 'forumReplyId from parent is required')
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: 'Valid forumReplyId from parent is required',
        }).optional(),
});

export type CreateForumReplyInput = z.infer<typeof createForumReplySchema>;

export const updateForumReplySchema = z.object({
    content: z.string().min(1, 'Content is required'),
});

export type UpdateForumReplyInput = z.infer<typeof updateForumReplySchema>;

export const replyIdSchema = z
    .string()
    .min(1, 'forumReplyId is required')
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Valid forumReplyId is required',
    });
