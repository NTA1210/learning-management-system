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
  
  // Xử lý payload fields
  Object.entries(payload).forEach(([key, value]) => {
    // Bỏ qua undefined và null
    if (value === undefined || value === null) return;
    
    // Xử lý File/Blob trực tiếp
    if (value instanceof Blob || value instanceof File) {
      formData.append(key, value);
      return;
    }
    
    // Xử lý boolean - convert thành string
    if (typeof value === "boolean") {
      formData.append(key, String(value));
      return;
    }
    
    // Xử lý object/array - stringify
    if (typeof value === "object") {
      // Bỏ qua null (đã check ở trên) và Date objects
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
        return;
      }
      formData.append(key, JSON.stringify(value));
      return;
    }
    
    // Xử lý các primitive types khác
    formData.append(key, String(value));
  });

  // Xử lý files
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

// Helper: chuẩn hóa response array
const extractArray = <T>(responseData: any, key?: string): T[] => {
  if (!responseData) return [];
  
  // Nếu có key cụ thể, ưu tiên lấy từ key đó
  if (key && Array.isArray(responseData[key])) {
    return responseData[key];
  }
  
  // Nếu responseData là array trực tiếp
  if (Array.isArray(responseData)) {
    return responseData;
  }
  
  // Nếu có data field và là array
  if (responseData.data && Array.isArray(responseData.data)) {
    return responseData.data;
  }
  
  // Nếu có results field và là array (một số API dùng results)
  if (responseData.results && Array.isArray(responseData.results)) {
    return responseData.results;
  }
  
  return [];
};

// Helper: transform authorId thành author cho ForumPost
const transformForumPost = (post: any): ForumPost => {
  if (!post) return post;
  
  // Nếu có authorId nhưng không có author, map authorId thành author
  if (post.authorId && !post.author) {
    return {
      ...post,
      author: {
        _id: post.authorId._id || post.authorId,
        email: post.authorId.email,
        fullname: post.authorId.fullname,
        username: post.authorId.username,
        avatar_url: post.authorId.avatar_url,
        role: post.authorId.role,
      },
    };
  }
  
  return post;
};

// Helper: transform authorId thành author cho ForumReply
const transformForumReply = (reply: any): ForumReply => {
  if (!reply) return reply;
  
  // Nếu có authorId nhưng không có author, map authorId thành author
  if (reply.authorId && !reply.author) {
    return {
      ...reply,
      author: {
        _id: reply.authorId._id || reply.authorId,
        email: reply.authorId.email,
        fullname: reply.authorId.fullname,
        username: reply.authorId.username,
        avatar_url: reply.authorId.avatar_url,
        role: reply.authorId.role,
      },
    };
  }
  
  return reply;
};

// Helper: transform createdById thành createdBy cho ForumResponse
const transformForumResponse = (forum: any): ForumResponse => {
  if (!forum) return forum;
  
  // Nếu có createdById nhưng không có createdBy, map createdById thành createdBy
  if (forum.createdById && !forum.createdBy) {
    return {
      ...forum,
      createdBy: {
        _id: forum.createdById._id || forum.createdById,
        email: forum.createdById.email,
        fullname: forum.createdById.fullname,
        username: forum.createdById.username,
        avatar_url: forum.createdById.avatar_url,
        role: forum.createdById.role,
      },
    };
  }
  
  return forum;
};

