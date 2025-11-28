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
    avatar_url?: string;
    role?: string;
  };
  updatedAt?: string;
  posts?: ForumPost[];
  key?: string[];
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
  key?: string[];
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
  key?: string[];
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

type UploadableFiles = File | FileList | File[] | null | undefined;

const buildMultipartPayload = (payload: Record<string, unknown>, files?: UploadableFiles) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof Blob) {
      formData.append(key, value);
      return;
    }
    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, String(value));
  });

  if (files) {
    const normalizedFiles: File[] =
      files instanceof FileList
        ? Array.from(files).filter((file): file is File => Boolean(file))
        : Array.isArray(files)
        ? files.filter((file): file is File => Boolean(file))
        : files instanceof File
        ? [files]
        : [];

    normalizedFiles.forEach((file) => formData.append("files", file));
  }

  return formData;
};

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

  createForum: async (payload: CreateForumPayload, files?: UploadableFiles): Promise<ForumResponse> => {
    const formData = buildMultipartPayload(payload, files);
    const response = await http.post<ForumResponse>("/forums", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data as ForumResponse;
  },

  updateForum: async (forumId: string, payload: UpdateForumPayload, files?: UploadableFiles): Promise<ForumResponse> => {
    const formData = buildMultipartPayload(payload, files);
    const response = await http.patch<ForumResponse>(`/forums/${forumId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data as ForumResponse;
  },

  deleteForum: async (forumId: string): Promise<void> => {
    await http.del(`/forums/${forumId}`);
  },

  createForumPost: async (forumId: string, payload: CreateForumPostPayload, files?: UploadableFiles): Promise<ForumPost> => {
    const formData = buildMultipartPayload(payload, files);
    const response = await http.post<ForumPost>(`/forums/${forumId}/posts`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
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
    payload: UpdateForumPostPayload,
    files?: UploadableFiles
  ): Promise<ForumPost> => {
    const formData = buildMultipartPayload(payload, files);
    const response = await http.patch<ForumPost>(`/forums/${forumId}/posts/${postId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data as ForumPost;
  },

  deleteForumPost: async (forumId: string, postId: string): Promise<void> => {
    await http.del(`/forums/${forumId}/posts/${postId}`);
  },

  createReply: async (
    forumId: string,
    postId: string,
    payload: CreateReplyPayload,
    files?: UploadableFiles
  ): Promise<ForumReply> => {
    const formData = buildMultipartPayload(payload, files);
    const response = await http.post<ForumReply>(`/forums/${forumId}/posts/${postId}/replies`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
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
    payload: UpdateReplyPayload,
    files?: UploadableFiles
  ): Promise<ForumReply> => {
    const formData = buildMultipartPayload(payload, files);
    const response = await http.patch<ForumReply>(`/forums/${forumId}/posts/${postId}/replies/${replyId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data as ForumReply;
  },

  deleteReply: async (forumId: string, postId: string, replyId: string): Promise<void> => {
    await http.del(`/forums/${forumId}/posts/${postId}/replies/${replyId}`);
  },
};

