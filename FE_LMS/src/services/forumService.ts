import http from "../utils/http";

export type ForumType = "discussion" | "announcement";

export interface CreateForumPayload {
  courseId: string;
  title: string;
  description: string;
  forumType: ForumType;
  isActive: boolean;
}

export interface ForumResponse {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  forumType: ForumType;
  isActive: boolean;
  createdAt?: string;
  createdBy?: {
    _id: string;
    username?: string;
    fullname?: string;
  };
  updatedAt?: string;
  posts?: ForumPost[];
}

export interface ForumQueryParams {
  courseId?: string;
  isActive?: boolean;
}

export interface UpdateForumPayload {
  title?: string;
  description?: string;
  forumType?: ForumType;
  isActive?: boolean;
}

export interface ForumPost {
  _id: string;
  title: string;
  content: string;
  pinned?: boolean;
  replyCount?: number;
  createdAt?: string;
  updatedAt?: string;
  author?: {
    _id: string;
    username?: string;
    fullname?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  };
  replies?: ForumReply[];
}

export interface ForumReply {
  _id: string;
  content: string;
  createdAt?: string;
  parentReplyId?: string | null;
  author?: {
    _id: string;
    username?: string;
    fullname?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
  };
}
export interface CreateForumPostPayload {
  title: string;
  content: string;
  pinned?: boolean;
}

export interface UpdateForumPostPayload {
  title?: string;
  content?: string;
  pinned?: boolean;
}

export interface CreateReplyPayload {
  content: string;
  parentReplyId?: string | null;
}

export interface UpdateReplyPayload {
  content?: string;
}

export interface ReplyQueryParams {
  authorId?: string;
  parentReplyId?: string;
}

export const forumService = {
  getForums: async (params?: ForumQueryParams): Promise<ForumResponse[]> => {
    const query = new URLSearchParams();
    if (params?.courseId) query.append("courseId", params.courseId);
    if (params?.isActive !== undefined) query.append("isActive", String(params.isActive));
    const queryString = query.toString();
    const response = await http.get<ForumResponse[]>(`/forums${queryString ? `?${queryString}` : ""}`);
    const data = Array.isArray(response.data) ? response.data : [];
    return data as ForumResponse[];
  },

  getForumById: async (forumId: string): Promise<ForumResponse> => {
    const response = await http.get<ForumResponse>(`/forums/${forumId}`);
    return response.data as ForumResponse;
  },

  createForum: async (payload: CreateForumPayload): Promise<ForumResponse> => {
    const response = await http.post<ForumResponse>("/forums", payload);
    return response.data as ForumResponse;
  },

  updateForum: async (forumId: string, payload: UpdateForumPayload): Promise<ForumResponse> => {
    const response = await http.patch<ForumResponse>(`/forums/${forumId}`, payload);
    return response.data as ForumResponse;
  },

  deleteForum: async (forumId: string): Promise<void> => {
    await http.del(`/forums/${forumId}`);
  },

  createForumPost: async (forumId: string, payload: CreateForumPostPayload): Promise<ForumPost> => {
    const response = await http.post<ForumPost>(`/forums/${forumId}/posts`, payload);
    return response.data as ForumPost;
  },

  getForumPosts: async (forumId: string, params?: { pinned?: boolean }): Promise<ForumPost[]> => {
    const query = new URLSearchParams();
    if (params?.pinned !== undefined) query.append("pinned", String(params.pinned));
    const qs = query.toString();
    const response = await http.get<ForumPost[]>(`/forums/${forumId}/posts${qs ? `?${qs}` : ""}`);
    const data = Array.isArray(response.data) ? response.data : [];
    return data as ForumPost[];
  },

  getForumPostById: async (forumId: string, postId: string): Promise<ForumPost> => {
    const response = await http.get<ForumPost>(`/forums/${forumId}/posts/${postId}`);
    return response.data as ForumPost;
  },

  updateForumPost: async (
    forumId: string,
    postId: string,
    payload: UpdateForumPostPayload
  ): Promise<ForumPost> => {
    const response = await http.patch<ForumPost>(`/forums/${forumId}/posts/${postId}`, payload);
    return response.data as ForumPost;
  },

  deleteForumPost: async (forumId: string, postId: string): Promise<void> => {
    await http.del(`/forums/${forumId}/posts/${postId}`);
  },

  createReply: async (forumId: string, postId: string, payload: CreateReplyPayload): Promise<ForumReply> => {
    const response = await http.post<ForumReply>(`/forums/${forumId}/posts/${postId}/replies`, payload);
    return response.data as ForumReply;
  },

  getReplies: async (
    forumId: string,
    postId: string,
    params?: ReplyQueryParams
  ): Promise<{ replies: ForumReply[]; meta?: unknown }> => {
    const query = new URLSearchParams();
    if (params?.authorId) query.append("authorId", params.authorId);
    if (params?.parentReplyId) query.append("parentReplyId", params.parentReplyId);
    const qs = query.toString();
    const response = await http.get(`/forums/${forumId}/posts/${postId}/replies${qs ? `?${qs}` : ""}`);
    const payload = response.data;
    const replies = Array.isArray(payload?.data)
      ? (payload.data as ForumReply[])
      : Array.isArray(payload)
      ? (payload as ForumReply[])
      : Array.isArray(response.data)
      ? (response.data as ForumReply[])
      : [];
    return { replies, meta: payload?.meta };
  },

  updateReply: async (
    forumId: string,
    postId: string,
    replyId: string,
    payload: UpdateReplyPayload
  ): Promise<ForumReply> => {
    const response = await http.patch<ForumReply>(`/forums/${forumId}/posts/${postId}/replies/${replyId}`, payload);
    return response.data as ForumReply;
  },

  deleteReply: async (forumId: string, postId: string, replyId: string): Promise<void> => {
    await http.del(`/forums/${forumId}/posts/${postId}/replies/${replyId}`);
  },
};