export const forumService = {
  // ===== Forum =====
  getForums: async (params?: ForumQueryParams): Promise<ForumResponse[]> => {
    const query = new URLSearchParams();
    if (params?.courseId) query.append("courseId", params.courseId);
    if (params?.isActive !== undefined) query.append("isActive", String(params.isActive));
    const response = await http.get(`/forums${query.toString() ? `?${query.toString()}` : ""}`);
    const forums = extractArray<ForumResponse>(response);
    return forums.map(transformForumResponse);
  },

  getForumById: async (forumId: string): Promise<ForumResponse> => {
    const response = await http.get(`/forums/${forumId}`);
    return transformForumResponse(response);
  },

  createForum: async (payload: CreateForumPayload, files?: UploadableFiles): Promise<ForumResponse> => {
    const formData = buildMultipartPayload(payload as unknown as Record<string, unknown>, files);
    const response = await http.post("/forums", formData, { headers: { "Content-Type": "multipart/form-data" } });
    return transformForumResponse(response);
  },

  updateForum: async (forumId: string, payload: UpdateForumPayload, files?: UploadableFiles): Promise<ForumResponse> => {
    const formData = buildMultipartPayload(payload as unknown as Record<string, unknown>, files);
    const response = await http.patch(`/forums/${forumId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    return transformForumResponse(response);
  },

  deleteForum: async (forumId: string): Promise<void> => {
    await http.del(`/forums/${forumId}`);
  },

  // ===== Forum Post =====
  getForumPosts: async (forumId: string, params?: { pinned?: boolean }): Promise<ForumPost[]> => {
    const query = new URLSearchParams();
    if (params?.pinned !== undefined) query.append("pinned", String(params.pinned));
    const response = await http.get(`/forums/${forumId}/posts${query.toString() ? `?${query.toString()}` : ""}`);
    const posts = extractArray<ForumPost>(response);
    return posts.map(transformForumPost);
  },

  getForumPostById: async (forumId: string, postId: string): Promise<ForumPost> => {
    const response = await http.get(`/forums/${forumId}/posts/${postId}`);
    return transformForumPost(response);
  },

  createForumPost: async (forumId: string, payload: CreateForumPostPayload, files?: UploadableFiles): Promise<ForumPost> => {
    const formData = buildMultipartPayload(payload as unknown as Record<string, unknown>, files);
    const response = await http.post(`/forums/${forumId}/posts`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    return transformForumPost(response);
  },

  updateForumPost: async (forumId: string, postId: string, payload: UpdateForumPostPayload, files?: UploadableFiles): Promise<ForumPost> => {
    const formData = buildMultipartPayload(payload as unknown as Record<string, unknown>, files);
    const response = await http.patch(`/forums/${forumId}/posts/${postId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    return transformForumPost(response);
  },

  deleteForumPost: async (forumId: string, postId: string): Promise<void> => {
    await http.del(`/forums/${forumId}/posts/${postId}`);
  },

  // ===== Reply =====
  getReplies: async (forumId: string, postId: string, params?: ReplyQueryParams) => {
    const query = new URLSearchParams();
    if (params?.authorId) query.append("authorId", params.authorId);
    if (params?.parentReplyId) query.append("parentReplyId", params.parentReplyId);
    const response = await http.get(`/forums/${forumId}/posts/${postId}/replies${query.toString() ? `?${query.toString()}` : ""}`) as any;
    const replies = extractArray<ForumReply>(response, "replies");
    const transformedReplies = replies.map(transformForumReply);
    const meta = response?.meta;
    return { replies: transformedReplies, meta };
  },

  createReply: async (forumId: string, postId: string, payload: CreateReplyPayload, files?: UploadableFiles): Promise<ForumReply> => {
    const formData = buildMultipartPayload(payload as unknown as Record<string, unknown>, files);
    const response = await http.post(`/forums/${forumId}/posts/${postId}/replies`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    return transformForumReply(response);
  },

  updateReply: async (forumId: string, postId: string, replyId: string, payload: UpdateReplyPayload, files?: UploadableFiles): Promise<ForumReply> => {
    const formData = buildMultipartPayload(payload as unknown as Record<string, unknown>, files);
    const response = await http.patch(`/forums/${forumId}/posts/${postId}/replies/${replyId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    return transformForumReply(response);
  },

  deleteReply: async (forumId: string, postId: string, replyId: string): Promise<void> => {
    await http.del(`/forums/${forumId}/posts/${postId}/replies/${replyId}`);
  },
};
